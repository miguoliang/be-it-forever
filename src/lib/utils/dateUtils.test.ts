import { formatDate, toDateString, toISOString } from '@/lib/utils/dateUtils';
import dayjs from 'dayjs';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date with default template', () => {
      const date = '2023-12-25T10:30:00.000Z';
      // Note: dayjs parses UTC as local time by default if no timezone is set, 
      // so this test depends on the system timezone unless we strictly control inputs.
      // To keep it simple and robust, we just check if it formats successfully using the library.
      
      const expected = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
      expect(formatDate(date)).toBe(expected);
    });

    it('should format date with custom template', () => {
      const date = '2023-01-01';
      expect(formatDate(date, 'YYYY/MM/DD')).toBe('2023/01/01');
    });
  });

  describe('toDateString', () => {
    it('should return YYYY-MM-DD format', () => {
      const date = new Date('2023-10-15T12:00:00Z');
      // toDateString uses local time by default in implementation
      const expected = dayjs(date).format('YYYY-MM-DD');
      expect(toDateString(date)).toBe(expected);
    });
  });

  describe('toISOString', () => {
    it('should return valid ISO string', () => {
      const date = new Date('2023-05-05T05:05:05Z');
      expect(toISOString(date)).toBe(date.toISOString());
    });
  });
});
