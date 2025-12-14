// Role IDs - Match database Role table
export const ROLE_ADMIN = 1;
export const ROLE_MANAGER = 2;
export const ROLE_EMPLOYEE = 3;
export const ROLE_TECHNICIAN = 4;
export const LEGACY_ROLE_TECHNICIAN = 3;
export const ROLE_RECEPTIONIST = 5;
export const ROLE_CUSTOMER = 6;        // Primary customer role
export const LEGACY_ROLE_CUSTOMER = 8; // Legacy customer role (for backwards compatibility)

// Role ID arrays for checking
export const CUSTOMER_ROLE_IDS = [ROLE_CUSTOMER, LEGACY_ROLE_CUSTOMER]; // [6, 8]
export const TECHNICIAN_ROLE_IDS = [ROLE_TECHNICIAN, LEGACY_ROLE_TECHNICIAN];

// Helper functions to check roles
export const isCustomerRole = (roleId) => CUSTOMER_ROLE_IDS.includes(Number(roleId));
export const isTechnicianRole = (roleId) => TECHNICIAN_ROLE_IDS.includes(Number(roleId));
export const isAdminRole = (roleId) => Number(roleId) === ROLE_ADMIN;
export const isManagerRole = (roleId) => Number(roleId) === ROLE_MANAGER;

