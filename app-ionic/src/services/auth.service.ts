/**
 * Servicio de Autenticacion
 * Refactorizado con patron de sgu-mobile
 */
import api from "../lib/api";
import { profileData } from "../storage";
import { USE_MOCK_FALLBACK } from "../config";
import { Preferences } from "@capacitor/preferences";
import queryClient from "../queryClient";
import { normalizeAppUser } from "./user.utils";

const TOKEN_KEY = "app_kickoff_token";
const USER_KEY = "app_kickoff_user";
const AUTH_KEY = "app_kickoff_authenticated";

// Interfaces
export interface Credentials {
  username: string;
  password: string;
}

export interface RegisterData {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  mobile?: string;
}

export interface UserData {
  id?: number;
  username: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  token?: string;
  dni?: string;
  mobile?: string;
}

/**
 * Iniciar sesion
 */
async function signin(credentials: Credentials): Promise<UserData> {
  if (!credentials.username || !credentials.password) {
    throw new Error("Credenciales invalidas");
  }

  try {
    const usernameOrEmail = credentials.username.trim();
    const payload = usernameOrEmail.includes("@")
      ? { email: usernameOrEmail, password: credentials.password }
      : { username: usernameOrEmail, password: credentials.password };

    const data = await api.post<any>("/api/auth/signin", payload, false);

    await Preferences.set({ key: AUTH_KEY, value: "true" });
    localStorage.setItem(AUTH_KEY, "true");

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      await Preferences.set({ key: TOKEN_KEY, value: data.token });
    }

    const normalized = normalizeAppUser(data);
    const userInfo: UserData = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: normalized?.name || data.name,
      role: data.role,
      dni: (data as any).dni,
      ...(normalized?.firstName ? { firstName: normalized.firstName } : {}),
      ...(normalized?.lastName ? { lastName: normalized.lastName } : {}),
      ...(normalized?.mobile ? { mobile: normalized.mobile } : {}),
    };

    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(userInfo) });
    await profileData.set(userInfo);

    try {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      console.warn("queryClient.invalidateQueries failed", e);
    }

    return userInfo;
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 300));
      const fakeToken = btoa(`${credentials.username}:token`);
      const mockUser: UserData = {
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        name: "Usuario de Prueba",
      };

      localStorage.setItem(TOKEN_KEY, fakeToken);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      await profileData.set(mockUser);

      try {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
      } catch (e) {
        console.warn("queryClient.invalidateQueries failed (mock)", e);
      }

      return mockUser;
    }
    throw err;
  }
}

/**
 * Registrar nuevo usuario
 */
async function signup(userData: RegisterData): Promise<any> {
  try {
    const data = await api.post(
      "/api/auth/signup",
      userData,
      false,
    );
    return data;
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 300));
      return { message: "Registro exitoso (mock)" };
    }
    throw err;
  }
}

/**
 * Cerrar sesion
 */
async function signout(): Promise<void> {
  try {
    await api.post("/api/auth/signout", {}, true);
  } catch (err) {
    console.error("Error al cerrar sesion:", err);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KEY);
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: AUTH_KEY });
    await Preferences.remove({ key: USER_KEY });
    await Preferences.remove({ key: "session_cookie" });
    await profileData.clear();
  }
}

/**
 * Obtener informacion del usuario actual
 */
async function user(): Promise<UserData | null> {
  try {
    const data = await api.get<UserData>("/api/auth/user");
    const normalized = normalizeAppUser(data);
    const mergedData = {
      ...data,
      ...normalized,
      name: normalized?.name || data.name,
    };

    await profileData.set(mergedData);
    localStorage.setItem(USER_KEY, JSON.stringify(mergedData));
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(mergedData) });

    return mergedData;
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    return null;
  }
}

function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

async function isAuthenticatedAsync(): Promise<boolean> {
  const { value } = await Preferences.get({ key: AUTH_KEY });
  console.log("Checking AUTH_KEY:", value);
  return value === "true";
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser(): UserData | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

async function getCurrentUserFromStorage(): Promise<UserData | null> {
  try {
    const userData = await profileData.get();
    return userData;
  } catch {
    return null;
  }
}

export const authService = {
  signin,
  signup,
  signout,
  user,
  isAuthenticated,
  isAuthenticatedAsync,
  getToken,
  getCurrentUser,
  getCurrentUserFromStorage,
};

export const register = signup;
export const logout = signout;
export { isAuthenticated, getToken, getCurrentUser };

export async function login(credentials: { email: string; password: string }) {
  const data = await api.post("/api/auth/login", credentials, false);
  await queryClient.invalidateQueries({ queryKey: ["profile"] });
  return data;
}
