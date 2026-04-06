export const USER_ROLES = {
  ADMIN: "admin",
  INSPECTOR: "inspector",
  SALES: "ventas",
  USER: "user",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.INSPECTOR]: "Inspector",
  [USER_ROLES.SALES]: "Ventas",
  [USER_ROLES.USER]: "Usuario",
  usuario: "Usuario",
};

export const COTIZADOR_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SALES, USER_ROLES.USER];
export const INSPECTION_ROLES = [USER_ROLES.ADMIN, USER_ROLES.INSPECTOR];
export const ADMIN_ROLES = [USER_ROLES.ADMIN];
