import React, { useState, useEffect } from 'react';
import { crAPI, developerAPI, clientAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import {
  FiPlus,
  FiEdit2,
  FiSearch,
  FiEye,
  FiFilter,
  FiFileText
} from 'react-icons/fi';
import { formatDate, formatCurrency, getInputDateFormat, isOverdue } from '../../utils/helpers';
import { toast } from 'react-toastify';

const CRManagement = () => {
  const [crs, setCRs] = useState([]);
  const [filteredCRs, setFilteredCRs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    developerId: '',
    priority: 'Medium',
    targetDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const statuses = [
    'Estimation Pending',
    'Approval Pending',
    'Approved - In Development',
    'In Progress',
    'Under UAT',
    'In Production',
    'Ready for Billing',
    'Billed',
    'Closed',
    'Rejected',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, priorityFilter, crs]);

  const fetchInitialData = async () => {
    try {
      const [crResponse, devResponse, clientResponse] = await Promise.all([
        crAPI.getAll(),
        developerAPI.getAll(),
        clientAPI.getAll(),
      ]);

      if (crResponse.success) setCRs(crResponse.data);
      if (devResponse.success) setDevelopers(devResponse.data);
      if (clientResponse.success) setClients(clientResponse.data);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...crs];

    // Search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (cr) =>
          cr.CR_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cr.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cr.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((cr) => cr.Status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter((cr) => cr.Priority === priorityFilter);
    }

    setFilteredCRs(filtered);
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      clientId: '',
      developerId: '',
      priority: 'Medium',
      targetDate: '',
    });
    setFormErrors({});
    setShowModal(true);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.clientId) {
      errors.clientId = 'Client is required';
    }

    if (!formData.developerId) {
      errors.developerId = 'Developer is required';
    }

    if (!formData.targetDate) {
      errors.targetDate = 'Target date is required';
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
      const crData = {
        title: formData.title,
        description: formData.description,
        clientId: formData.clientId,
        developerId: formData.developerId,
        priority: formData.priority,
        targetDate: formData.targetDate,
      };

      const response = await crAPI.create(crData);

      if (response.success) {
        toast.success('CR created successfully');
        setShowModal(false);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to create CR');
    } finally {
      setSubmitting(false);
    }
  };

  const getDeveloperName = (devId) => {
    const dev = developers.find((d) => d.Developer_ID === devId);
    return dev?.Name || '-';
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.Client_ID === clientId);
    return client?.Organization_Name || '-';
  };

  if (loading) {
    return <LoadingSpinner text="Loading change requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Request Management</h1>
          <p className="text-gray-600 mt-1">Create and manage change requests</p>
        </div>
        <button onClick={handleAddNew} className="btn-primary flex items-center space-x-2">
          <FiPlus size={20} />
          <span>Create CR</span>
        </button>
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
              <FiFileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {crs.filter((cr) => cr.Status === 'In Progress').length}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiFileText className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {crs.filter((cr) => cr.Status === 'Approval Pending').length}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiFileText className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {crs.filter((cr) => cr.Status === 'Closed' || cr.Status === 'Billed').length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiFileText className="text-green-600" size={24} />
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
              placeholder="Search by CR number, title..."
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
              {statuses.map((status) => (
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
                  <th className="table-header">Client</th>
                  <th className="table-header">Developer</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Target Date</th>
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
                      <td className="table-cell text-gray-600">
                        {getClientName(cr.Client_ID)}
                      </td>
                      <td className="table-cell text-gray-600">
                        {getDeveloperName(cr.Developer_ID)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={cr.Status} />
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={cr.Priority} type="priority" />
                      </td>
                      <td className="table-cell">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatDate(cr.Target_Date)}
                          {overdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleViewDetails(cr)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <FiEye size={18} />
                        </button>
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
                  : 'No change requests created yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create CR Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Change Request"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${formErrors.title ? 'border-red-500' : ''}`}
              placeholder="Enter CR title"
            />
            {formErrors.title && (
              <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={`input-field ${formErrors.description ? 'border-red-500' : ''}`}
              placeholder="Enter detailed description"
            ></textarea>
            {formErrors.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className={`input-field ${formErrors.clientId ? 'border-red-500' : ''}`}
              >
                <option value="">Select Client</option>
                {clients
                  .filter((c) => c.Status === 'Active')
                  .map((client) => (
                    <option key={client.Client_ID} value={client.Client_ID}>
                      {client.Organization_Name}
                    </option>
                  ))}
              </select>
              {formErrors.clientId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.clientId}</p>
              )}
            </div>

            {/* Developer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Developer *
              </label>
              <select
                name="developerId"
                value={formData.developerId}
                onChange={handleChange}
                className={`input-field ${formErrors.developerId ? 'border-red-500' : ''}`}
              >
                <option value="">Select Developer</option>
                {developers.map((developer) => (
                  <option key={developer.Developer_ID} value={developer.Developer_ID}>
                    {developer.Name}
                  </option>
                ))}
              </select>
              {formErrors.developerId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.developerId}</p>
              )}
              {/* Debug info */}
              {developers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No developers found</p>
              )}
            </div>
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date *
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                min={getInputDateFormat(new Date())}
                className={`input-field ${formErrors.targetDate ? 'border-red-500' : ''}`}
              />
              {formErrors.targetDate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.targetDate}</p>
              )}
            </div>
          </div>

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
              {submitting ? 'Creating...' : 'Create CR'}
            </button>
          </div>
        </form>
      </Modal>

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
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedCR.Description}</p>
            </div>

            {/* Client & Developer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{getClientName(selectedCR.Client_ID)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Developer</p>
                <p className="font-medium text-gray-900">{getDeveloperName(selectedCR.Developer_ID)}</p>
              </div>
            </div>

            {/* Hours & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estimated Hours</p>
                <p className="font-medium text-gray-900">{selectedCR.Estimated_Hours || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Amount</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(selectedCR.Estimated_Amount || 0)}
                </p>
              </div>
            </div>

            {/* Status History */}
            {selectedCR.statusHistory && selectedCR.statusHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status History</h3>
                <div className="space-y-2">
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
    </div>
  );
};

export default CRManagement;