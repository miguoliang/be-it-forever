import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

// Extend dayjs with UTC plugin
dayjs.extend(utc)

/**
 * Get today's date range in UTC (start and end of the day)
 * @returns {Object} { startOfToday, endOfToday } as Date objects
 */
export function getTodayDateRange() {
  const now = dayjs.utc()
  return {
    startOfToday: now.startOf('day').toDate(),
    endOfToday: now.endOf('day').toDate()
  }
}

/**
 * Format a date string or Date object to ISO string
 * @param date - Date input
 * @returns ISO string
 */
export function toISOString(date?: string | Date | dayjs.Dayjs): string {
  return dayjs(date).toISOString()
}

/**
 * Get the current time in ISO format
 * @returns Current ISO string
 */
export function nowISO(): string {
  return dayjs.utc().toISOString()
}

/**
 * Format date for display (e.g. "2023-10-01 12:00:00")
 * @param date - Date input
 * @param template - Format template
 */
export function formatDate(date: string | Date, template: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(template)
}

/**
 * Calculate the start date for a given number of days ago
 * @param days - Number of days to look back
 * @returns ISO string of the start date
 */
export function getDaysAgoISO(days: number): string {
  return dayjs.utc().subtract(days, 'day').toISOString()
}

/**
 * Get simple date string (YYYY-MM-DD) from a Date
 */
export function toDateString(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}