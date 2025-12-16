import React, { useState, useEffect } from 'react';
import { crAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle
} from 'react-icons/fi';
import { formatDate, formatCurrency, isOverdue } from '../../utils/helpers';
import { toast } from 'react-toastify';

const CRList = () => {
  const [crs, setCRs] = useState([]);
  const [filteredCRs, setFilteredCRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState(null);

  const statusOptions = [
    'Estimation Pending',
    'Approval Pending',
    'Approved - In Development',
    'In Progress',
    'Under UAT',
    'In Production',
    'Ready for Billing',
    'Billed',
    'Closed',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    fetchCRs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, priorityFilter, crs]);

  const fetchCRs = async () => {
    try {
      const response = await crAPI.getAll();
      if (response.success) {
        setCRs(response.data);
      }
    } catch (error) {
      toast.error('Error loading CRs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...crs];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (cr) =>
          cr.CR_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cr.Title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((cr) => cr.Status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((cr) => cr.Priority === priorityFilter);
    }

    setFilteredCRs(filtered);
  };

  const handleViewDetails = async (cr) => {
    try {
      const response = await crAPI.getById(cr.CR_Number);
      if (response.success) {
        setSelectedCR(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Error loading CR details');
    }
  };

  const handleMarkReadyForBilling = async (crNumber) => {
    if (!window.confirm('Are you sure you want to mark this CR as Ready for Billing?')) {
      return;
    }

    try {
      const response = await crAPI.markReadyForBilling(crNumber, 'Marked ready for billing by client');
      if (response.success) {
        toast.success('CR marked as Ready for Billing');
        fetchCRs();
      }
    } catch (error) {
      toast.error('Failed to update CR status');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading change requests..." />;
  }

  const totalCRs = crs.length;
  const inProgress = crs.filter(cr => 
    ['In Progress', 'Under UAT'].includes(cr.Status)
  ).length;
  const completed = crs.filter(cr => 
    ['Closed', 'Billed'].includes(cr.Status)
  ).length;
  const totalEstimatedAmount = crs.reduce((sum, cr) => sum + (cr.Estimated_Amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Change Requests</h1>
        <p className="text-gray-600 mt-1">View all your change requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total CRs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalCRs}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiEye className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{inProgress}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiSearch className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{completed}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Estimated</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalEstimatedAmount)}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiFilter className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by CR number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CRs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {filteredCRs.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">CR Number</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Target Date</th>
                  <th className="table-header">Est. Amount</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCRs.map((cr) => {
                  const overdue = isOverdue(cr.Target_Date) && 
                    !['Closed', 'Billed', 'Rejected'].includes(cr.Status);
                  const canMarkReady = cr.Status === 'In Production';
                  
                  return (
                    <tr key={cr.CR_Number} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-primary-600">
                        {cr.CR_Number}
                      </td>
                      <td className="table-cell font-medium">{cr.Title}</td>
                      <td className="table-cell">
                        <StatusBadge status={cr.Status} />
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={cr.Priority} type="priority" />
                      </td>
                      <td className="table-cell">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatDate(cr.Target_Date)}
                          {overdue && ' ⚠️'}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-green-600">
                        {formatCurrency(cr.Estimated_Amount || 0)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(cr)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                          
                          {canMarkReady && (
                            <button
                              onClick={() => handleMarkReadyForBilling(cr.CR_Number)}
                              className="text-green-600 hover:text-green-800"
                              title="Mark Ready for Billing"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {searchTerm || statusFilter || priorityFilter
                  ? 'No CRs found matching your filters'
                  : 'No change requests yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CR Details Modal */}
      {selectedCR && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCR(null);
          }}
          title={`CR Details - ${selectedCR.CR_Number}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium text-gray-900">{selectedCR.Title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={selectedCR.Status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <StatusBadge status={selectedCR.Priority} type="priority" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedCR.Target_Date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedCR.Start_Date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedCR.Created_Date)}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {selectedCR.Description}
              </p>
            </div>

            {/* Estimation Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Estimation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Estimated Hours</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {selectedCR.Estimated_Hours || '-'}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600">Estimated Amount</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatCurrency(selectedCR.Estimated_Amount || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status History */}
            {selectedCR.statusHistory && selectedCR.statusHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCR.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={history.New_Status} />
                          <span className="text-sm text-gray-500">
                            {formatDate(history.Changed_Date)}
                          </span>
                        </div>
                        {history.Remarks && (
                          <p className="text-sm text-gray-600 mt-1">{history.Remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {selectedCR.Status === 'In Production' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-3">
                  This CR is in production. You can mark it as ready for billing.
                </p>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleMarkReadyForBilling(selectedCR.CR_Number);
                  }}
                  className="btn-success"
                >
                  Mark Ready for Billing
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CRList;