import puppeteer from 'puppeteer';
import { format } from 'date-fns';

export const generateInvoicePDF = async (item) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const getSafeValue = (val, fallback) =>
      typeof val === 'string' && val.trim() !== '' ? val.trim() : fallback;

    const billing = item.user?.billingAddress || {};
    const street = getSafeValue(billing.street, 'Street address not provided');
    const city = getSafeValue(billing.city, 'City');
    const state = getSafeValue(billing.state, 'State');
    const zipCode = getSafeValue(billing.zipCode, '');
    const country = getSafeValue(billing.country, 'Country');

    const customerAddress = item.customerAddress || '';

    const formatNaira = (amount) =>
      `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

          /* Reset & base */
          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 40px 40px 60px;
            background-color: #f9f9f9;
            color: #333;
          }

          h1, h2, h3 {
            margin: 0;
            font-weight: 700;
          }

          /* Container */
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }

          .company-info h1 {
            color: #004085;
            font-size: 28px;
            margin-bottom: 8px;
          }

          .company-info p {
            font-size: 14px;
            margin: 2px 0;
            color: #555;
          }

          .invoice-info {
            text-align: right;
            border-left: 3px solid #004085;
            padding-left: 20px;
          }

          .invoice-info h2 {
            color: #004085;
            font-size: 24px;
            margin-bottom: 10px;
          }

          .invoice-info p {
            font-size: 14px;
            margin: 6px 0;
          }

          /* Bill To */
          .bill-to {
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }

          .bill-to h3 {
            font-size: 18px;
            color: #004085;
            margin-bottom: 8px;
          }

          .bill-to p {
            font-size: 14px;
            margin: 3px 0;
          }

          /* Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          .items-table th, .items-table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            font-size: 14px;
          }

          .items-table th {
            background-color: #004085;
            color: white;
            text-align: left;
            font-weight: 700;
          }

          .items-table td {
            vertical-align: top;
          }

          .items-table td strong {
            font-size: 15px;
          }

          .items-table small {
            color: #777;
            font-style: italic;
          }

          /* Total Section */
          .total-section {
            width: 300px;
            margin-left: auto;
            border: 1px solid #ddd;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          }

          .total-table {
            width: 100%;
            border-collapse: collapse;
          }

          .total-table tr td {
            padding: 12px 15px;
            font-size: 14px;
          }

          .total-table tr td:first-child {
            background-color: #f5f7fa;
            font-weight: 600;
          }

          .total-table tr td:last-child {
            text-align: right;
          }

          .total-table tr:last-child td {
            background-color: #004085;
            color: white;
            font-weight: 700;
            font-size: 16px;
          }

          /* Status Section */
          .status-section {
            margin: 40px 0 20px;
            padding: 15px 20px;
            border-radius: 6px;
            font-weight: 700;
            text-align: center;
            color: white;
            max-width: 200px;
            margin-left: auto;
            margin-right: 0;
          }

          .status-paid {
            background-color: #28a745;
          }

          .status-pending {
            background-color: #ffc107;
            color: #212529;
          }

          .status-overdue {
            background-color: #dc3545;
          }

          /* Footer */
          .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <h1>Marketbook&solution</h1>
              <p><strong>Issued By:</strong> ${item.user.name}</p>
              <p>${street}</p>
              <p>${city}, ${state} ${zipCode}</p>
              <p>${country}</p>
              <p>Email: ${item.user.email}</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>Invoice #:</strong> ${item._id.toString().slice(-8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${format(new Date(item.createdAt), 'MM/dd/yyyy')}</p>
              <p><strong>Due Date:</strong> ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yyyy')}</p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${item.customerName || 'Customer'}</strong></p>
            ${customerAddress ? `<p>${customerAddress}</p>` : ''}
            ${item.customerEmail ? `<p>${item.customerEmail}</p>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 120px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${item.title}</strong>
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                </td>
                <td style="text-align: right;">${formatNaira(item.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <table class="total-table">
              <tr>
                <td>Subtotal:</td>
                <td>${formatNaira(item.amount)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>₦0.00</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>${formatNaira(item.amount)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="status-section status-${item.status}">
            <p>Payment Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This invoice was generated by Marketbook&solution</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    const base64 = pdf.toString('base64');
    return `data:application/pdf;base64,${base64}`;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};
