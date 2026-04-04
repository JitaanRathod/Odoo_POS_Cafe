const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const ORDER_TYPE = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
};

const TABLE_STATUS = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
};

const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  SPLIT: 'SPLIT',
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

const USER_ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
};

// Valid order status transitions
const VALID_TRANSITIONS = {
  [ORDER_STATUS.DRAFT]: [ORDER_STATUS.CREATED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CREATED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

const ERRORS = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_IN_USE: 'Email is already registered',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',

  // Generic
  NOT_FOUND: (resource) => `${resource} not found`,
  VALIDATION: (msg) => msg,

  // Session
  TERMINAL_NOT_FOUND: 'Terminal not found',
  SESSION_NOT_FOUND: 'Session not found',
  SESSION_ACTIVE: 'Terminal already has an active session',
  SESSION_CLOSED: 'Session is already closed',
  NO_ACTIVE_SESSION: 'No active session found for this terminal',

  // Order
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_ALREADY_PAID: 'Order is already completed',
  ORDER_EMPTY: 'Cannot proceed with empty order',
  ORDER_CANCELLED: 'Order has been cancelled',
  INVALID_STATUS_TRANSITION: 'Invalid order status transition',
  TABLE_REQUIRED: 'Table ID is required for dine-in orders',
  TABLE_NOT_FOUND: 'Table not found',
  TABLE_OCCUPIED: 'Table is already occupied',

  // Product
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_INACTIVE: 'Product is not available',

  // Customer
  CUSTOMER_NOT_FOUND: 'Customer not found',
  PHONE_IN_USE: 'Phone number is already registered',
};

// Socket event names (shared across codebase)
const SOCKET_EVENTS = {
  KITCHEN_NEW_ORDER: 'kitchen:newOrder',
  KITCHEN_ORDER_UPDATE: 'kitchen:orderUpdate',
  TABLE_STATUS_CHANGE: 'table:statusChange',
  SESSION_CLOSED: 'session:closed',
  PAYMENT_RECEIVED: 'payment:received',
};

module.exports = {
  ORDER_STATUS,
  ORDER_TYPE,
  TABLE_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  USER_ROLE,
  VALID_TRANSITIONS,
  ERRORS,
  SOCKET_EVENTS,
};
