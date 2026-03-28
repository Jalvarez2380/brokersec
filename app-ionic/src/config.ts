// Configuración de API - se determina automáticamente según plataforma.
// Se ha corregido al puerto 3001 para conectar con el Backend de BROKERSEC.

import { Capacitor } from "@capacitor/core";

// @ts-ignore - Vite env variables are available at runtime
const ENV_API_URL = import.meta.env.VITE_API_URL;
// @ts-ignore - compatibilidad con configuracion antigua
const LEGACY_API_BASE = import.meta.env.VITE_API_BASE;
// @ts-ignore
const OVERRIDE_IOS = import.meta.env.VITE_API_URL_IOS;
// @ts-ignore
const OVERRIDE_ANDROID = import.meta.env.VITE_API_URL_ANDROID;

function resolveWebApiBase(): string {
  if (ENV_API_URL || LEGACY_API_BASE) {
    return ENV_API_URL || LEGACY_API_BASE;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "127.0.0.1";
    return `http://${hostname}:3001`;
  }

  return "http://127.0.0.1:3001";
}

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

  // En web, usar siempre el backend local configurado para PostgreSQL.
  return resolveWebApiBase();
}

export const API_BASE = resolveApiBase();

// Mantener en false para forzar el uso del backend real.
export const USE_MOCK_FALLBACK = false;
