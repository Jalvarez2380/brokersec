export const USER_ROLES = {
  ADMIN: "admin",
  SALES: "ventas",
  USER: "usuario",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.SALES]: "Ventas",
  [USER_ROLES.USER]: "Usuario",
};

export const COTIZADOR_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SALES];
export const USER_MANAGEMENT_ROLES = [USER_ROLES.ADMIN];
