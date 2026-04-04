import dayjs from "dayjs";

/**
 * Format a number as Indian Rupee currency string.
 * @param {number} amount
 * @returns {string}  e.g. "₹1,250.00"
 */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);

/**
 * Calculate tax amount from a subtotal.
 * @param {number} subtotal
 * @param {number} taxPct  default 5
 * @returns {number}
 */
export const calcTax = (subtotal, taxPct = 5) =>
  parseFloat(((subtotal * taxPct) / 100).toFixed(2));

/**
 * Calculate grand total including tax.
 * @param {number} subtotal
 * @param {number} taxPct
 * @returns {number}
 */
export const calcTotal = (subtotal, taxPct = 5) =>
  parseFloat((subtotal + calcTax(subtotal, taxPct)).toFixed(2));

/**
 * Format a date/time string for display.
 * @param {string|Date} date
 * @param {string} format  dayjs format string
 * @returns {string}
 */
export const formatDate = (date, format = "DD MMM YYYY") =>
  dayjs(date).format(format);

export const formatTime = (date) => dayjs(date).format("hh:mm A");

export const formatDateTime = (date) =>
  dayjs(date).format("DD MMM YYYY · hh:mm A");

/**
 * Truncate a string to a max length with ellipsis.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max) + "…" : str;

/**
 * Capitalize the first letter of each word.
 * @param {string} str
 * @returns {string}
 */
export const titleCase = (str) =>
  str
    ? str.replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

/**
 * Generate a short display ID from a UUID.
 * @param {string} uuid
 * @returns {string}  e.g. "A1B2C3D4"
 */
export const shortId = (uuid) =>
  uuid ? uuid.replace(/-/g, "").slice(0, 8).toUpperCase() : "";

/**
 * Group an array of objects by a key.
 * @param {object[]} arr
 * @param {string} key
 * @returns {Record<string, object[]>}
 */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = item[key] ?? "other";
    acc[group] = acc[group] ? [...acc[group], item] : [item];
    return acc;
  }, {});

/**
 * Sleep for a given number of milliseconds.
 * Useful for simulated delays in dev.
 * @param {number} ms
 */
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));