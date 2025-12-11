/**
 * Utility functions for error handling
 */

/**
 * Formats rate limiting error messages from Supabase
 * @param errorMessage - The error message from Supabase
 * @returns Formatted wait time string (e.g., "30秒" or "1分30秒")
 */
export function formatRateLimitWaitTime(errorMessage: string): string {
  const match = errorMessage.match(/(\d+)\s+seconds?/);
  if (!match) return "30秒";

  const seconds = parseInt(match[1], 10);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return remainingSeconds > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${minutes}分`;
  }
  return `${seconds}秒`;
}

/**
 * Checks if an error is a rate limiting error
 * @param errorMessage - The error message to check
 * @returns True if it's a rate limiting error
 */
export function isRateLimitError(errorMessage: string): boolean {
  return errorMessage.includes(
    "For security purposes, you can only request this after"
  );
}

/**
 * Gets a user-friendly rate limiting error message
 * @param errorMessage - The error message from Supabase
 * @param context - Additional context (e.g., "发送验证码", "验证登录")
 * @returns Formatted error message
 */
export function getRateLimitErrorMessage(
  errorMessage: string,
  context: string = "操作"
): string {
  const waitTime = formatRateLimitWaitTime(errorMessage);
  return `为了您的账户安全，请等待 ${waitTime} 后再${context}。\n\n如果您的邮箱没有收到验证码，请检查垃圾邮件文件夹。`;
}

