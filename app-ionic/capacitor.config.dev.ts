import { CapacitorConfig } from '@capacitor/cli';

// Configuración para DESARROLLO con Live Reload
// Usa: CAPACITOR_CONFIG=capacitor.config.dev.ts npx cap run android

const devServerUrl = process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'com.example.appkickoff',
  appName: 'App Kick Off',
  webDir: 'dist',
  server: {
    // Android Emulator puede acceder al host usando 10.0.2.2.
    // Si usas un dispositivo físico, define CAP_SERVER_URL con la IP de tu PC.
    url: devServerUrl,
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
