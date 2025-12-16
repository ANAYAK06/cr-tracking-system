import React, { useState, useEffect } from 'react';
import { clientAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiPlus, 
  FiEdit2, 
  FiSearch,
  FiUser
} from 'react-icons/fi';
import {FaBuilding} from 'react-icons/fa';
import { isValidEmail, validatePassword } from '../../utils/helpers';
import { toast } from 'react-toastify';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    gstNumber: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.Organization_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.Contact_Person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.Phone?.includes(searchTerm) ||
          client.Client_ID?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll();
      if (response.success) {
        setClients(response.data);
        setFilteredClients(response.data);
      } else {
        toast.error('Failed to load clients');
      }
    } catch (error) {
      toast.error('Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setSelectedClient(null);
    setFormData({
      organizationName: '',
      contactPerson: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      gstNumber: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (client) => {
    setEditMode(true);
    setSelectedClient(client);
    setFormData({
      organizationName: client.Organization_Name || '',
      contactPerson: client.Contact_Person || '',
      email: client.Email || '',
      password: '', // Don't populate password
      phone: client.Phone || '',
      address: client.Address || '',
      gstNumber: client.GST_Number || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
    }

    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!editMode) {
      // Password required only for new clients
      if (!formData.password) {
        errors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
          errors.password = passwordValidation.message;
        }
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
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
      let response;
      
      if (editMode) {
        // Update existing client
        const updates = {
          organizationName: formData.organizationName,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          address: formData.address,
          gstNumber: formData.gstNumber,
        };
        response = await clientAPI.update(selectedClient.Client_ID, updates);
      } else {
        // Register new client
        const clientData = {
          organizationName: formData.organizationName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          gstNumber: formData.gstNumber,
        };
        response = await clientAPI.register(clientData);
      }

      if (response.success) {
        toast.success(editMode ? 'Client updated successfully' : 'Client registered successfully');
        setShowModal(false);
        fetchClients();
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading clients..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage client organizations</p>
        </div>
        <button onClick={handleAddNew} className="btn-primary flex items-center space-x-2">
          <FiPlus size={20} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{clients.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaBuilding className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {clients.filter(c => c.Status === 'Active').length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiUser className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Clients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {clients.filter(c => c.Status === 'Inactive').length}
              </h3>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FiUser className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by organization, contact person, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Client ID</th>
                  <th className="table-header">Organization</th>
                  <th className="table-header">Contact Person</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">GST Number</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.Client_ID} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-primary-600">
                      {client.Client_ID}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-3">
                          {client.Organization_Name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{client.Organization_Name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{client.Contact_Person}</td>
                    <td className="table-cell text-gray-600">{client.Email}</td>
                    <td className="table-cell text-gray-600">{client.Phone}</td>
                    <td className="table-cell text-gray-600">
                      {client.GST_Number || '-'}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={client.Status} />
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {searchTerm ? 'No clients found matching your search' : 'No clients registered yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? 'Edit Client' : 'Register New Client'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className={`input-field ${formErrors.organizationName ? 'border-red-500' : ''}`}
                placeholder="Enter organization name"
              />
              {formErrors.organizationName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.organizationName}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person *
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`input-field ${formErrors.contactPerson ? 'border-red-500' : ''}`}
                placeholder="Enter contact person name"
              />
              {formErrors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Login ID) *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={editMode}
                className={`input-field ${formErrors.email ? 'border-red-500' : ''} ${editMode ? 'bg-gray-100' : ''}`}
                placeholder="client@example.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Password - Only for new clients */}
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${formErrors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter password"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number (Optional)
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter GST number"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Enter full address"
            ></textarea>
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
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editMode ? 'Update Client' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientManagement;