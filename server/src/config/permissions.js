export const PERMISSIONS = [
  'dashboard:view',
  'products:read', 'products:write', 'categories:write',
  'orders:read', 'orders:update', 'payments:update', 'tracking:write',
  'customers:read', 'customers:write',
  'reviews:moderate', 'support:manage',
  'marketing:manage', 'ads:manage', 'chatbot:manage', 'content:manage',
  'settings:read', 'settings:write',
  'admins:manage', 'audit:read',
];

const without = (list) => PERMISSIONS.filter((p) => !list.includes(p));

// Owner = everything. Other roles are defined now so adding staff later needs no code change.
export const ROLE_PERMISSIONS = {
  owner: PERMISSIONS,
  super_admin: without(['admins:manage']),
  admin: without(['admins:manage', 'audit:read', 'settings:write']),
  order_manager: ['dashboard:view', 'orders:read', 'orders:update', 'payments:update', 'tracking:write', 'customers:read', 'customers:write'],
  product_manager: ['dashboard:view', 'products:read', 'products:write', 'categories:write'],
  support_manager: ['dashboard:view', 'support:manage', 'chatbot:manage', 'reviews:moderate', 'orders:read', 'customers:read', 'customers:write'],
  marketing_manager: ['dashboard:view', 'marketing:manage', 'ads:manage'],
  content_manager: ['dashboard:view', 'content:manage', 'products:read'],
};

export const permissionsFor = (admin) => new Set([...(ROLE_PERMISSIONS[admin.role] || []), ...(admin.permissions || [])]);
