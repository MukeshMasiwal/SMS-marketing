export enum Permission {
  // Operational Permissions (ADMIN & SUPER_ADMIN)
  VIEW_USERS = "VIEW_USERS",
  MANAGE_USERS = "MANAGE_USERS",
  SUSPEND_USERS = "SUSPEND_USERS",
  VIEW_CAMPAIGNS = "VIEW_CAMPAIGNS",
  VIEW_MESSAGES = "VIEW_MESSAGES",
  VIEW_CONTACTS = "VIEW_CONTACTS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  MANAGE_TEMPLATES = "MANAGE_TEMPLATES",
  MANAGE_CAMPAIGNS = "MANAGE_CAMPAIGNS",
  MANAGE_MESSAGES = "MANAGE_MESSAGES",

  // Sensitive Platform Permissions (SUPER_ADMIN ONLY)
  VIEW_ADMINS = "VIEW_ADMINS",
  CREATE_ADMIN = "CREATE_ADMIN",
  DELETE_ADMIN = "DELETE_ADMIN",
  CHANGE_USER_ROLE = "CHANGE_USER_ROLE",
  MANAGE_ROLES = "MANAGE_ROLES",
  MANAGE_PERMISSIONS = "MANAGE_PERMISSIONS",
  MANAGE_PROVIDER_SETTINGS = "MANAGE_PROVIDER_SETTINGS",
  MANAGE_EXOTEL = "MANAGE_EXOTEL",
  MANAGE_SYSTEM_SETTINGS = "MANAGE_SYSTEM_SETTINGS",
  MANAGE_SECURITY_SETTINGS = "MANAGE_SECURITY_SETTINGS",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  VIEW_SYSTEM_HEALTH = "VIEW_SYSTEM_HEALTH",
  DATABASE_MAINTENANCE = "DATABASE_MAINTENANCE",
}

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.SUSPEND_USERS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_MESSAGES,
    Permission.VIEW_CONTACTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_TEMPLATES,
    Permission.MANAGE_CAMPAIGNS,
    Permission.MANAGE_MESSAGES,
  ],
  USER: [
    Permission.VIEW_CONTACTS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_MESSAGES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_TEMPLATES,
    Permission.MANAGE_CAMPAIGNS,
    Permission.MANAGE_MESSAGES,
  ],
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const normalizedRole = role.trim().toUpperCase() as UserRole;
  const allowedPermissions = ROLE_PERMISSIONS[normalizedRole];
  if (!allowedPermissions) return false;
  return allowedPermissions.includes(permission);
}
