export const ROLE_ADMIN = 1;
export const ROLE_MANAGER = 2;
export const ROLE_EMPLOYEE = 3;
export const ROLE_TECHNICIAN = 4;
export const LEGACY_ROLE_TECHNICIAN = 3;
export const ROLE_RECEPTIONIST = 5;
export const ROLE_CUSTOMER = 6;
export const LEGACY_ROLE_CUSTOMER = 8;

export const CUSTOMER_ROLE_IDS = [ROLE_CUSTOMER, LEGACY_ROLE_CUSTOMER];
export const TECHNICIAN_ROLE_IDS = [ROLE_TECHNICIAN, LEGACY_ROLE_TECHNICIAN];

export const isCustomerRole = (roleId) => CUSTOMER_ROLE_IDS.includes(Number(roleId));
export const isTechnicianRole = (roleId) => TECHNICIAN_ROLE_IDS.includes(Number(roleId));

