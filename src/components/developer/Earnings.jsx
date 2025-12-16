import React, { useState, useEffect } from 'react';
import { reportAPI, invoiceAPI, paymentAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { 
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

const Earnings = () => {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'payments', 'advances'

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const [summaryResponse, invoiceResponse, paymentResponse, advanceResponse] = await Promise.all([
        reportAPI.getDeveloperSummary(),
        invoiceAPI.getAll(),
        paymentAPI.getAll(),
        paymentAPI.getAdvances(),
      ]);

      if (summaryResponse.success) setSummary(summaryResponse.data);
      if (invoiceResponse.success) setInvoices(invoiceResponse.data);
      if (paymentResponse.success) setPayments(paymentResponse.data);
      if (advanceResponse.success) setAdvances(advanceResponse.data);
    } catch (error) {
      toast.error('Error loading earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (pdfLink, invoiceNumber) => {
    if (pdfLink) {
      window.open(pdfLink, '_blank');
    } else {
      toast.error('PDF not available');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading earnings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings & Payments</h1>
        <p className="text-gray-600 mt-1">Track your invoices and payments</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Billed</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.billing?.totalGrossAmount || 0)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.billing?.invoiceCount || 0} invoice(s)
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiTrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Amount</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.billing?.totalNetAmount || 0)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    After TDS & Advances
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FiDollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Received</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.payments?.totalPaid || 0)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {payments.length} payment(s)
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FiCheckCircle className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.balance?.outstanding || 0)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Balance Due
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FiAlertCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-red-600">TDS Deducted</p>
                  <FiCalendar className="text-red-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(summary.billing?.totalTDS || 0)}
                </p>
                <p className="text-xs text-red-600 mt-1">Tax component</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-orange-600">Advances Adjusted</p>
                  <FiFileText className="text-orange-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-orange-700">
                  {formatCurrency(summary.billing?.totalAdvancesAdjusted || 0)}
                </p>
                <p className="text-xs text-orange-600 mt-1">Against invoices</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-600">Pending Advances</p>
                  <FiDollarSign className="text-blue-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(summary.advances?.pending || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Not yet adjusted</p>
              </div>
            </div>

            {/* Financial Calculation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Calculation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Billed Amount:</span>
                  <span className="font-medium">{formatCurrency(summary.billing?.totalGrossAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Less: TDS Deducted:</span>
                  <span className="font-medium">- {formatCurrency(summary.billing?.totalTDS || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Less: Advances Adjusted:</span>
                  <span className="font-medium">- {formatCurrency(summary.billing?.totalAdvancesAdjusted || 0)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2"></div>
                <div className="flex justify-between text-sm font-semibold text-green-700">
                  <span>Net Amount Payable:</span>
                  <span>{formatCurrency(summary.billing?.totalNetAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Already Received:</span>
                  <span className="font-medium">- {formatCurrency(summary.payments?.totalPaid || 0)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2"></div>
                <div className="flex justify-between font-bold text-lg text-red-700">
                  <span>Balance Outstanding:</span>
                  <span>{formatCurrency(summary.balance?.outstanding || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advances Summary */}
          {summary.advances && summary.advances.total > 0 && (
            <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Advances Summary</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Total Advances:</span> {formatCurrency(summary.advances.total || 0)}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Pending:</span> {formatCurrency(summary.advances.pending || 0)}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Adjusted:</span> {formatCurrency(summary.advances.adjusted || 0)}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-200 p-4 rounded-full">
                  <FiDollarSign className="text-blue-700" size={32} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advances'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advances ({advances.length})
            </button>
          </div>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto mt-4">
            {invoices.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Invoice #</th>
                    <th className="table-header">CR Number</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Hours</th>
                    <th className="table-header">Gross</th>
                    <th className="table-header">TDS</th>
                    <th className="table-header">Advance</th>
                    <th className="table-header">Net Amount</th>
                    <th className="table-header">Balance</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const balance = parseFloat(invoice.Balance_Amount) || 0;
                    const isFullyPaid = balance === 0;
                    
                    return (
                      <tr key={invoice.Invoice_Number} className="hover:bg-gray-50">
                        <td className="table-cell font-medium text-primary-600">
                          {invoice.Invoice_Number}
                        </td>
                        <td className="table-cell">{invoice.CR_Number}</td>
                        <td className="table-cell">{formatDate(invoice.Invoice_Date)}</td>
                        <td className="table-cell">{invoice.Hours_Billed}</td>
                        <td className="table-cell font-medium">
                          {formatCurrency(invoice.Gross_Amount)}
                        </td>
                        <td className="table-cell text-red-600">
                          -{formatCurrency(invoice.TDS_Amount)}
                        </td>
                        <td className="table-cell text-orange-600">
                          {invoice.Advance_Adjusted > 0 ? `-${formatCurrency(invoice.Advance_Adjusted)}` : '-'}
                        </td>
                        <td className="table-cell font-semibold text-green-600">
                          {formatCurrency(invoice.Net_Amount)}
                        </td>
                        <td className={`table-cell font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(balance)}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={invoice.Status} />
                        </td>
                        <td className="table-cell">
                          {invoice.PDF_Link && (
                            <button
                              onClick={() => handleDownloadInvoice(invoice.PDF_Link, invoice.Invoice_Number)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Download PDF"
                            >
                              <FiDownload size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FiFileText className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No invoices generated yet</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto mt-4">
            {payments.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Payment ID</th>
                    <th className="table-header">Invoice #</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Mode</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.Payment_ID} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-primary-600">
                        {payment.Payment_ID}
                      </td>
                      <td className="table-cell">{payment.Invoice_Number || '-'}</td>
                      <td className="table-cell">
                        <StatusBadge status={payment.Payment_Type} type="payment" />
                      </td>
                      <td className="table-cell font-semibold text-green-600">
                        {formatCurrency(payment.Amount_Paid)}
                      </td>
                      <td className="table-cell">{payment.Payment_Mode}</td>
                      <td className="table-cell">{formatDate(payment.Payment_Date)}</td>
                      <td className="table-cell text-gray-600">
                        {payment.Transaction_Reference || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FiCheckCircle className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No payments recorded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Advances Tab */}
        {activeTab === 'advances' && (
          <div className="overflow-x-auto mt-4">
            {advances.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Advance ID</th>
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
                      <td className="table-cell">{formatDate(advance.Advance_Date)}</td>
                      <td className="table-cell font-semibold text-blue-600">
                        {formatCurrency(advance.Amount)}
                      </td>
                      <td className="table-cell">{advance.Purpose || '-'}</td>
                      <td className="table-cell">{advance.Adjusted_Against || '-'}</td>
                      <td className="table-cell">
                        <StatusBadge status={advance.Status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FiDollarSign className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No advances recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;