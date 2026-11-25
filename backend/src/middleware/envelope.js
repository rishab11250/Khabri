export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

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
