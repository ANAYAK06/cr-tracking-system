import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class InvoicePDFGenerator {
  constructor(invoiceData, developerData, clientData) {
    this.invoice = invoiceData;
    this.developer = developerData;
    this.client = clientData;
  }

  // Generate HTML for the invoice
  generateHTML() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            padding: 0;
            width: 210mm;
            min-height: 297mm;
          }

          .invoice-container {
            width: 100%;
            background: white;
          }

          /* Header Section */
          .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            position: relative;
            overflow: hidden;
          }

          .invoice-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
          }

          .header-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: start;
          }

          .company-info h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .company-info p {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.6;
          }

          .invoice-title {
            text-align: right;
          }

          .invoice-title h2 {
            font-size: 48px;
            font-weight: 300;
            margin-bottom: 8px;
          }

          .invoice-number {
            font-size: 16px;
            opacity: 0.9;
          }

          /* Info Section */
          .invoice-info {
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            background: #f8f9fa;
            border-bottom: 3px solid #667eea;
          }

          .info-block h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }

          .info-block p {
            font-size: 14px;
            color: #333;
            line-height: 1.8;
            margin: 4px 0;
          }

          .info-block .highlight {
            font-weight: 600;
            color: #000;
          }

          /* Details Section */
          .invoice-details {
            padding: 40px;
          }

          .details-header {
            margin-bottom: 24px;
          }

          .details-header h3 {
            font-size: 18px;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .details-header p {
            color: #666;
            font-size: 14px;
          }

          /* Table */
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }

          .invoice-table thead {
            background: #667eea;
            color: white;
          }

          .invoice-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .invoice-table th:last-child,
          .invoice-table td:last-child {
            text-align: right;
          }

          .invoice-table tbody tr {
            border-bottom: 1px solid #e0e0e0;
          }

          .invoice-table td {
            padding: 16px;
            font-size: 14px;
            color: #333;
          }

          .description-col {
            color: #666;
            font-size: 13px;
            margin-top: 4px;
          }

          /* Summary Section */
          .invoice-summary {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
          }

          .summary-table {
            width: 400px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
          }

          .summary-row.subtotal {
            font-size: 15px;
            color: #333;
          }

          .summary-row.deduction {
            color: #dc3545;
          }

          .summary-row.total {
            border-top: 3px solid #667eea;
            border-bottom: 3px solid #667eea;
            margin-top: 8px;
            padding: 16px 0;
            font-size: 18px;
            font-weight: 700;
          }

          .summary-row.total .amount {
            color: #28a745;
            font-size: 24px;
          }

          .summary-row.balance {
            border-bottom: none;
            font-weight: 600;
            font-size: 16px;
            color: #dc3545;
          }

          .summary-label {
            font-weight: 600;
          }

          .amount {
            font-weight: 600;
          }

          /* Footer */
          .invoice-footer {
            background: #f8f9fa;
            padding: 30px 40px;
            margin-top: 40px;
          }

          .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 24px;
          }

          .footer-section h4 {
            font-size: 14px;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .footer-section p {
            font-size: 13px;
            color: #666;
            line-height: 1.8;
          }

          .payment-info {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }

          .footer-note {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-paid {
            background: #d4edda;
            color: #155724;
          }

          .status-pending {
            background: #fff3cd;
            color: #856404;
          }

          .status-sent {
            background: #d1ecf1;
            color: #0c5460;
          }

          .status-generated {
            background: #e2e3e5;
            color: #383d41;
          }

          .status-partially-paid {
            background: #cce5ff;
            color: #004085;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            <div class="header-content">
              <div class="company-info">
                <h1>${this.developer.Name || 'Developer Name'}</h1>
                <p>${this.developer.Address || 'Developer Address'}<br>
                Phone: ${this.developer.Phone || 'N/A'}<br>
                Email: ${this.developer.Email || 'N/A'}</p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p class="invoice-number">#${this.invoice.Invoice_Number}</p>
              </div>
            </div>
          </div>

          <!-- Info Section -->
          <div class="invoice-info">
            <div class="info-block">
              <h3>Bill To</h3>
              <p class="highlight">${this.client.Organization_Name || 'Client Name'}</p>
              <p>${this.client.Address || 'Client Address'}<br>
              ${this.client.Email || ''}</p>
            </div>
            <div class="info-block">
              <h3>Developer</h3>
              <p class="highlight">${this.developer.Name || 'Developer Name'}</p>
              <p>${this.developer.Email || ''}<br>
              ID: ${this.developer.Developer_ID || 'N/A'}</p>
            </div>
            <div class="info-block">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${this.formatDate(this.invoice.Invoice_Date)}</p>
              <p><strong>CR Number:</strong> ${this.invoice.CR_Number}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${this.getStatusClass(this.invoice.Status)}">${this.invoice.Status}</span></p>
            </div>
          </div>

          <!-- Details Section -->
          <div class="invoice-details">
            <div class="details-header">
              <h3>Work Completed</h3>
              <p>Summary of billable hours and services rendered</p>
            </div>

            <!-- Table -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Hours</th>
                  <th style="text-align: center;">Rate (₹/hr)</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Software Development Services</strong>
                    <div class="description-col">Full stack development services as per CR ${this.invoice.CR_Number}</div>
                  </td>
                  <td style="text-align: center;">${this.invoice.Hours_Billed || 0}</td>
                  <td style="text-align: center;">${this.formatCurrency(parseFloat(this.invoice.Gross_Amount) / parseFloat(this.invoice.Hours_Billed || 1))}</td>
                  <td>${this.formatCurrency(this.invoice.Gross_Amount)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Summary -->
            <div class="invoice-summary">
              <div class="summary-table">
                <div class="summary-row subtotal">
                  <span class="summary-label">Subtotal</span>
                  <span class="amount">₹${this.formatCurrency(this.invoice.Gross_Amount)}</span>
                </div>
                <div class="summary-row deduction">
                  <span class="summary-label">TDS (${this.invoice.TDS_Percentage}%)</span>
                  <span class="amount">- ₹${this.formatCurrency(this.invoice.TDS_Amount)}</span>
                </div>
                ${parseFloat(this.invoice.Advance_Adjusted) > 0 ? `
                <div class="summary-row deduction">
                  <span class="summary-label">Advance Adjusted</span>
                  <span class="amount">- ₹${this.formatCurrency(this.invoice.Advance_Adjusted)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                  <span class="summary-label">Net Amount</span>
                  <span class="amount">₹${this.formatCurrency(this.invoice.Net_Amount)}</span>
                </div>
                <div class="summary-row balance">
                  <span class="summary-label">Balance Due</span>
                  <span class="amount">₹${this.formatCurrency(this.invoice.Balance_Amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="invoice-footer">
            <div class="footer-grid">
              <div class="footer-section">
                <h4>Payment Instructions</h4>
                <div class="payment-info">
                  <p><strong>Bank Name:</strong> ${this.developer.Bank_Name || 'N/A'}</p>
                  <p><strong>Account Name:</strong> ${this.developer.Name || 'N/A'}</p>
                  <p><strong>Account Number:</strong> ${this.developer.Account_Number || 'N/A'}</p>
                  <p><strong>IFSC Code:</strong> ${this.developer.IFSC_Code || 'N/A'}</p>
                  <p><strong>Payment Due:</strong> Within 30 days</p>
                </div>
              </div>
              <div class="footer-section">
                <h4>Terms & Conditions</h4>
                <p>• Payment is due within 30 days of invoice date</p>
                <p>• Late payments may incur additional charges</p>
                <p>• All amounts are in Indian Rupees (₹)</p>
                <p>• For any queries, contact ${this.developer.Email || 'developer'}</p>
              </div>
            </div>
            <div class="footer-note">
              <p>Thank you for your business! | This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Format currency
  formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get status class for badge
  getStatusClass(status) {
    const statusMap = {
      'Generated': 'generated',
      'Sent': 'sent',
      'Partially Paid': 'partially-paid',
      'Paid': 'paid'
    };
    return statusMap[status] || 'pending';
  }

  // Generate PDF using html2canvas and jsPDF
  async generatePDF() {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.innerHTML = this.generateHTML();
        document.body.appendChild(container);

        // Wait for fonts and styles to load
        setTimeout(() => {
          const invoiceElement = container.querySelector('.invoice-container');

          html2canvas(invoiceElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pdfHeight;
            }

            // Clean up
            document.body.removeChild(container);

            resolve(pdf);
          }).catch(error => {
            document.body.removeChild(container);
            reject(error);
          });
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Download PDF
  async downloadPDF() {
    try {
      const pdf = await this.generatePDF();
      pdf.save(`Invoice_${this.invoice.Invoice_Number}.pdf`);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Get PDF as blob for upload
  async getPDFBlob() {
    try {
      const pdf = await this.generatePDF();
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw error;
    }
  }
}

export default InvoicePDFGenerator;