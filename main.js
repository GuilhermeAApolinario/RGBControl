const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const HID = require('node-hid');
const net = require('net');
const { OpenRGBClient } = require('openrgb-sdk');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "RGB & Battery Controller - Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
}

// 1. Listar dispositivos HID conectados
ipcMain.handle('get-hid-devices', async () => {
  try {
    const devices = HID.devices();
    return devices.map(d => ({
      vendorId: d.vendorId,
      productId: d.productId,
      productName: d.product || 'Desconhecido',
      manufacturer: d.manufacturer || 'Genérico',
      path: d.path,
      usagePage: d.usagePage
    }));
  } catch (err) {
    console.error('Erro ao listar dispositivos HID:', err);
    return [];
  }
});

// 2. Leitura de Bateria Específica (Logitech / Razer)
ipcMain.handle('read-device-battery', async (event, { path, vendorId }) => {
  let device = null;
  try {
    device = new HID.HID(path);
    if (vendorId === 0x046D) {
      return lerBateriaLogitech(device);
    } else if (vendorId === 0x1532) {
      return lerBateriaRazer(device);
    } else {
      return { success: false, message: 'Protocolo específico não mapeado.' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (device) { try { device.close(); } catch(e) {} }
  }
});

function lerBateriaLogitech(device) {
  const buffer = [0x11, 0xFF, 0x07, 0x00, 0x00, 0x00, 0x00];
  try {
    device.write(buffer);
    const res = device.readTimeout(1000);
    if (res && res.length > 0) {
      return { success: true, battery: res[4], charging: res[5] === 1, brand: 'Logitech' };
    }
  } catch (e) {}
  return { success: false, message: 'Sem resposta do dongle Logitech.' };
}

function lerBateriaRazer(device) {
  try {
    const data = device.getFeatureReport(0x00, 64);
    if (data && data.length > 0) {
      return { success: true, battery: data[10] || 0, charging: data[9] === 1, brand: 'Razer' };
    }
  } catch (e) {}
  return { success: false, message: 'Sem resposta do dispositivo Razer.' };
}

// 3. Controle ARGB via OpenRGB SDK
ipcMain.handle('atualizar-leds-openrgb', async (event, { r, g, b }) => {
  try {
    const client = new OpenRGBClient({
      clientName: 'Meu App ARGB',
      port: 6742,
      host: '127.0.0.1'
    });

    await client.connect();
    const deviceCount = await client.getControllerCount();

    for (let i = 0; i < deviceCount; i++) {
      await client.updateMode(i, 0);
      const leds = await client.getControllerLEDs(i);
      const colorArray = leds.map(() => ({ red: r, green: g, blue: b }));
      await client.updateLeds(i, colorArray);
    }

    await client.disconnect();
    return { success: true };
  } catch (error) {
    console.error('Erro ao comunicar com OpenRGB:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});