// Monitor de Bateria e Notificações Discretas

// Função para solicitar permissão de Notificação do Windows/Navegador
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// Enviar Notificação Sutil de Bateria Fraca
function sendLowBatteryNotification(deviceName, percentage) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🔋 Bateria Fraca — RGB Control", {
            body: `O dispositivo ${deviceName} está com apenas ${percentage}% de bateria. Conecte o carregador.`,
            icon: "icon.png",
            silent: false
        });
    }
}

// Verificação Periódica (Roda a cada 5 minutos em background)
function startBatteryMonitoring() {
    setInterval(() => {
        // Exemplo de checagem automatizada nos periféricos conectados
        const devices = [
            { name: "G703 LIGHTSPEED", battery: 95 },
            { name: "PRO X KEYBOARD", battery: 80 },
            { name: "PRO X HEADSET", battery: 12 } // Exemplo: alerta dispara aqui
        ];

        devices.forEach(device => {
            if (device.battery <= 15) {
                sendLowBatteryNotification(device.name, device.battery);
            }
        });
    }, 5 * 60 * 1000); // 5 minutos
}

// Inicializar quando o app abrir
document.addEventListener("DOMContentLoaded", () => {
    requestNotificationPermission();
    startBatteryMonitoring();
});