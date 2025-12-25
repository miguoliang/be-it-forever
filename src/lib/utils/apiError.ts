import { NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './apiErrorClasses';

export { ApiError, ApiErrorCode };

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