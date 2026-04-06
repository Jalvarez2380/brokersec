import { USER_ROLES } from "../constants/roles";

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
  roles?: string[];
}

const ROLE_ALIASES: Record<string, string> = {
  admin: USER_ROLES.ADMIN,
  administrador: USER_ROLES.ADMIN,
  inspector: USER_ROLES.INSPECTOR,
  ventas: USER_ROLES.SALES,
  sales: USER_ROLES.SALES,
  vendedor: USER_ROLES.SALES,
  vendedora: USER_ROLES.SALES,
  usuario: USER_ROLES.USER,
  user: USER_ROLES.USER,
  cliente: USER_ROLES.USER,
};

export function normalizeRole(role?: string): string {
  if (!role) return USER_ROLES.USER;
  return ROLE_ALIASES[String(role).trim().toLowerCase()] || USER_ROLES.USER;
}

export function normalizeAppUser(raw: any): AppUser | null {
  if (!raw || typeof raw !== "object") return null;

  const firstName = raw.firstName || raw.nombre || raw.name?.split?.(" ")?.[0] || "";
  const lastName =
    raw.lastName ||
    raw.apellido ||
    (typeof raw.name === "string" ? raw.name.split(" ").slice(1).join(" ") : "") ||
    "";

  const roles = Array.isArray(raw.roles)
    ? raw.roles.map((role: string) => normalizeRole(role))
    : raw.role
      ? [normalizeRole(raw.role)]
      : [USER_ROLES.USER];

  return {
    id: raw.id ? Number(raw.id) : undefined,
    dni: raw.dni || raw.cedula,
    firstName,
    lastName,
    email: raw.email,
    username: raw.username || raw.usuario,
    mobile: raw.mobile || raw.telefono,
    name: raw.name || `${firstName} ${lastName}`.trim(),
    role: normalizeRole(raw.role || roles[0]),
    roles,
  };
}

export function hasRole(user: AppUser | null, allowedRoles: string[]): boolean {
  if (!user) return false;

  const userRoles = [user.role, ...(user.roles || [])]
    .filter(Boolean)
    .map((role) => normalizeRole(role));

  return allowedRoles.map((role) => normalizeRole(role)).some((role) => userRoles.includes(role));
}

export function getUserDisplayName(user: AppUser | null): string {
  if (!user) return "";
  return user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
}
