import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { 
  FiFileText, 
  FiDollarSign, 
  FiUsers, 
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`${color} bg-opacity-10 p-4 rounded-full`}>
        <Icon className={color.replace('bg-', 'text-')} size={28} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await reportAPI.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { crs, financial } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total CRs"
          value={crs?.total || 0}
          icon={FiFileText}
          color="bg-blue-500"
          subtitle="Change Requests"
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(financial?.totalInvoiced || 0)}
          icon={FiDollarSign}
          color="bg-green-500"
          subtitle="Net Amount"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(financial?.totalPaid || 0)}
          icon={FiCheckCircle}
          color="bg-purple-500"
          subtitle="Payments Made"
        />
        <StatCard
          title="Balance Payable"
          value={formatCurrency(financial?.balancePayable || 0)}
          icon={FiAlertCircle}
          color="bg-red-500"
          subtitle="Outstanding Balance"
        />
      </div>

      {/* Financial Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-800">Gross Billed</h4>
            <FiTrendingUp className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(financial?.grossBilled || 0)}
          </p>
          <p className="text-xs text-blue-700 mt-2">Before TDS & Advances</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-orange-800">Total TDS</h4>
            <FiDollarSign className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-orange-900">
            {formatCurrency(financial?.totalTDS || 0)}
          </p>
          <p className="text-xs text-orange-700 mt-2">Tax Deducted at Source</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-purple-800">Advances Adjusted</h4>
            <FiClock className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {formatCurrency(financial?.advancesAdjusted || 0)}
          </p>
          <p className="text-xs text-purple-700 mt-2">Against Invoices</p>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-600">Fully Paid</p>
              <FiCheckCircle className="text-green-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(financial?.fullyPaid || 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {financial?.fullyPaidCount || 0} invoice(s)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-yellow-600">Partially Paid</p>
              <FiClock className="text-yellow-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              {formatCurrency(financial?.partiallyPaid || 0)}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {financial?.partiallyPaidCount || 0} invoice(s)
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-red-600">Unpaid</p>
              <FiAlertCircle className="text-red-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(financial?.unpaid || 0)}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {financial?.unpaidCount || 0} invoice(s)
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <FiDollarSign className="text-gray-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-700">
              {formatCurrency(financial?.balancePayable || 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {(financial?.partiallyPaidCount || 0) + (financial?.unpaidCount || 0)} pending
            </p>
          </div>
        </div>
      </div>

      {/* CR Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CR Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CR Status Overview</h3>
          <div className="space-y-3">
            {crs?.byStatus && Object.keys(crs.byStatus).length > 0 ? (
              Object.entries(crs.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={status} />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No CRs available</p>
            )}
          </div>
        </div>

        {/* CR Priority */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {crs?.byPriority && Object.keys(crs.byPriority).length > 0 ? (
              Object.entries(crs.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={priority} type="priority" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No priority data</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent CRs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Change Requests</h3>
          <FiClock className="text-gray-400" size={20} />
        </div>
        
        {crs?.recent && crs.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">CR Number</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Created Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crs.recent.map((cr) => (
                  <tr key={cr.crNumber} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-primary-600">{cr.crNumber}</td>
                    <td className="table-cell">{cr.title}</td>
                    <td className="table-cell">
                      <StatusBadge status={cr.status} />
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={cr.priority} type="priority" />
                    </td>
                    <td className="table-cell text-gray-500">{formatDate(cr.createdDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent CRs</p>
        )}
      </div>

      {/* Financial Calculation Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Calculation</h3>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="flex justify-between items-center text-gray-700">
            <span>Gross Billed Amount:</span>
            <span className="font-semibold">{formatCurrency(financial?.grossBilled || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span>Less: TDS Deducted:</span>
            <span className="font-semibold">- {formatCurrency(financial?.totalTDS || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-orange-600">
            <span>Less: Advances Adjusted:</span>
            <span className="font-semibold">- {formatCurrency(financial?.advancesAdjusted || 0)}</span>
          </div>
          <div className="border-t-2 border-gray-300 pt-3"></div>
          <div className="flex justify-between items-center text-green-700 font-bold text-lg">
            <span>Net Payable (After Adjustments):</span>
            <span>{formatCurrency(financial?.totalInvoiced || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-purple-600">
            <span>Already Paid:</span>
            <span className="font-semibold">- {formatCurrency(financial?.totalPaid || 0)}</span>
          </div>
          <div className="border-t-2 border-gray-300 pt-3"></div>
          <div className="flex justify-between items-center text-red-700 font-bold text-xl">
            <span>Outstanding Balance:</span>
            <span>{formatCurrency(financial?.balancePayable || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;