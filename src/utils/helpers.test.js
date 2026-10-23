import {
  amountToWords,
  daysBetween,
  formatCurrency,
  getInputDateFormat,
  getStatusColor,
  isOverdue,
  isValidEmail,
  sumBy,
  toAmount,
  truncateText,
  validatePassword
} from './helpers';

describe('money', () => {
  test('formats rupees with Indian digit grouping', () => {
    expect(formatCurrency(1250000)).toBe('₹12,50,000.00');
    expect(formatCurrency(0)).toBe('₹0.00');
    expect(formatCurrency(undefined)).toBe('₹0.00');
  });

  test('writes the amount in words for invoices', () => {
    expect(amountToWords(1500)).toMatch(/One Thousand Five Hundred/);
  });

  test('reads amounts sent as numbers or as text', () => {
    expect(toAmount(250)).toBe(250);
    expect(toAmount('1,250.50')).toBe(1250.5);
    expect(toAmount('')).toBe(0);
    expect(toAmount(null)).toBe(0);
    expect(toAmount('n/a')).toBe(0);
  });

  test('sums a field across records without joining text values', () => {
    const crs = [{ Estimated_Amount: 1000 }, { Estimated_Amount: '2500' }, { Estimated_Amount: '' }, {}];
    expect(sumBy(crs, 'Estimated_Amount')).toBe(3500);
    expect(sumBy([], 'Estimated_Amount')).toBe(0);
    expect(sumBy(undefined, 'Estimated_Amount')).toBe(0);
  });
});

describe('dates', () => {
  const now = new Date(2026, 9, 23, 15, 0); // 23 Oct 2026, 3 pm

  test('a CR due today is not overdue yet', () => {
    expect(isOverdue(new Date(2026, 9, 23), now)).toBe(false);
  });

  test('a CR due yesterday is overdue', () => {
    expect(isOverdue(new Date(2026, 9, 22), now)).toBe(true);
  });

  test('a CR without a target date is never overdue', () => {
    expect(isOverdue('', now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
    expect(isOverdue('not a date', now)).toBe(false);
  });

  test('date input format and day counts', () => {
    expect(getInputDateFormat(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(getInputDateFormat(null)).toBe('');
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(30);
  });
});

describe('validation', () => {
  test('email addresses', () => {
    expect(isValidEmail('dev@example.com')).toBe(true);
    expect(isValidEmail('dev@example')).toBe(false);
    expect(isValidEmail('dev example.com')).toBe(false);
  });

  test('password strength rules', () => {
    expect(validatePassword('Short1').valid).toBe(false);
    expect(validatePassword('alllowercase1').message).toMatch(/uppercase/);
    expect(validatePassword('ALLUPPERCASE1').message).toMatch(/lowercase/);
    expect(validatePassword('NoNumbersHere').message).toMatch(/number/);
    expect(validatePassword('Str0ngPassword')).toEqual({ valid: true, message: 'Strong password' });
  });
});

describe('display helpers', () => {
  test('status colours fall back to grey for unknown statuses', () => {
    expect(getStatusColor('Rejected')).toContain('red');
    expect(getStatusColor('Something new')).toBe('bg-gray-100 text-gray-800');
  });

  test('long text is shortened', () => {
    expect(truncateText('Change request for invoice layout', 14)).toBe('Change request...');
    expect(truncateText('Short', 14)).toBe('Short');
    expect(truncateText(null, 14)).toBe('');
  });
});
