import React, { useState, useEffect } from 'react';
import { crAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import { formatDate, formatCurrency, isOverdue } from '../../utils/helpers';
import { toast } from 'react-toastify';

const MyCRs = () => {
  const [crs, setCRs] = useState([]);
  const [filteredCRs, setFilteredCRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState(null);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [statusFormData, setStatusFormData] = useState({
    newStatus: '',
    actualHours: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = ['In Progress', 'Under UAT', 'In Production'];

  useEffect(() => {
    fetchMyCRs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, crs]);

  const fetchMyCRs = async () => {
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

  const handleSubmitEstimate = (cr) => {
    setSelectedCR(cr);
    setEstimatedHours('');
    setShowEstimateModal(true);
  };

  const handleUpdateStatus = (cr) => {
    setSelectedCR(cr);
    setStatusFormData({
      newStatus: '',
      actualHours: '',
      remarks: '',
    });
    setShowStatusModal(true);
  };

  const submitEstimate = async () => {
    if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
      toast.error('Please enter valid estimated hours');
      return;
    }

    setSubmitting(true);
    try {
      const response = await crAPI.submitEstimate(
        selectedCR.CR_Number,
        parseFloat(estimatedHours)
      );

      if (response.success) {
        toast.success('Estimate submitted successfully');
        setShowEstimateModal(false);
        fetchMyCRs();
      }
    } catch (error) {
      toast.error('Failed to submit estimate');
    } finally {
      setSubmitting(false);
    }
  };

  const submitStatusUpdate = async () => {
    if (!statusFormData.newStatus) {
      toast.error('Please select a status');
      return;
    }

    setSubmitting(true);
    try {
      const response = await crAPI.updateStatus(
        selectedCR.CR_Number,
        statusFormData.newStatus,
        statusFormData.actualHours ? parseFloat(statusFormData.actualHours) : null,
        statusFormData.remarks
      );

      if (response.success) {
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        fetchMyCRs();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your CRs..." />;
  }

  const pendingEstimation = crs.filter(cr => cr.Status === 'Estimation Pending').length;
  const inProgress = crs.filter(cr => cr.Status === 'In Progress').length;
  const completed = crs.filter(cr => ['Closed', 'Billed'].includes(cr.Status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Change Requests</h1>
        <p className="text-gray-600 mt-1">View and manage your assigned CRs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total CRs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{crs.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiEye className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Estimation</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingEstimation}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiClock className="text-orange-600" size={24} />
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
              <FiEdit className="text-purple-600" size={24} />
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
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="Estimation Pending">Estimation Pending</option>
              <option value="Approval Pending">Approval Pending</option>
              <option value="Approved - In Development">Approved - In Development</option>
              <option value="In Progress">In Progress</option>
              <option value="Under UAT">Under UAT</option>
              <option value="In Production">In Production</option>
              <option value="Ready for Billing">Ready for Billing</option>
              <option value="Billed">Billed</option>
              <option value="Closed">Closed</option>
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
                  <th className="table-header">Est. Hours</th>
                  <th className="table-header">Est. Amount</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCRs.map((cr) => {
                  const overdue = isOverdue(cr.Target_Date) && 
                    !['Closed', 'Billed', 'Rejected'].includes(cr.Status);
                  
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
                      <td className="table-cell">{cr.Estimated_Hours || '-'}</td>
                      <td className="table-cell">{formatCurrency(cr.Estimated_Amount || 0)}</td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(cr)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                          
                          {cr.Status === 'Estimation Pending' && (
                            <button
                              onClick={() => handleSubmitEstimate(cr)}
                              className="text-orange-600 hover:text-orange-800"
                              title="Submit Estimate"
                            >
                              <FiClock size={18} />
                            </button>
                          )}
                          
                          {['Approved - In Development', 'In Progress', 'Under UAT'].includes(cr.Status) && (
                            <button
                              onClick={() => handleUpdateStatus(cr)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Update Status"
                            >
                              <FiEdit size={18} />
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
                {searchTerm || statusFilter
                  ? 'No CRs found matching your filters'
                  : 'No CRs assigned yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CR Details Modal */}
      {selectedCR && showDetailModal && (
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
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {selectedCR.Description}
              </p>
            </div>

            {/* Hours & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estimated Hours</p>
                <p className="font-medium text-gray-900 text-xl">
                  {selectedCR.Estimated_Hours || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Amount</p>
                <p className="font-medium text-green-600 text-xl">
                  {formatCurrency(selectedCR.Estimated_Amount || 0)}
                </p>
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
          </div>
        </Modal>
      )}

      {/* Submit Estimate Modal */}
      <Modal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        title="Submit Estimate"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>CR:</strong> {selectedCR?.CR_Number} - {selectedCR?.Title}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours *
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              step="0.5"
              min="0"
              className="input-field"
              placeholder="Enter estimated hours"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide your best estimate for completing this CR
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowEstimateModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={submitEstimate}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Estimate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update CR Status"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>CR:</strong> {selectedCR?.CR_Number} - {selectedCR?.Title}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Current Status:</strong> <StatusBadge status={selectedCR?.Status} />
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={statusFormData.newStatus}
              onChange={(e) => setStatusFormData({ ...statusFormData, newStatus: e.target.value })}
              className="input-field"
            >
              <option value="">Select Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Hours (Optional)
            </label>
            <input
              type="number"
              value={statusFormData.actualHours}
              onChange={(e) => setStatusFormData({ ...statusFormData, actualHours: e.target.value })}
              step="0.5"
              min="0"
              className="input-field"
              placeholder="Enter actual hours spent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={statusFormData.remarks}
              onChange={(e) => setStatusFormData({ ...statusFormData, remarks: e.target.value })}
              rows="3"
              className="input-field"
              placeholder="Enter any remarks or notes"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowStatusModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={submitStatusUpdate}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyCRs;