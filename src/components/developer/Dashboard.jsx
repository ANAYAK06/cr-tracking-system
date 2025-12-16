import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { 
  FiFileText, 
  FiDollarSign, 
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
  <div 
    className={`card hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
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

const DeveloperDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const { crs, earnings, pendingActions } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Pending Actions Alert */}
      {pendingActions && pendingActions.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiAlertCircle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-orange-800">Action Required</h4>
              <p className="text-sm text-orange-700 mt-1">
                You have {pendingActions.length} CR{pendingActions.length > 1 ? 's' : ''} waiting for your estimation.
              </p>
              <button
                onClick={() => navigate('/developer/crs')}
                className="text-sm text-orange-800 font-medium mt-2 hover:underline"
              >
                View Pending CRs →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total CRs"
          value={crs?.total || 0}
          icon={FiFileText}
          color="bg-blue-500"
          subtitle="Assigned to you"
          onClick={() => navigate('/developer/crs')}
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(earnings?.totalNet || 0)}
          icon={FiDollarSign}
          color="bg-green-500"
          subtitle="Net Amount"
          onClick={() => navigate('/developer/earnings')}
        />
        <StatCard
          title="Total Received"
          value={formatCurrency(earnings?.totalReceived || 0)}
          icon={FiCheckCircle}
          color="bg-purple-500"
          subtitle="Payments"
          onClick={() => navigate('/developer/earnings')}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(earnings?.outstanding || 0)}
          icon={FiAlertCircle}
          color="bg-red-500"
          subtitle="Balance Due"
          onClick={() => navigate('/developer/earnings')}
        />
      </div>

      {/* Earnings Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-600">Gross Billed</p>
              <FiTrendingUp className="text-blue-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(earnings?.totalGross || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {earnings?.invoiceCount || 0} invoice(s)
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-red-600">TDS Deducted</p>
              <FiDollarSign className="text-red-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(earnings?.totalTDS || 0)}
            </p>
            <p className="text-xs text-red-600 mt-1">Tax deducted</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-orange-600">Advances Adjusted</p>
              <FiClock className="text-orange-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(earnings?.totalAdvancesAdjusted || 0)}
            </p>
            <p className="text-xs text-orange-600 mt-1">Against invoices</p>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gross Amount:</span>
              <span className="font-medium">{formatCurrency(earnings?.totalGross || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Less: TDS:</span>
              <span className="font-medium">- {formatCurrency(earnings?.totalTDS || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-orange-600">
              <span>Less: Advances:</span>
              <span className="font-medium">- {formatCurrency(earnings?.totalAdvancesAdjusted || 0)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2"></div>
            <div className="flex justify-between text-sm font-semibold text-green-700">
              <span>Net Payable:</span>
              <span>{formatCurrency(earnings?.totalNet || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600">
              <span>Already Received:</span>
              <span className="font-medium">- {formatCurrency(earnings?.totalReceived || 0)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2"></div>
            <div className="flex justify-between font-bold text-lg text-red-700">
              <span>Balance Outstanding:</span>
              <span>{formatCurrency(earnings?.outstanding || 0)}</span>
            </div>
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
              <p className="text-gray-500 text-center py-4">No CRs assigned yet</p>
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
          <div className="space-y-3">
            {pendingActions && pendingActions.length > 0 ? (
              pendingActions.map((action, index) => (
                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">{action.type}</p>
                      <p className="text-xs text-orange-700 mt-1">
                        {action.crNumber} - {action.title}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/developer/crs')}
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiCheckCircle className="mx-auto text-green-500 mb-2" size={40} />
                <p className="text-gray-600">All caught up! No pending actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent CRs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent CRs</h3>
          <button
            onClick={() => navigate('/developer/crs')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View All →
          </button>
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
                  <th className="table-header">Target Date</th>
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
                    <td className="table-cell text-gray-500">{formatDate(cr.targetDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No CRs assigned yet</p>
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboard;