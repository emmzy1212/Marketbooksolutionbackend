import axios from 'axios';
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const PDFSHIFT_API_KEY = process.env.PDFSHIFT_API_KEY;

if (!PDFSHIFT_API_KEY) {
  throw new Error("Missing PDFShift API Key. Please set PDFSHIFT_API_KEY in your .env file");
}

export const generateInvoicePDF = async (item) => {
  try {
    const getSafe = (val, fallback) =>
      typeof val === 'string' && val.trim() !== '' ? val.trim() : fallback;

    const billing = item.user?.billingAddress || {};
    const street = getSafe(billing.street, 'Street address not provided');
    const city = getSafe(billing.city, 'City');
    const state = getSafe(billing.state, 'State');
    const zipCode = getSafe(billing.zipCode, '');
    const country = getSafe(billing.country, 'Country');
    const custAddr = item.customerAddress || '';

    const formatNaira = (amt) =>
      `₦${amt.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Invoice</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    *{box-sizing:border-box;}
    body{font-family:Roboto,sans-serif;margin:0;padding:40px;background:#f9f9f9;color:#333;}
    h1,h2,h3{margin:0;font-weight:700;}
    .container{max-width:800px;margin:0 auto;background:#fff;padding:40px;border-radius:8px;
      box-shadow:0 4px 12px rgba(0,0,0,0.1);}
    .header{display:flex;justify-content:space-between;margin-bottom:40px;}
    .company-info h1{color:#004085;font-size:28px;margin-bottom:8px;}
    .company-info p{font-size:14px;margin:2px 0;color:#555;}
    .invoice-info{text-align:right;border-left:3px solid #004085;padding-left:20px;}
    .invoice-info h2{color:#004085;font-size:24px;margin-bottom:10px;}
    .invoice-info p{font-size:14px;margin:6px 0;}
    .bill-to{margin-bottom:30px;border-bottom:2px solid #eee;padding-bottom:20px;}
    .bill-to h3{font-size:18px;color:#004085;margin-bottom:8px;}
    .bill-to p{font-size:14px;margin:3px 0;}
    .items-table{width:100%;border-collapse:collapse;margin-bottom:30px;}
    .items-table th,.items-table td{padding:12px 15px;border:1px solid #ddd;font-size:14px;}
    .items-table th{background:#004085;color:#fff;text-align:left;font-weight:700;}
    .total-section{width:300px;margin-left:auto;border:1px solid #ddd;border-radius:6px;
      overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.05);}
    .total-table{width:100%;border-collapse:collapse;}
    .total-table tr td{padding:12px 15px;font-size:14px;}
    .total-table tr td:first-child{background:#f5f7fa;font-weight:600;}
    .total-table tr:last-child td{background:#004085;color:#fff;font-weight:700;font-size:16px;}
    .status-section{margin:40px 0 20px;padding:15px 20px;border-radius:6px;font-weight:700;
      text-align:center;color:#fff;max-width:200px;margin-left:auto;}
    .status-paid{background:#28a745;}
    .status-pending{background:#ffc107;color:#212529;}
    .status-overdue{background:#dc3545;}
    .footer{text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:15px;}
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
        <p>Invoice #: ${item._id.toString().slice(-8).toUpperCase()}</p>
        <p>Date: ${format(new Date(item.createdAt), 'MM/dd/yyyy')}</p>
        <p>Due Date: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yyyy')}</p>
      </div>
    </div>
    <div class="bill-to">
      <h3>Bill To:</h3>
      <p><strong>${item.customerName || 'Customer'}</strong></p>
      ${custAddr ? `<p>${custAddr}</p>` : ''}
      ${item.customerEmail ? `<p>${item.customerEmail}</p>` : ''}
    </div>
    <table class="items-table">
      <thead>
        <tr><th>Description</th><th style="width:120px;text-align:right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${item.title}</strong>${item.description ? `<br><small>${item.description}</small>` : ''}</td>
          <td style="text-align:right;">${formatNaira(item.amount)}</td>
        </tr>
      </tbody>
    </table>
    <div class="total-section">
      <table class="total-table">
        <tr><td>Subtotal:</td><td>${formatNaira(item.amount)}</td></tr>
        <tr><td>Tax:</td><td>₦0.00</td></tr>
        <tr><td><strong>Total:</strong></td><td><strong>${formatNaira(item.amount)}</strong></td></tr>
      </table>
    </div>
    <div class="status-section status-${item.status}">
      Payment Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
    </div>
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This invoice was generated by Marketbook&solution</p>
    </div>
  </div>
</body>
</html>`;

    // ✅ Corrected API endpoint here
    const response = await axios.post(
      'https://api.pdfshift.io/v3/convert/pdf',
      { source: html },
      {
        responseType: 'arraybuffer',
        auth: { username: PDFSHIFT_API_KEY, password: '' },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.status !== 200) {
      throw new Error(`PDFShift failed: ${response.statusText}`);
    }

    const base64 = Buffer.from(response.data).toString('base64');
    return `data:application/pdf;base64,${base64}`;

  } catch (err) {
    const raw = err?.response?.data;
    let decodedError = raw;
    if (raw instanceof Buffer || Buffer.isBuffer(raw)) {
      try {
        decodedError = JSON.parse(raw.toString('utf-8'));
      } catch (e) {
        decodedError = raw.toString('utf-8');
      }
    }
    console.error('PDF generation error:', decodedError || err.message);
    throw new Error('Failed to generate invoice PDF');
  }
};
