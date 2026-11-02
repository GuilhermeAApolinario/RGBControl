import sys
import json
import urllib.request
import ctypes

OPENRGB_HOST = "http://127.0.0.1:6742/api/v1"

def control_hardware(payload):
    device_type = payload.get('device', 'mouse')
    color_hex = payload.get('color', '#00b4d8')
    effect = payload.get('effect', 'fixed')
    brightness = payload.get('brightness', 100)
    dpi = payload.get('dpi', 800)

    # 1. Trata cor (HEX -> RGB)
    hex_clean = color_hex.lstrip('#')
    r = int(hex_clean[0:2], 16)
    g = int(hex_clean[2:4], 16)
    b = int(hex_clean[4:6], 16)

    # 2. Envia alteração de RGB para o OpenRGB
    openrgb_data = json.dumps({
        "device": device_type,
        "mode": effect,
        "color": {"r": r, "g": g, "b": b},
        "brightness": brightness / 100.0
    }).encode('utf-8')

    try:
        req = urllib.request.Request(
            f"{OPENRGB_HOST}/devices/apply",
            data=openrgb_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=1) as resp:
            pass
    except Exception:
        pass

    # 3. Altera a sensibilidade (DPI) no Windows via ctypes
    if device_type == 'mouse' and dpi:
        try:
            dpi_map = {400: 4, 800: 10, 1600: 14, 3200: 18}
            win_speed = dpi_map.get(int(dpi), 10)
            ctypes.windll.user32.SystemParametersInfoW(113, 0, win_speed, 0)
        except Exception:
            pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            control_hardware(input_data)
        except Exception as e:
            print(f"Erro: {e}")