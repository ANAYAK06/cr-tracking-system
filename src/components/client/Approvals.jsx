import React, { useState, useEffect } from 'react';
import { crAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiAlertCircle
} from 'react-icons/fi';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';

const Approvals = () => {
  const [pendingCRs, setPendingCRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState(null);
  const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await crAPI.getAll({ status: 'Approval Pending' });
      if (response.success) {
        const pending = response.data.filter(cr => cr.Status === 'Approval Pending');
        setPendingCRs(pending);
      }
    } catch (error) {
      toast.error('Error loading pending approvals');
    } finally {
      setLoading(false);
    }
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

  const handleApprovalAction = (cr, action) => {
    setSelectedCR(cr);
    setApprovalAction(action);
    setRemarks('');
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    setSubmitting(true);
    try {
      const response = await crAPI.approve(
        selectedCR.CR_Number,
        approvalAction,
        remarks
      );

      if (response.success) {
        toast.success(
          approvalAction === 'approve' 
            ? 'CR approved successfully' 
            : 'CR rejected'
        );
        setShowApprovalModal(false);
        fetchPendingApprovals();
      }
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading pending approvals..." />;
  }

  const totalEstimated = pendingCRs.reduce((sum, cr) => sum + (cr.Estimated_Amount || 0), 0);
  const totalHours = pendingCRs.reduce((sum, cr) => sum + (cr.Estimated_Hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve change requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending CRs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingCRs.length}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiAlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalHours}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiCheckCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Estimated</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalEstimated)}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Box */}
      {pendingCRs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiAlertCircle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-orange-800">Action Required</h4>
              <p className="text-sm text-orange-700 mt-1">
                You have {pendingCRs.length} CR{pendingCRs.length > 1 ? 's' : ''} waiting for your approval. 
                Please review and approve or reject them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending CRs List */}
      <div className="space-y-4">
        {pendingCRs.length > 0 ? (
          pendingCRs.map((cr) => (
            <div key={cr.CR_Number} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cr.CR_Number}
                    </h3>
                    <StatusBadge status={cr.Priority} type="priority" />
                  </div>
                  
                  <h4 className="text-base font-medium text-gray-800 mb-2">
                    {cr.Title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {cr.Description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Target Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(cr.Target_Date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Hours</p>
                      <p className="text-sm font-medium text-blue-600">
                        {cr.Estimated_Hours}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Amount</p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(cr.Estimated_Amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <StatusBadge status={cr.Status} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleViewDetails(cr)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <FiEye size={16} />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleApprovalAction(cr, 'approve')}
                    className="btn-success flex items-center space-x-2 whitespace-nowrap"
                  >
                    <FiCheckCircle size={18} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleApprovalAction(cr, 'reject')}
                    className="btn-danger flex items-center space-x-2 whitespace-nowrap"
                  >
                    <FiXCircle size={18} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <FiCheckCircle className="text-green-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600">
                No pending approvals at the moment.
              </p>
            </div>
          </div>
        )}
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
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {selectedCR.Description}
              </p>
            </div>

            {/* Estimation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Developer Estimation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Estimated Hours</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {selectedCR.Estimated_Hours}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600">Estimated Amount</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {formatCurrency(selectedCR.Estimated_Amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleApprovalAction(selectedCR, 'reject');
                }}
                className="btn-danger"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleApprovalAction(selectedCR, 'approve');
                }}
                className="btn-success"
              >
                Approve
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={approvalAction === 'approve' ? 'Approve CR' : 'Reject CR'}
        size="md"
      >
        <div className="space-y-4">
          <div className={`${approvalAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <p className="text-sm font-medium">
              <strong>CR:</strong> {selectedCR?.CR_Number} - {selectedCR?.Title}
            </p>
            <p className="text-sm mt-2">
              <strong>Estimated Hours:</strong> {selectedCR?.Estimated_Hours}
            </p>
            <p className="text-sm">
              <strong>Estimated Amount:</strong> {formatCurrency(selectedCR?.Estimated_Amount || 0)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks {approvalAction === 'reject' ? '*' : '(Optional)'}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="4"
              className="input-field"
              placeholder={
                approvalAction === 'approve'
                  ? 'Enter any comments or conditions...'
                  : 'Please provide reason for rejection...'
              }
            ></textarea>
          </div>

          <div className={`${approvalAction === 'approve' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <p className="text-sm">
              {approvalAction === 'approve'
                ? '✓ By approving, the developer will be notified to begin development.'
                : '⚠️ By rejecting, the CR will be marked as rejected and the developer will be notified.'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={submitApproval}
              className={approvalAction === 'approve' ? 'btn-success' : 'btn-danger'}
              disabled={submitting || (approvalAction === 'reject' && !remarks.trim())}
            >
              {submitting
                ? 'Processing...'
                : approvalAction === 'approve'
                ? 'Approve CR'
                : 'Reject CR'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Approvals;