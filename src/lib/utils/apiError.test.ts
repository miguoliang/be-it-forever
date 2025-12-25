import { handleApiError, apiSuccess } from './apiError';
import { ApiError, ApiErrorCode } from './apiErrorClasses';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      body,
      status: init?.status || 200,
    })),
  },
}));

describe('apiError utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle ApiError correctly', () => {
      const error = ApiError.forbidden('Access denied');
      handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ApiErrorCode.FORBIDDEN,
            message: 'Access denied',
            data: undefined,
          },
        },
        { status: 403 }
      );
    });

    it('should handle generic Error as INTERNAL_ERROR', () => {
      const error = new Error('Something went wrong');
      handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ApiErrorCode.INTERNAL_ERROR,
            message: 'Something went wrong',
          },
        },
        { status: 500 }
      );
    });

    it('should handle unknown error types', () => {
      handleApiError('Just a string error');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ApiErrorCode.INTERNAL_ERROR,
            message: 'Unknown error occurred',
          },
        },
        { status: 500 }
      );
    });

    it('should map Supabase permission denied error', () => {
      const error = new Error('new row violates row-level security policy for table "xyz" (permission denied)');
      handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ApiErrorCode.FORBIDDEN,
            message: 'Permission denied',
          },
        },
        { status: 403 }
      );
    });
  });

  describe('apiSuccess', () => {
    it('should return successful response with data', () => {
      const data = { id: 1, name: 'Test' };
      apiSuccess(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });

    it('should allow custom status code', () => {
      apiSuccess({ created: true }, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { created: true } },
        { status: 201 }
      );
    });
  });
});
