import { toast } from 'react-toastify';

// Replace with your deployed AppScript URL
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycby0HsC9ZzidIlw2mS2d3F8bQOho7oNeEPCWkPNefkoZRd7ySsedFF985Eaz5GI1jBGr/exec';

// Helper function to make API calls using fetch
const callAPI = async (action, data = {}) => {
  try {
    const token = localStorage.getItem('token');
    const requestData = {
      action,
      token,
      ...data,
    };

    console.log('API Request:', { action, data }); // Debug log

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(requestData),
      redirect: 'follow',
    });

    console.log('API Response Status:', response.status); // Debug log

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Result:', result); // Debug log

    // Show error toast if API returns error
    if (!result.success && result.error) {
      toast.error(result.error);
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    toast.error('Network error: ' + error.message);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  login: (email, password) => callAPI('login', { email, password }),
  logout: () => callAPI('logout'),
  changePassword: (oldPassword, newPassword) =>
    callAPI('changePassword', { oldPassword, newPassword }),
};

// Developer APIs
export const developerAPI = {
  register: (developerData) => callAPI('registerDeveloper', { developerData }), // ✅ FIXED
  getAll: () => callAPI('getAllDevelopers'),
  getById: (developerId) => callAPI('getDeveloperById', { developerId }),
  update: (developerId, updates) => callAPI('updateDeveloper', { developerId, updates }),
  getSummary: (developerId) => callAPI('getDeveloperSummary', { developerId }),
};

// Client APIs
export const clientAPI = {
  register: (clientData) => callAPI('registerClient', { clientData }), // ✅ FIXED
  getAll: () => callAPI('getAllClients'),
  getById: (clientId) => callAPI('getClientById', { clientId }),
  update: (clientId, updates) => callAPI('updateClient', { clientId, updates }),
};

// CR APIs
export const crAPI = {
  create: (crData) => callAPI('createCR', { crData }), // ✅ FIXED
  getAll: (filters) => callAPI('getCRs', { filters }), // ✅ FIXED
  getById: (crNumber) => callAPI('getCRById', { crNumber }),
  update: (crNumber, updates) => callAPI('updateCR', { crNumber, updates }),
  submitEstimate: (crNumber, estimatedHours) =>
    callAPI('submitEstimate', { crNumber, estimatedHours }),
  approve: (crNumber, action, remarks) =>
    callAPI('approveCR',{
      data: { crNumber, action, remarks }}),
  updateStatus: (crNumber, newStatus, actualHours, remarks) =>
    callAPI('updateCRStatus', { crNumber, newStatus, actualHours, remarks }),
  markReadyForBilling: (crNumber, remarks) =>
    callAPI('markReadyForBilling', { crNumber, remarks }),
};

// Invoice APIs
export const invoiceAPI = {
  generate: (crNumber, advanceAmount = 0) => 
    callAPI('generateInvoice', { crNumber, advanceAmount }), // ✅ Added advanceAmount
  getAll: (filters) => callAPI('getInvoices', { filters }),
  getById: (invoiceNumber) => callAPI('getInvoiceById', { invoiceNumber }),
  updateStatus: (invoiceNumber, status) =>
    callAPI('updateInvoiceStatus', { invoiceNumber, status }),
};

// Payment APIs
export const paymentAPI = {
  record: (paymentData) => callAPI('recordPayment', { paymentData }),
  getAll: (filters) => callAPI('getPayments', { filters }),
  recordAdvance: (advanceData) => callAPI('recordAdvance', { advanceData }),
  getAdvances: (filters) => callAPI('getAdvances', { filters }),
  adjustAdvance: (advanceId, invoiceNumber) =>
    callAPI('adjustAdvance', { advanceId, invoiceNumber }),
  delete: (paymentId) => callAPI('deletePayment', { paymentId }),
};

// TDS APIs
export const tdsAPI = {
  update: (effectiveDate, tdsPercentage) =>
    callAPI('updateTDSConfig', { effectiveDate, tdsPercentage }),
  getCurrent: () => callAPI('getCurrentTDS'),
  getHistory: () => callAPI('getTDSHistory'),
};

// Report APIs
export const reportAPI = {
  getDashboard: () => callAPI('getDashboardData'),
  getDeveloperSummary: (developerId) => callAPI('getDeveloperSummary', { developerId }),
  getOutstandingPayments: () => callAPI('getOutstandingPayments'),
  getMonthlyReport: (month, year) => callAPI('getMonthlyReport', { month, year }),
};

const apiService = {
  authAPI,
  developerAPI,
  clientAPI,
  crAPI,
  invoiceAPI,
  paymentAPI,
  tdsAPI,
  reportAPI,
};

export default apiService;