import { ToWords } from 'to-words';

// Initialize ToWords
const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
  }
});

// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Convert amount to words
export const amountToWords = (amount) => {
  try {
    return toWords.convert(amount, { currency: true });
  } catch (error) {
    return '';
  }
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date-time
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get status color for badges
export const getStatusColor = (status) => {
  const colors = {
    'Estimation Pending': 'bg-orange-100 text-orange-800',
    'Approval Pending': 'bg-blue-100 text-blue-800',
    'Approved - In Development': 'bg-green-100 text-green-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Under UAT': 'bg-cyan-100 text-cyan-800',
    'In Production': 'bg-green-100 text-green-800',
    'Ready for Billing': 'bg-lime-100 text-lime-800',
    'Billed': 'bg-teal-100 text-teal-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800',
    'Generated': 'bg-orange-100 text-orange-800',
    'Sent': 'bg-blue-100 text-blue-800',
    'Paid': 'bg-green-100 text-green-800',
    'Pending': 'bg-orange-100 text-orange-800',
    'Adjusted': 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true, message: 'Strong password' };
};

// Download file from URL
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Calculate days between dates
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Check if a target date has passed. A task due today is not overdue until the day is over.
export const isOverdue = (targetDate, now = new Date()) => {
  if (!targetDate) return false;
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return false;
  const endOfTargetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);
  return endOfTargetDay < now;
};

// Get input date format (YYYY-MM-DD)
export const getInputDateFormat = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// Parse an amount that may arrive as a number or as text (e.g. "1,250.50") from the sheet
export const toAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Sum one numeric field across a list of records
export const sumBy = (items, field) =>
  (items || []).reduce((sum, item) => sum + toAmount(item?.[field]), 0);
