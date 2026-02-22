// Configuración de API - se determina automáticamente según plataforma.
// Se ha corregido al puerto 3001 para conectar con el Backend de BROKERSEC.

import { Capacitor } from "@capacitor/core";

// @ts-ignore - Vite env variables are available at runtime
// Se cambia localhost por 127.0.0.1 y puerto 3000 por 3001
const DEFAULT_WEB = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
// @ts-ignore
const OVERRIDE_IOS = import.meta.env.VITE_API_URL_IOS;
// @ts-ignore
const OVERRIDE_ANDROID = import.meta.env.VITE_API_URL_ANDROID;

function resolveApiBase(): string {
  try {
    // Si estamos en ejecución nativa (iOS/Android), usar rutas apropiadas
    if (
      Capacitor &&
      Capacitor.isNativePlatform &&
      Capacitor.isNativePlatform()
    ) {
      const platform = Capacitor.getPlatform();
      if (platform === "android") {
        // Para emulador de Android se usa la IP especial 10.0.2.2
        return OVERRIDE_ANDROID || "http://10.0.2.2:3001";
      }
      if (platform === "ios") {
        return OVERRIDE_IOS || "http://127.0.0.1:3001";
      }
    }
  } catch (e) {
    // Ignorar y usar valor por defecto
    console.debug("resolveApiBase: unable to detect Capacitor platform", e);
  }

  // Por defecto, usar URL de entorno o 127.0.0.1 para web
  return DEFAULT_WEB;
}

export const API_BASE = resolveApiBase();

// ================================================================
// CAMBIO CLAVE: Se activa el MOCK en TRUE para entrar sin Backend
// ================================================================
export const USE_MOCK_FALLBACK = true;
