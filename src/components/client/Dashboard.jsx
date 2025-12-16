import React, { useState, useEffect } from 'react';
import { reportAPI, crAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { 
  FiFileText, 
  FiDollarSign, 
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity
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

const ClientDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [allCRs, setAllCRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, crsResponse] = await Promise.all([
        reportAPI.getDashboard(),
        crAPI.getAll()
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      } else {
        toast.error('Failed to load dashboard data');
      }

      if (crsResponse.success) {
        setAllCRs(crsResponse.data);
      }
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calculate hours statistics
  const calculateHoursStats = () => {
    let totalEstimated = 0;
    let totalActual = 0;
    let billedHours = 0;
    let unbilledHours = 0;

    allCRs.forEach(cr => {
      const estimated = parseFloat(cr.Estimated_Hours) || 0;
      const actual = parseFloat(cr.Actual_Hours) || 0;
      
      totalEstimated += estimated;
      totalActual += actual;

      // If CR is billed or closed, hours are billed
      if (['Billed', 'Closed'].includes(cr.Status)) {
        billedHours += actual || estimated;
      } else if (['In Progress', 'Under UAT', 'In Production', 'Ready for Billing'].includes(cr.Status)) {
        // If CR is in progress but not billed yet
        unbilledHours += actual || estimated;
      }
    });

    return {
      totalEstimated,
      totalActual,
      billedHours,
      unbilledHours
    };
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

  const { crs, billing, pendingApprovals } = dashboardData;
  const hoursStats = calculateHoursStats();
  const paidAmount = (billing?.totalNet || 0) - (billing?.totalBalance || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiAlertCircle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-orange-800">Action Required</h4>
              <p className="text-sm text-orange-700 mt-1">
                You have {pendingApprovals.length} CR{pendingApprovals.length > 1 ? 's' : ''} waiting for your approval.
              </p>
              <button
                onClick={() => navigate('/client/approvals')}
                className="text-sm text-orange-800 font-medium mt-2 hover:underline"
              >
                View Pending Approvals →
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
          subtitle="Your requests"
          onClick={() => navigate('/client/crs')}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals?.length || 0}
          icon={FiClock}
          color="bg-orange-500"
          subtitle="Awaiting action"
          onClick={() => navigate('/client/approvals')}
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(billing?.totalNet || 0)}
          icon={FiDollarSign}
          color="bg-green-500"
          subtitle="Net amount"
        />
        <StatCard
          title="Balance Payable"
          value={formatCurrency(billing?.totalBalance || 0)}
          icon={FiAlertCircle}
          color="bg-red-500"
          subtitle="Outstanding"
        />
      </div>

      {/* Hours & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2" size={20} />
            Hours Overview
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Total Estimated</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">
                  {hoursStats.totalEstimated.toFixed(1)} hrs
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600">Total Actual</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">
                  {hoursStats.totalActual.toFixed(1)} hrs
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">Billed Hours</p>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {hoursStats.billedHours.toFixed(1)} hrs
                </p>
                <p className="text-xs text-green-600 mt-1">Invoiced</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-600">Unbilled Hours</p>
                <p className="text-2xl font-bold text-orange-700 mt-2">
                  {hoursStats.unbilledHours.toFixed(1)} hrs
                </p>
                <p className="text-xs text-orange-600 mt-1">In progress</p>
              </div>
            </div>

            {hoursStats.totalEstimated > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {((hoursStats.totalActual / hoursStats.totalEstimated) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((hoursStats.totalActual / hoursStats.totalEstimated) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="mr-2" size={20} />
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-600">Gross Billed</p>
                  <FiTrendingUp className="text-blue-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(billing?.totalGross || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {billing?.invoiceCount || 0} invoice(s)
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-red-600">TDS Deducted</p>
                  <FiAlertCircle className="text-red-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(billing?.totalTDS || 0)}
                </p>
                <p className="text-xs text-red-600 mt-1">Tax component</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-600">Net Payable</p>
                  <FiCheckCircle className="text-green-600" size={18} />
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(billing?.totalNet || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">After TDS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-600">Amount Paid</p>
              <FiCheckCircle className="text-green-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(paidAmount)}
            </p>
            <p className="text-xs text-green-600 mt-1">Settled</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-red-600">Balance Due</p>
              <FiAlertCircle className="text-red-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(billing?.totalBalance || 0)}
            </p>
            <p className="text-xs text-red-600 mt-1">Outstanding</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-600">Payment Progress</p>
              <FiActivity className="text-blue-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {billing?.totalNet > 0 ? ((paidAmount / billing.totalNet) * 100).toFixed(1) : 0}%
            </p>
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${billing?.totalNet > 0 ? Math.min((paidAmount / billing.totalNet) * 100, 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Calculation</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gross Amount:</span>
              <span className="font-medium">{formatCurrency(billing?.totalGross || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Less: TDS:</span>
              <span className="font-medium">- {formatCurrency(billing?.totalTDS || 0)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2"></div>
            <div className="flex justify-between text-sm font-semibold text-green-700">
              <span>Net Payable:</span>
              <span>{formatCurrency(billing?.totalNet || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Already Paid:</span>
              <span className="font-medium">- {formatCurrency(paidAmount)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2"></div>
            <div className="flex justify-between font-bold text-lg text-red-700">
              <span>Balance to Pay:</span>
              <span>{formatCurrency(billing?.totalBalance || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CR Status Overview & Pending Approvals */}
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
              <p className="text-gray-500 text-center py-4">No CRs yet</p>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {pendingApprovals && pendingApprovals.length > 0 ? (
              pendingApprovals.slice(0, 5).map((approval, index) => (
                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        {approval.crNumber}
                      </p>
                      <p className="text-xs text-orange-700 mt-1">{approval.title}</p>
                      <p className="text-xs text-orange-600 mt-1 font-semibold">
                        Est: {formatCurrency(approval.estimatedAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/client/approvals')}
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiCheckCircle className="mx-auto text-green-500 mb-2" size={40} />
                <p className="text-gray-600">All caught up! No pending approvals.</p>
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
            onClick={() => navigate('/client/crs')}
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
                  <th className="table-header">Estimated Amount</th>
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
                    <td className="table-cell font-medium text-green-600">
                      {formatCurrency(cr.estimatedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No CRs yet</p>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;