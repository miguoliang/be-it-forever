import { NextResponse } from 'next/server';

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

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    data?: unknown;
  };
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json<ApiResponse>(
      {
        error: {
          code: error.code,
          message: error.message,
          data: error.data,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors or other unknown errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  // Try to map known Supabase errors to proper status codes
  if (message.includes('permission denied')) {
    return NextResponse.json<ApiResponse>(
        { error: { code: ApiErrorCode.FORBIDDEN, message: 'Permission denied' } },
        { status: 403 }
    );
  }

  return NextResponse.json<ApiResponse>(
    {
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: message,
      },
    },
    { status: 500 }
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}
