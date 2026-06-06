export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(statusCode: number, message: string, code: string, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }
  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }
  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }
  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, false);
  }
}
