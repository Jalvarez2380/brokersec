import api from "../lib/api";

export interface ManagedUser {
  id: number;
  dni?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  mobile?: string;
  role?: string;
}

export interface CreateManagedUserPayload {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  mobile?: string;
  role: string;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const response = await api.get<{ success: boolean; data: ManagedUser[] }>("/api/users");
  return response.data || [];
}

export async function createManagedUser(payload: CreateManagedUserPayload): Promise<ManagedUser> {
  const response = await api.post<{ success: boolean; data: ManagedUser }>("/api/users", payload);
  return response.data;
}
