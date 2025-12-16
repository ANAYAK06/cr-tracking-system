import React, { useState, useEffect } from 'react';
import { paymentAPI, invoiceAPI, developerAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiDollarSign,
  FiPlus,
  FiEye,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import { formatDate, formatCurrency, getInputDateFormat } from '../../utils/helpers';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentDate: getInputDateFormat(new Date()),
    amount: '',
    paymentMode: 'Bank Transfer',
    transactionReference: '',
    remarks: '',
  });
  const [advanceFormData, setAdvanceFormData] = useState({
    developerId: '',
    date: getInputDateFormat(new Date()),
    amount: '',
    purpose: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const paymentModes = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Online'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedDeveloper) {
      fetchUnpaidInvoices(selectedDeveloper);
    } else {
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
    }
  }, [selectedDeveloper]);

  const fetchInitialData = async () => {
    try {
      const [paymentResponse, advanceResponse, devResponse] = await Promise.all([
        paymentAPI.getAll(),
        paymentAPI.getAdvances(),
        developerAPI.getAll(),
      ]);

      if (paymentResponse.success) setPayments(paymentResponse.data);
      if (advanceResponse.success) setAdvances(advanceResponse.data);
      if (devResponse.success) setDevelopers(devResponse.data);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidInvoices = async (developerId) => {
    try {
      // Get invoices with balance > 0
      const response = await invoiceAPI.getAll({ 
        filters: { developerId, unpaidOnly: true } 
      });
      
      if (response.success) {
        const unpaid = response.data.filter(inv => parseFloat(inv.Balance_Amount) > 0);
        setUnpaidInvoices(unpaid);
      }
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      setUnpaidInvoices([]);
    }
  };

  const handleRecordPayment = () => {
    setSelectedDeveloper('');
    setSelectedInvoices([]);
    setPaymentFormData({
      paymentDate: getInputDateFormat(new Date()),
      amount: '',
      paymentMode: 'Bank Transfer',
      transactionReference: '',
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  const handleRecordAdvance = () => {
    setAdvanceFormData({
      developerId: '',
      date: getInputDateFormat(new Date()),
      amount: '',
      purpose: '',
    });
    setShowAdvanceModal(true);
  };

  const handleInvoiceSelection = (invoiceNumber) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceNumber)) {
        return prev.filter(inv => inv !== invoiceNumber);
      } else {
        return [...prev, invoiceNumber];
      }
    });
  };

  const getTotalBalance = () => {
    return selectedInvoices.reduce((total, invNumber) => {
      const invoice = unpaidInvoices.find(inv => inv.Invoice_Number === invNumber);
      return total + (parseFloat(invoice?.Balance_Amount) || 0);
    }, 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDeveloper) {
      toast.error('Please select a developer');
      return;
    }

    if (selectedInvoices.length === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const paymentAmount = parseFloat(paymentFormData.amount);
    const totalBalance = getTotalBalance();

    if (paymentAmount > totalBalance) {
      toast.error(`Payment amount (${formatCurrency(paymentAmount)}) exceeds total balance (${formatCurrency(totalBalance)})`);
      return;
    }

    setSubmitting(true);

    try {
      const paymentData = {
        developerId: selectedDeveloper,
        invoiceNumbers: selectedInvoices,
        paymentDate: paymentFormData.paymentDate,
        amount: paymentAmount,
        paymentMode: paymentFormData.paymentMode,
        transactionReference: paymentFormData.transactionReference,
        remarks: paymentFormData.remarks,
      };

      const response = await paymentAPI.record(paymentData);

      if (response.success) {
        toast.success(response.message || 'Payment recorded successfully');
        setShowPaymentModal(false);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();

    if (!advanceFormData.developerId || !advanceFormData.amount || parseFloat(advanceFormData.amount) <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await paymentAPI.recordAdvance(advanceFormData);

      if (response.success) {
        toast.success('Advance recorded successfully');
        setShowAdvanceModal(false);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to record advance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? This will restore the invoice balance.')) {
      return;
    }

    try {
      const response = await paymentAPI.delete(paymentId);
      if (response.success) {
        toast.success('Payment deleted successfully');
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  const getDeveloperName = (devId) => {
    const dev = developers.find((d) => d.Developer_ID === devId);
    return dev?.Name || '-';
  };

  if (loading) {
    return <LoadingSpinner text="Loading payments..." />;
  }

  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.Amount_Paid) || 0), 0);
  const totalAdvances = advances.reduce((sum, a) => sum + (parseFloat(a.Amount) || 0), 0);
  const pendingAdvances = advances.filter(a => a.Status === 'Pending').reduce((sum, a) => sum + (parseFloat(a.Amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Record payments and manage advances</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRecordAdvance}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiPlus size={20} />
            <span>Record Advance</span>
          </button>
          <button
            onClick={handleRecordPayment}
            className="btn-primary flex items-center space-x-2"
          >
            <FiDollarSign size={20} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalPayments)}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Advances</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalAdvances)}
              </h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiDollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Advances</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(pendingAdvances)}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiClock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advances'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advances ({advances.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              {payments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Payment ID</th>
                      <th className="table-header">Invoice</th>
                      <th className="table-header">Developer</th>
                      <th className="table-header">Type</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Mode</th>
                      <th className="table-header">Reference</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.Payment_ID} className="hover:bg-gray-50">
                        <td className="table-cell font-medium text-primary-600">
                          {payment.Payment_ID}
                        </td>
                        <td className="table-cell">{payment.Invoice_Number || '-'}</td>
                        <td className="table-cell">{getDeveloperName(payment.Developer_ID)}</td>
                        <td className="table-cell">
                          <StatusBadge status={payment.Payment_Type} type="payment" />
                        </td>
                        <td className="table-cell">{formatDate(payment.Payment_Date)}</td>
                        <td className="table-cell font-semibold text-green-600">
                          {formatCurrency(payment.Amount_Paid)}
                        </td>
                        <td className="table-cell">{payment.Payment_Mode}</td>
                        <td className="table-cell text-gray-600">
                          {payment.Transaction_Reference || '-'}
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => handleDeletePayment(payment.Payment_ID)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Payment"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No payments recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advances' && (
            <div className="overflow-x-auto">
              {advances.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Advance ID</th>
                      <th className="table-header">Developer</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Purpose</th>
                      <th className="table-header">Adjusted Against</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {advances.map((advance) => (
                      <tr key={advance.Advance_ID} className="hover:bg-gray-50">
                        <td className="table-cell font-medium text-primary-600">
                          {advance.Advance_ID}
                        </td>
                        <td className="table-cell">{getDeveloperName(advance.Developer_ID)}</td>
                        <td className="table-cell">{formatDate(advance.Advance_Date)}</td>
                        <td className="table-cell font-semibold text-blue-600">
                          {formatCurrency(advance.Amount)}
                        </td>
                        <td className="table-cell text-gray-600">
                          {advance.Purpose || '-'}
                        </td>
                        <td className="table-cell">
                          {advance.Adjusted_Against || '-'}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={advance.Status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No advances recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Select a developer, then choose one or more invoices to pay. 
              Payment will be distributed across invoices automatically.
            </p>
          </div>

          {/* Developer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Developer *
            </label>
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select Developer</option>
              {developers.map((dev) => (
                <option key={dev.Developer_ID} value={dev.Developer_ID}>
                  {dev.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Selection */}
          {selectedDeveloper && unpaidInvoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Invoices to Pay *
              </label>
              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                {unpaidInvoices.map((invoice) => {
                  const balance = parseFloat(invoice.Balance_Amount) || 0;
                  return (
                    <label
                      key={invoice.Invoice_Number}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.Invoice_Number)}
                        onChange={() => handleInvoiceSelection(invoice.Invoice_Number)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {invoice.Invoice_Number}
                          </span>
                          <span className="font-bold text-red-600">
                            {formatCurrency(balance)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          CR: {invoice.CR_Number} | Date: {formatDate(invoice.Invoice_Date)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedInvoices.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">
                      Total Balance ({selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''}):
                    </span>
                    <span className="font-bold text-green-800 text-lg">
                      {formatCurrency(getTotalBalance())}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedDeveloper && unpaidInvoices.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <FiAlertCircle className="inline mr-2" />
                No unpaid invoices found for this developer.
              </p>
            </div>
          )}

          {/* Payment Details */}
          {selectedInvoices.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, amount: e.target.value })
                    }
                    step="0.01"
                    min="0"
                    max={getTotalBalance()}
                    className="input-field"
                    placeholder="Enter amount"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {formatCurrency(getTotalBalance())}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentFormData.paymentMode}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })
                    }
                    className="input-field"
                    required
                  >
                    {paymentModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.transactionReference}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        transactionReference: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Transaction ID / Cheque No"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={paymentFormData.remarks}
                  onChange={(e) =>
                    setPaymentFormData({ ...paymentFormData, remarks: e.target.value })
                  }
                  rows="3"
                  className="input-field"
                  placeholder="Additional remarks..."
                ></textarea>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || selectedInvoices.length === 0}
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Advance Modal */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        title="Record Advance"
        size="md"
      >
        <form onSubmit={handleAdvanceSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Developer *
            </label>
            <select
              value={advanceFormData.developerId}
              onChange={(e) =>
                setAdvanceFormData({ ...advanceFormData, developerId: e.target.value })
              }
              className="input-field"
              required
            >
              <option value="">Select Developer</option>
              {developers.map((dev) => (
                <option key={dev.Developer_ID} value={dev.Developer_ID}>
                  {dev.Name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={advanceFormData.date}
                onChange={(e) =>
                  setAdvanceFormData({ ...advanceFormData, date: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={advanceFormData.amount}
                onChange={(e) =>
                  setAdvanceFormData({ ...advanceFormData, amount: e.target.value })
                }
                step="0.01"
                min="0"
                className="input-field"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <textarea
              value={advanceFormData.purpose}
              onChange={(e) =>
                setAdvanceFormData({ ...advanceFormData, purpose: e.target.value })
              }
              rows="3"
              className="input-field"
              placeholder="Purpose of advance..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAdvanceModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Advance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentManagement;