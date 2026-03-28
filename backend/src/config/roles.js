const USER_ROLES = {
  ADMIN: 'admin',
  SALES: 'ventas',
  USER: 'usuario',
};

const ALLOWED_ROLES = Object.values(USER_ROLES);

function normalizeRole(role) {
  if (!role) return USER_ROLES.USER;

  const normalized = String(role).trim().toLowerCase();
  return ALLOWED_ROLES.includes(normalized) ? normalized : USER_ROLES.USER;
}

module.exports = {
  USER_ROLES,
  ALLOWED_ROLES,
  normalizeRole,
};
