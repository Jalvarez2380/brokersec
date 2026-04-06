const USER_ROLES = {
  ADMIN: 'admin',
  INSPECTOR: 'inspector',
  SALES: 'ventas',
  USER: 'user',
};

const ROLE_ALIASES = {
  admin: USER_ROLES.ADMIN,
  administrador: USER_ROLES.ADMIN,
  inspector: USER_ROLES.INSPECTOR,
  ventas: USER_ROLES.SALES,
  sales: USER_ROLES.SALES,
  vendedor: USER_ROLES.SALES,
  vendedora: USER_ROLES.SALES,
  user: USER_ROLES.USER,
  usuario: USER_ROLES.USER,
  cliente: USER_ROLES.USER,
};

function normalizeRole(role) {
  if (!role) return USER_ROLES.USER;
  return ROLE_ALIASES[String(role).trim().toLowerCase()] || USER_ROLES.USER;
}

function hasRole(role, allowedRoles = []) {
  const normalizedRole = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(normalizedRole);
}

module.exports = {
  USER_ROLES,
  normalizeRole,
  hasRole,
};
