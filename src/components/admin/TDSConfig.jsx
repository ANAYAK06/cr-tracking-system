import React, { useState, useEffect } from 'react';
import { tdsAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { FiPlus, FiSettings, FiCalendar } from 'react-icons/fi';
import { formatDate, getInputDateFormat } from '../../utils/helpers';
import { toast } from 'react-toastify';

const TDSConfig = () => {
  const [currentTDS, setCurrentTDS] = useState(null);
  const [tdsHistory, setTDSHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: getInputDateFormat(new Date()),
    tdsPercentage: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTDSData();
  }, []);

  const fetchTDSData = async () => {
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        tdsAPI.getCurrent(),
        tdsAPI.getHistory(),
      ]);

      if (currentResponse.success) {
        setCurrentTDS(currentResponse.data);
      }

      if (historyResponse.success) {
        setTDSHistory(historyResponse.data);
      }
    } catch (error) {
      toast.error('Error loading TDS configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required';
    }

    if (!formData.tdsPercentage) {
      errors.tdsPercentage = 'TDS percentage is required';
    } else if (
      isNaN(formData.tdsPercentage) ||
      parseFloat(formData.tdsPercentage) < 0 ||
      parseFloat(formData.tdsPercentage) > 100
    ) {
      errors.tdsPercentage = 'TDS percentage must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const response = await tdsAPI.update(
        formData.effectiveDate,
        parseFloat(formData.tdsPercentage)
      );

      if (response.success) {
        toast.success('TDS configuration updated successfully');
        setShowModal(false);
        setFormData({
          effectiveDate: getInputDateFormat(new Date()),
          tdsPercentage: '',
        });
        fetchTDSData();
      }
    } catch (error) {
      toast.error('Failed to update TDS configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading TDS configuration..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TDS Configuration</h1>
          <p className="text-gray-600 mt-1">Manage TDS percentage settings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FiPlus size={20} />
          <span>Update TDS Rate</span>
        </button>
      </div>

      {/* Current TDS Rate */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-primary-100 p-3 rounded-full">
            <FiSettings className="text-primary-600" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current TDS Rate</h2>
            <p className="text-sm text-gray-600">Active rate for all new invoices</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8 text-center">
          <p className="text-sm font-medium text-primary-600 mb-2">Current Rate</p>
          <p className="text-6xl font-bold text-primary-700">
            {currentTDS?.tdsPercentage || 0}%
          </p>
          <p className="text-sm text-primary-600 mt-4">
            Applied to all invoices generated from today
          </p>
        </div>
      </div>

      {/* TDS History */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FiCalendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">TDS Rate History</h2>
            <p className="text-sm text-gray-600">Historical TDS rate changes</p>
          </div>
        </div>

        {tdsHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Effective Date</th>
                  <th className="table-header">TDS Percentage</th>
                  <th className="table-header">Updated By</th>
                  <th className="table-header">Updated Date</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tdsHistory.map((config, index) => {
                  const isActive = index === 0; // First one is most recent (active)
                  
                  return (
                    <tr key={config.Config_ID} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">
                        {formatDate(config.Effective_Date)}
                      </td>
                      <td className="table-cell">
                        <span className="text-2xl font-bold text-primary-600">
                          {config.TDS_Percentage}%
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">{config.Updated_By}</td>
                      <td className="table-cell text-gray-600">
                        {formatDate(config.Updated_Date)}
                      </td>
                      <td className="table-cell">
                        {isActive ? (
                          <span className="badge bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-800">Historical</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No TDS configuration history available</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ How TDS Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• TDS (Tax Deducted at Source) is automatically applied to all invoices</li>
          <li>• The rate is determined by the effective date - invoices use the rate applicable on their generation date</li>
          <li>• Net Amount = Gross Amount - TDS Amount</li>
          <li>• Historical rates are preserved for audit purposes</li>
          <li>• You can update the rate at any time for future invoices</li>
        </ul>
      </div>

      {/* Update TDS Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Update TDS Rate"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Important:</strong> This will affect all new invoices generated from the effective date onwards.
              Existing invoices will not be affected.
            </p>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date *
            </label>
            <input
              type="date"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              min={getInputDateFormat(new Date())}
              className={`input-field ${formErrors.effectiveDate ? 'border-red-500' : ''}`}
            />
            {formErrors.effectiveDate && (
              <p className="text-red-500 text-xs mt-1">{formErrors.effectiveDate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              The date from which this rate will be applicable
            </p>
          </div>

          {/* TDS Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TDS Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                name="tdsPercentage"
                value={formData.tdsPercentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                className={`input-field pr-10 ${formErrors.tdsPercentage ? 'border-red-500' : ''}`}
                placeholder="Enter TDS percentage"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                %
              </span>
            </div>
            {formErrors.tdsPercentage && (
              <p className="text-red-500 text-xs mt-1">{formErrors.tdsPercentage}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter a value between 0 and 100
            </p>
          </div>

          {/* Preview */}
          {formData.tdsPercentage && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview Calculation:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Amount (example):</span>
                  <span className="font-medium">₹10,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TDS @ {formData.tdsPercentage}%:</span>
                  <span className="font-medium text-red-600">
                    -₹{((10000 * parseFloat(formData.tdsPercentage || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Net Amount:</span>
                  <span className="font-bold text-green-600">
                    ₹{(10000 - (10000 * parseFloat(formData.tdsPercentage || 0)) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update TDS Rate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TDSConfig;