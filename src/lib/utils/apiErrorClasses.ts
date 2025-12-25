export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
}

export class ApiError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  data?: unknown;

  constructor(message: string, code: ApiErrorCode, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(message, ApiErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(message, ApiErrorCode.FORBIDDEN, 403);
  }

  static notFound(message = 'Not Found'): ApiError {
    return new ApiError(message, ApiErrorCode.NOT_FOUND, 404);
  }

  static validationError(message = 'Validation Error', data?: unknown): ApiError {
    return new ApiError(message, ApiErrorCode.VALIDATION_ERROR, 400, data);
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(message, ApiErrorCode.INTERNAL_ERROR, 500);
  }

  static dailyLimitExceeded(message = 'Daily limit exceeded'): ApiError {
    return new ApiError(message, ApiErrorCode.DAILY_LIMIT_EXCEEDED, 403);
  }
}
