import React, { useState, useEffect } from 'react';
import { invoiceAPI, crAPI, developerAPI, clientAPI } from '../../api/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import InvoicePDFGenerator from './InvoicePDFGenerator';
import { 
  FiFileText,
  FiDownload,
  FiEye,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [crs, setCRs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCR, setSelectedCR] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [availableAdvance, setAvailableAdvance] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const statusOptions = ['Generated', 'Sent', 'Partially Paid', 'Paid'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, invoices]);

  const fetchInitialData = async () => {
    try {
      const [invoiceResponse, crResponse, devResponse, clientResponse] = await Promise.all([
        invoiceAPI.getAll(),
        crAPI.getAll(),
        developerAPI.getAll(),
        clientAPI.getAll(),
      ]);

      if (invoiceResponse.success) setInvoices(invoiceResponse.data);
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
    let filtered = [...invoices];

    // Search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (inv) =>
          inv.Invoice_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.CR_Number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((inv) => inv.Status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleGenerateInvoice = () => {
    setSelectedCR('');
    setAdvanceAmount('0');
    setAvailableAdvance(0);
    setShowGenerateModal(true);
  };

  const handleCRChange = async (crNumber) => {
    setSelectedCR(crNumber);
    
    if (crNumber) {
      // Get CR details to find developer
      const cr = crs.find(c => c.CR_Number === crNumber);
      if (cr) {
        // Get available advance for this developer
        try {
          const response = await invoiceAPI.getAll({ 
            filters: { developerId: cr.Developer_ID } 
          });
          
          // Calculate available advance (you might want a dedicated API for this)
          // For now, we'll just set it to 0 and let backend validate
          setAvailableAdvance(0);
        } catch (error) {
          console.error('Error getting advance info:', error);
        }
      }
    } else {
      setAvailableAdvance(0);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCR) {
      toast.error('Please select a CR');
      return;
    }

    const advance = parseFloat(advanceAmount) || 0;
    
    if (advance < 0) {
      toast.error('Advance amount cannot be negative');
      return;
    }

    setGenerating(true);

    try {
      const response = await invoiceAPI.generate(selectedCR, advance);

      if (response.success) {
        toast.success('Invoice generated successfully');
        setShowGenerateModal(false);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = async (invoice) => {
    try {
      const response = await invoiceAPI.getById(invoice.Invoice_Number);
      if (response.success) {
        setSelectedInvoice(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Error loading invoice details');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    setDownloadingPDF(true);
    
    try {
      // Get full invoice details
      const invoiceResponse = await invoiceAPI.getById(invoice.Invoice_Number);
      if (!invoiceResponse.success) {
        throw new Error('Failed to fetch invoice details');
      }

      const fullInvoice = invoiceResponse.data;

      // Get developer details
      const developer = developers.find(d => d.Developer_ID === fullInvoice.Developer_ID);
      if (!developer) {
        throw new Error('Developer not found');
      }

      // Get client details
      const client = clients.find(c => c.Client_ID === fullInvoice.Client_ID);
      if (!client) {
        throw new Error('Client not found');
      }

      // Generate and download PDF
      const pdfGenerator = new InvoicePDFGenerator(fullInvoice, developer, client);
      await pdfGenerator.downloadPDF();
      
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleUpdateStatus = async (invoiceNumber, newStatus) => {
    if (!window.confirm(`Update invoice status to ${newStatus}?`)) {
      return;
    }

    try {
      const response = await invoiceAPI.updateStatus(invoiceNumber, newStatus);
      if (response.success) {
        toast.success('Status updated successfully');
        fetchInitialData();
        if (selectedInvoice && selectedInvoice.Invoice_Number === invoiceNumber) {
          setShowDetailModal(false);
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
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

  const getReadyForBillingCRs = () => {
    return crs.filter((cr) => cr.Status === 'Ready for Billing');
  };

  if (loading) {
    return <LoadingSpinner text="Loading invoices..." />;
  }

  const totalGenerated = invoices.filter((inv) => inv.Status === 'Generated').length;
  const totalPaid = invoices.filter((inv) => inv.Status === 'Paid').length;
  const totalBalance = invoices.reduce((sum, inv) => sum + (parseFloat(inv.Balance_Amount) || 0), 0);
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.Net_Amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage invoices with advance adjustment</p>
        </div>
        <button
          onClick={handleGenerateInvoice}
          className="btn-primary flex items-center space-x-2"
        >
          <FiFileText size={20} />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{invoices.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiFileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payment</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalGenerated}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiAlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(totalBalance)}
              </h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FiDollarSign className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(totalInvoiceAmount)}
              </h3>
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
              placeholder="Search by invoice or CR number..."
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
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {filteredInvoices.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Invoice #</th>
                  <th className="table-header">CR Number</th>
                  <th className="table-header">Developer</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Hours</th>
                  <th className="table-header">Gross</th>
                  <th className="table-header">TDS</th>
                  <th className="table-header">Advance</th>
                  <th className="table-header">Net Amount</th>
                  <th className="table-header">Balance</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const balance = parseFloat(invoice.Balance_Amount) || 0;
                  const isFullyPaid = balance === 0;
                  
                  return (
                    <tr key={invoice.Invoice_Number} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-primary-600">
                        {invoice.Invoice_Number}
                      </td>
                      <td className="table-cell">{invoice.CR_Number}</td>
                      <td className="table-cell text-gray-600">
                        {getDeveloperName(invoice.Developer_ID)}
                      </td>
                      <td className="table-cell text-gray-600">
                        {getClientName(invoice.Client_ID)}
                      </td>
                      <td className="table-cell">{formatDate(invoice.Invoice_Date)}</td>
                      <td className="table-cell">{invoice.Hours_Billed}</td>
                      <td className="table-cell font-medium">
                        {formatCurrency(invoice.Gross_Amount)}
                      </td>
                      <td className="table-cell text-red-600">
                        -{formatCurrency(invoice.TDS_Amount)}
                      </td>
                      <td className="table-cell text-orange-600">
                        {invoice.Advance_Adjusted > 0 ? `-${formatCurrency(invoice.Advance_Adjusted)}` : '-'}
                      </td>
                      <td className="table-cell font-semibold text-green-600">
                        {formatCurrency(invoice.Net_Amount)}
                      </td>
                      <td className={`table-cell font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={invoice.Status} />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="text-green-600 hover:text-green-800"
                            title="Download PDF"
                            disabled={downloadingPDF}
                          >
                            <FiDownload size={18} />
                          </button>
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
                  ? 'No invoices found matching your filters'
                  : 'No invoices generated yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Invoice"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Select a CR that is marked as "Ready for Billing" to generate an invoice. 
              You can optionally adjust advance payments.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CR *
            </label>
            <select
              value={selectedCR}
              onChange={(e) => handleCRChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select a CR</option>
              {getReadyForBillingCRs().map((cr) => (
                <option key={cr.CR_Number} value={cr.CR_Number}>
                  {cr.CR_Number} - {cr.Title} ({getDeveloperName(cr.Developer_ID)})
                </option>
              ))}
            </select>
            {getReadyForBillingCRs().length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                No CRs are ready for billing at the moment.
              </p>
            )}
          </div>

          {selectedCR && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount to Adjust (₹)
              </label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                min="0"
                step="0.01"
                className="input-field"
                placeholder="Enter advance amount to adjust"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave as 0 if no advance to adjust. Backend will validate available advance.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="btn-secondary"
              disabled={generating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="btn-primary"
              disabled={generating || !selectedCR}
            >
              {generating ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvoice(null);
          }}
          title={`Invoice Details - ${selectedInvoice.Invoice_Number}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.Invoice_Number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedInvoice.Invoice_Date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CR Number</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.CR_Number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={selectedInvoice.Status} />
                </div>
              </div>
            </div>

            {/* Developer & Client */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Parties</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Developer</p>
                  <p className="font-medium text-gray-900">
                    {getDeveloperName(selectedInvoice.Developer_ID)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">
                    {getClientName(selectedInvoice.Client_ID)}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours Billed:</span>
                  <span className="font-medium">{selectedInvoice.Hours_Billed} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.Gross_Amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    TDS ({selectedInvoice.TDS_Percentage}%):
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(selectedInvoice.TDS_Amount)}
                  </span>
                </div>
                {selectedInvoice.Advance_Adjusted > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Adjusted:</span>
                    <span className="font-medium text-orange-600">
                      -{formatCurrency(selectedInvoice.Advance_Adjusted)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Net Amount:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(selectedInvoice.Net_Amount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Balance Due:</span>
                  <span className={`font-bold text-lg ${
                    parseFloat(selectedInvoice.Balance_Amount) === 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(selectedInvoice.Balance_Amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="btn-primary flex items-center space-x-2"
                  disabled={downloadingPDF}
                >
                  <FiDownload size={18} />
                  <span>{downloadingPDF ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
              
              <div className="flex space-x-2">
                {selectedInvoice.Status === 'Generated' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInvoice.Invoice_Number, 'Sent')}
                    className="btn-primary"
                  >
                    Mark as Sent
                  </button>
                )}
                {parseFloat(selectedInvoice.Balance_Amount) === 0 && selectedInvoice.Status !== 'Paid' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInvoice.Invoice_Number, 'Paid')}
                    className="btn-success"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Loading indicator for PDF generation */}
      {downloadingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <LoadingSpinner />
            <span className="text-gray-700">Generating PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;