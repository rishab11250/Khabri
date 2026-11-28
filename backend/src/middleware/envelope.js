/**
 * Defines Khabri's standard API response envelope (`{ success, data, error }`) and `AppError`.
 * Deliberately keeps HTTP status and machine-readable `code` coupled on operational errors.
 */
/**
 * Operational application error mapped to `{ success: false, error: { code, message, details } }`.
 */
export class AppError extends Error {
  /**
   * Creates an operational API error.
   *
   * @param {number} status - HTTP status code.
   * @param {string} code - Stable machine-readable error code.
   * @param {string} message - Human-readable error message.
   * @param {*} [details] - Optional field-level validation metadata.
   */
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Sends a successful API response wrapped in the standard envelope.
 *
 * @param {object} res - Express response object.
 * @param {*} data - Response payload.
 * @param {number} [status] - HTTP status code (defaults to `200`).
 * @returns {object} Sent Express response.
 */
export function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

/**
 * Sends a structured error response wrapped in the standard envelope.
 *
 * @param {object} res - Express response object.
 * @param {number} status - HTTP status code.
 * @param {string} code - Machine-readable error code.
 * @param {string} message - Human-readable message.
 * @param {*} [details] - Optional structured validation details.
 * @returns {object} Sent Express response.
 */
export function fail(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}
