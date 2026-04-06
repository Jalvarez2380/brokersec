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

const RENDER_BACKEND_URL = "https://brokersec-backend.onrender.com";
const LOCAL_WEB_BACKEND = "http://localhost:3001";
const DEFAULT_WEB = ENV_API_URL || LEGACY_API_BASE || RENDER_BACKEND_URL;

function isLocalNetwork(hostname: string): boolean {
  // localhost e IPs privadas (red local de desarrollo)
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.startsWith("192.168.")) return true;
  if (hostname.startsWith("10.")) return true;
  // 172.16.0.0 – 172.31.255.255
  const parts = hostname.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
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
    console.debug("resolveApiBase: unable to detect Capacitor platform", e);
  }

  // En desarrollo web (localhost o red local)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isHttps = window.location.protocol === "https:";
    if (isLocalNetwork(hostname)) {
      // Si la app corre en HTTPS usar rutas relativas para que el proxy de Vite
      // reenvíe /api/* al backend HTTP sin mixed-content
      if (isHttps) return "";
      if (ENV_API_URL || LEGACY_API_BASE) return ENV_API_URL || LEGACY_API_BASE;
      const backendHost = hostname === "localhost" || hostname === "127.0.0.1"
        ? "localhost" : hostname;
      return `http://${backendHost}:3001`;
    }
  }

  // En producción/remoto, usar Render.
  return DEFAULT_WEB;
}

export const API_BASE = resolveApiBase();

// Mantener en false para forzar el uso del backend real.
export const USE_MOCK_FALLBACK = false;
