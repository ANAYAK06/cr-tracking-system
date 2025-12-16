import React, { useState, useEffect } from 'react';
import { developerAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  FiPlus, 
  FiEdit2, 
  FiSearch,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiUser
} from 'react-icons/fi';
import { formatCurrency, isValidEmail, validatePassword } from '../../utils/helpers';
import { toast } from 'react-toastify';

const DeveloperManagement = () => {
  const [developers, setDevelopers] = useState([]);
  const [filteredDevelopers, setFilteredDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    hourlyRate: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  useEffect(() => {
    // Filter developers based on search term
    if (searchTerm.trim() === '') {
      setFilteredDevelopers(developers);
    } else {
      const filtered = developers.filter(
        (dev) =>
          dev.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dev.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dev.Phone?.includes(searchTerm) ||
          dev.Developer_ID?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDevelopers(filtered);
    }
  }, [searchTerm, developers]);

  const fetchDevelopers = async () => {
    try {
      const response = await developerAPI.getAll();
      if (response.success) {
        setDevelopers(response.data);
        setFilteredDevelopers(response.data);
      } else {
        toast.error('Failed to load developers');
      }
    } catch (error) {
      toast.error('Error loading developers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setSelectedDeveloper(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      hourlyRate: '',
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      address: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (developer) => {
    setEditMode(true);
    setSelectedDeveloper(developer);
    setFormData({
      name: developer.Name || '',
      email: developer.Email || '',
      password: '', // Don't populate password
      phone: developer.Phone || '',
      hourlyRate: developer.Hourly_Rate || '',
      accountHolder: developer.Account_Holder || '',
      accountNumber: developer.Account_Number || '',
      ifscCode: developer.IFSC_Code || '',
      bankName: developer.Bank_Name || '',
      address: developer.Address || '',
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

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!editMode) {
      // Password required only for new developers
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

    if (!formData.hourlyRate) {
      errors.hourlyRate = 'Hourly rate is required';
    } else if (isNaN(formData.hourlyRate) || parseFloat(formData.hourlyRate) <= 0) {
      errors.hourlyRate = 'Invalid hourly rate';
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
        // Update existing developer
        const updates = {
          name: formData.name,
          phone: formData.phone,
          hourlyRate: parseFloat(formData.hourlyRate),
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          address: formData.address,
        };
        response = await developerAPI.update(selectedDeveloper.Developer_ID, updates);
      } else {
        // Register new developer
        const developerData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          hourlyRate: parseFloat(formData.hourlyRate),
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          address: formData.address,
        };
        response = await developerAPI.register(developerData);
      }

      if (response.success) {
        toast.success(editMode ? 'Developer updated successfully' : 'Developer registered successfully');
        setShowModal(false);
        fetchDevelopers();
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading developers..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Management</h1>
          <p className="text-gray-600 mt-1">Manage outsourced developers</p>
        </div>
        <button onClick={handleAddNew} className="btn-primary flex items-center space-x-2">
          <FiPlus size={20} />
          <span>Add Developer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Developers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {filteredDevelopers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Developer ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Hourly Rate</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevelopers.map((developer) => (
                  <tr key={developer.Developer_ID} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-primary-600">
                      {developer.Developer_ID}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-3">
                          {developer.Name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{developer.Name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{developer.Email}</td>
                    <td className="table-cell text-gray-600">{developer.Phone}</td>
                    <td className="table-cell font-medium text-green-600">
                      {formatCurrency(developer.Hourly_Rate)}/hr
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={developer.Status} />
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleEdit(developer)}
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
                {searchTerm ? 'No developers found matching your search' : 'No developers registered yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? 'Edit Developer' : 'Register New Developer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="Enter full name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
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
                placeholder="developer@example.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Password - Only for new developers */}
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

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (₹) *
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                step="0.01"
                className={`input-field ${formErrors.hourlyRate ? 'border-red-500' : ''}`}
                placeholder="Enter hourly rate"
              />
              {formErrors.hourlyRate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.hourlyRate}</p>
              )}
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Bank Details (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter bank name"
                />
              </div>
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
              {submitting ? 'Saving...' : editMode ? 'Update Developer' : 'Register Developer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeveloperManagement;