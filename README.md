# EnSeñas

La app (iPhone) manda los puntos de la mano al servidor (laptop). El servidor lee los guantes por
Bluetooth y responde qué corregir. iPhone y laptop en la misma red Wi-Fi.

## Servidor (laptop)

Requisitos: Python 3.13, [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/BrunoEspina1/mecabite-back.git
cd mecabite-back
uv sync
cp .env.example .env
```

Copia los modelos entrenados a `models/vision/` (`static.joblib` y `dynamic.joblib`).

En `.env`:

```ini
VISION_HOLD_MS=1000
GLOVE_LIVE=true
GLOVE_REQUIRED=true
```

Arranca:

```bash
uv run fastapi dev app/main.py --host 0.0.0.0
ipconfig getifaddr en0
```

El segundo comando da la IP de la laptop.

## App (iPhone)

Requisitos: Node.js, Xcode, iPhone conectado por cable. No funciona en Expo Go.

```bash
git clone https://github.com/BrunoEspina1/mecabite-front.git
cd mecabite-front
npm install
npx expo run:ios --device
```

En la app, Ajustes > Ajustes de conexión:

1. Apaga "Backend simulado".
2. URL del servidor: `http://<ip-de-la-laptop>:8000`.
3. Probar conexión.

## Problemas

- Sin conexión: misma Wi-Fi, servidor con `--host 0.0.0.0`, IP actual de la laptop.
- "Conecta el guante": guante encendido y sin conectar a otra computadora.
- `MODEL_NOT_AVAILABLE`: faltan los modelos en `models/vision/`.
