import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { API_BASE } from "../config";
import { getToken, logout } from "../services/auth";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

function isNativeRuntime(): boolean {
  try {
    const runtimeWindow = window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    };
    return typeof window !== "undefined" && !!runtimeWindow.Capacitor?.isNativePlatform?.();
  } catch (error) {
    console.warn("No se pudo detectar el runtime nativo", error);
    return false;
  }
}

async function commonHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (isNativeRuntime()) {
    try {
      const { value: cookie } = await Preferences.get({ key: "session_cookie" });
      if (cookie) {
        headers.Cookie = cookie;
      }
    } catch (error) {
      console.warn("Error al obtener cookie:", error);
    }
  }

  return headers;
}

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  const baseUrl = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

async function persistNativeCookie(response: HttpResponse): Promise<void> {
  if (response.status !== 200 && response.status !== 201) {
    return;
  }

  const setCookie = response.headers?.["Set-Cookie"] || response.headers?.["set-cookie"];
  if (!setCookie) {
    return;
  }

  try {
    await Preferences.set({
      key: "session_cookie",
      value: setCookie,
    });
  } catch (error) {
    console.warn("Error al guardar cookie:", error);
  }
}

async function handleUnauthorized(message: string): Promise<never> {
  await Preferences.remove({ key: "session_cookie" });
  await logout();
  throw new Error(message);
}

function extractErrorMessage(data: any, fallback: string): string {
  return data?.message || data?.error || fallback;
}

async function handleNativeResponse<T = any>(response: HttpResponse): Promise<T> {
  await persistNativeCookie(response);

  if (response.status >= 200 && response.status < 300) {
    return response.data as T;
  }

  if (response.status === 403) {
    return handleUnauthorized(extractErrorMessage(response.data, "Sesion expirada"));
  }

  if (response.status === 401) {
    throw new Error(extractErrorMessage(response.data, "No autorizado"));
  }

  if (response.status >= 400 && response.status < 500) {
    throw new Error(extractErrorMessage(response.data, `Error ${response.status}`));
  }

  if (response.status >= 500) {
    throw new Error("Error del servidor. Por favor, intenta mas tarde.");
  }

  throw new Error(`Error HTTP ${response.status}`);
}

async function handleWebResponse<T = any>(response: Response): Promise<T> {
  let data: any = null;

  try {
    data = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }
  }

  if (response.ok) {
    return data as T;
  }

  if (response.status === 403) {
    return handleUnauthorized(extractErrorMessage(data, "Sesion expirada"));
  }

  if (response.status === 401) {
    throw new Error(extractErrorMessage(data, "No autorizado"));
  }

  if (response.status >= 400 && response.status < 500) {
    throw new Error(extractErrorMessage(data, `Error ${response.status}`));
  }

  if (response.status >= 500) {
    throw new Error("Error del servidor. Por favor, intenta mas tarde.");
  }

  throw new Error(`Error HTTP ${response.status}`);
}

async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  options: RequestOptions = {},
): Promise<T> {
  const { headers: extraHeaders = {}, requiresAuth = true } = options;
  const headers = {
    ...(await commonHeaders()),
    ...extraHeaders,
  };

  if (!requiresAuth) {
    delete headers.Authorization;
    delete headers.Cookie;
  }

  const token = getToken();
  const hasCookie = !!headers.Cookie;
  if (requiresAuth && !token && !hasCookie) {
    throw new Error("No autenticado");
  }

  const url = buildUrl(endpoint);

  try {
    console.debug("HTTP request:", { method, url, headers, body });

    if (!isNativeRuntime()) {
      delete headers.Cookie;

      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "omit",
      });

      return handleWebResponse<T>(response);
    }

    const response = await CapacitorHttp.request({
      method,
      url,
      headers,
      data: body,
      webFetchExtra: {
        credentials: "omit",
      },
    });

    console.debug("HTTP response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

    return handleNativeResponse<T>(response);
  } catch (error) {
    console.error("HTTP request error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error de conexion");
  }
}

export const api = {
  get: <T = any>(endpoint: string, requiresAuth = true) =>
    request<T>("GET", endpoint, undefined, { requiresAuth }),

  post: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("POST", endpoint, body, { requiresAuth }),

  put: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("PUT", endpoint, body, { requiresAuth }),

  delete: <T = any>(endpoint: string, requiresAuth = true) =>
    request<T>("DELETE", endpoint, undefined, { requiresAuth }),

  patch: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>("PATCH", endpoint, body, { requiresAuth }),
};

export default api;
