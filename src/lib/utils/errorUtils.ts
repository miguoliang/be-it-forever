/**
 * Type-safe error handling utilities
 * Following TypeScript best practices for error handling
 */

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safely extracts error message from unknown error type
 * Uses type guards instead of type assertions for better type safety
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === "string") {
      return errorObj.message;
    }
  }
  
  return "未知错误";
}

/**
 * Type guard to check if an error has a specific message
 */
export function hasErrorMessage(error: unknown, message: string): boolean {
  return getErrorMessage(error) === message;
}

