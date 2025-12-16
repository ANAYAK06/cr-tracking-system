import React, { useState, useEffect } from 'react';
import { reportAPI, developerAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { 
  FiDownload, 
  FiUser,
  FiDollarSign,
  FiAlertCircle,
  FiCalendar
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

const Reports = () => {
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState('');
  const [developerSummary, setDeveloperSummary] = useState(null);
  const [outstandingPayments, setOutstandingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [devResponse, outstandingResponse] = await Promise.all([
        developerAPI.getAll(),
        reportAPI.getOutstandingPayments(),
      ]);

      if (devResponse.success) setDevelopers(devResponse.data);
      if (outstandingResponse.success) setOutstandingPayments(outstandingResponse.data);
    } catch (error) {
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeveloperSummary = async (developerId) => {
    if (!developerId) {
      setDeveloperSummary(null);
      return;
    }

    setSummaryLoading(true);
    try {
      const response = await reportAPI.getDeveloperSummary(developerId);
      if (response.success) {
        setDeveloperSummary(response.data);
      }
    } catch (error) {
      toast.error('Error loading developer summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await reportAPI.getMonthlyReport(selectedMonth, selectedYear);
      if (response.success) {
        setMonthlyReport(response.data);
        toast.success('Monthly report generated');
      }
    } catch (error) {
      toast.error('Error generating monthly report');
    }
  };

  const handleDeveloperChange = (e) => {
    const devId = e.target.value;
    setSelectedDeveloper(devId);
    fetchDeveloperSummary(devId);
  };

  const exportToCSV = (data, filename) => {
    // Simple CSV export function
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return <LoadingSpinner text="Loading reports..." />;
  }

  const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View detailed reports and summaries</p>
      </div>

      {/* Outstanding Payments Report */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FiAlertCircle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Outstanding Payments</h2>
              <p className="text-sm text-gray-600">Pending payments by developer</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        {outstandingPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Developer</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Total Billed</th>
                  <th className="table-header">Total Paid</th>
                  <th className="table-header">Pending Advances</th>
                  <th className="table-header">Outstanding</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outstandingPayments.map((payment) => (
                  <tr key={payment.developerId} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{payment.developerName}</td>
                    <td className="table-cell text-gray-600">{payment.email}</td>
                    <td className="table-cell">{formatCurrency(payment.totalBilled)}</td>
                    <td className="table-cell text-green-600">{formatCurrency(payment.totalPaid)}</td>
                    <td className="table-cell text-blue-600">{formatCurrency(payment.pendingAdvances)}</td>
                    <td className="table-cell font-semibold text-red-600">
                      {formatCurrency(payment.outstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-600 font-medium">✓ No outstanding payments</p>
          </div>
        )}
      </div>

      {/* Developer Summary Report */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FiUser className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Developer Summary</h2>
            <p className="text-sm text-gray-600">Detailed summary for a specific developer</p>
          </div>
        </div>

        {/* Developer Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Developer
          </label>
          <select
            value={selectedDeveloper}
            onChange={handleDeveloperChange}
            className="input-field max-w-md"
          >
            <option value="">Choose a developer...</option>
            {developers.map((dev) => (
              <option key={dev.Developer_ID} value={dev.Developer_ID}>
                {dev.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Developer Summary Display */}
        {summaryLoading && <LoadingSpinner text="Loading summary..." />}

        {developerSummary && !summaryLoading && (
          <div className="space-y-6">
            {/* Developer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Developer Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{developerSummary.developer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{developerSummary.developer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{developerSummary.developer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hourly Rate</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(developerSummary.developer.hourlyRate)}/hr
                  </p>
                </div>
              </div>
            </div>

            {/* CRs Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Change Requests</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total CRs</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {developerSummary.crs.total}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Estimated Hours</p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {developerSummary.crs.totalEstimatedHours}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Actual Hours</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {developerSummary.crs.totalActualHours}
                  </p>
                </div>
              </div>

              {/* CR Status Breakdown */}
              {developerSummary.crs.byStatus && Object.keys(developerSummary.crs.byStatus).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(developerSummary.crs.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <StatusBadge status={status} />
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Billed</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatCurrency(developerSummary.billing.totalNetAmount)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Gross: {formatCurrency(developerSummary.billing.totalGrossAmount)}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">TDS Deducted</p>
                  <p className="text-2xl font-bold text-orange-700 mt-2">
                    {formatCurrency(developerSummary.billing.totalTDS)}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Paid</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(developerSummary.payments.totalPaid)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {formatCurrency(developerSummary.balance.outstanding)}
                  </p>
                </div>
              </div>
            </div>

            {/* Advances Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Advances</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Advances</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatCurrency(developerSummary.advances.total)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-700 mt-1">
                    {formatCurrency(developerSummary.advances.pending)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Adjusted</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    {formatCurrency(developerSummary.advances.adjusted)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedDeveloper && !summaryLoading && (
          <div className="text-center py-8 text-gray-500">
            Select a developer to view their summary
          </div>
        )}
      </div>

      {/* Monthly Report */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <FiCalendar className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Monthly Report</h2>
            <p className="text-sm text-gray-600">Generate report for a specific month</p>
          </div>
        </div>

        {/* Month/Year Selection */}
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-field"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="pt-7">
            <button onClick={fetchMonthlyReport} className="btn-primary">
              Generate Report
            </button>
          </div>
        </div>

        {/* Monthly Report Display */}
        {monthlyReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Report Period: {formatDate(monthlyReport.period.startDate)} to {formatDate(monthlyReport.period.endDate)}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CRs */}
              <div className="card">
                <p className="text-sm text-gray-600 mb-2">CRs Created</p>
                <p className="text-3xl font-bold text-blue-600">{monthlyReport.crs.created}</p>
              </div>

              {/* Billing */}
              <div className="card">
                <p className="text-sm text-gray-600 mb-2">Total Billed</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(monthlyReport.billing.totalBilled)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {monthlyReport.billing.invoicesGenerated} invoices
                </p>
              </div>

              {/* Payments */}
              <div className="card">
                <p className="text-sm text-gray-600 mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(monthlyReport.payments.totalPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {monthlyReport.payments.paymentsMade} payments
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;