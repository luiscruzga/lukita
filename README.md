<p align="center">
  <img src="assets/brand/logo-full.svg" alt="Lukita" width="320" />
</p>

# Lukita

App de descuentos y beneficios en Chile (bancos, tarjetas y comercios), para Android y web.

## Descargar

Descarga el APK de Android desde el [último release](https://github.com/luiscruzga/lukita/releases/latest). La app avisa sola cuando hay una versión nueva.

## Desarrollo

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY y EXPO_PUBLIC_API_URL
npm run web            # o npm start / npm run android
npm run typecheck
```

Hecha con Expo + React Native + expo-router. La API vive en un repo privado aparte.

## Releases

1. Sube la versión en `app.json` (`expo.version`) y `package.json`.
2. `git tag v1.0.1 && git push origin v1.0.1`.
3. `android-apk.yml` compila el APK y publica el release `lukita-v1.0.1.apk`.

Secrets del repo: `EXPO_TOKEN`, `APP_DOTENV` (solo `EXPO_PUBLIC_*`), `GOOGLE_SERVICES_JSON` y, para la web, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
