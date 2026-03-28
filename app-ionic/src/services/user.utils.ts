export interface AppUser {
  id?: number;
  dni?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  mobile?: string;
  name?: string;
  role?: string;
}

export function normalizeAppUser(raw: any): AppUser | null {
  if (!raw || typeof raw !== "object") return null;

  const firstName = raw.firstName || raw.nombre || raw.name?.split?.(" ")?.[0] || "";
  const lastName =
    raw.lastName ||
    raw.apellido ||
    (typeof raw.name === "string" ? raw.name.split(" ").slice(1).join(" ") : "") ||
    "";

  return {
    id: raw.id ? Number(raw.id) : undefined,
    dni: raw.dni || raw.cedula,
    firstName,
    lastName,
    email: raw.email,
    username: raw.username || raw.usuario,
    mobile: raw.mobile || raw.telefono,
    name: raw.name || `${firstName} ${lastName}`.trim(),
    role: raw.role,
  };
}

export function getUserDisplayName(user: AppUser | null): string {
  if (!user) return "";
  return user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
}

export function hasRole(user: AppUser | null, allowedRoles: string[]): boolean {
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}
