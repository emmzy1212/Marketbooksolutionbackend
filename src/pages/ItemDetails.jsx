import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Calendar, 
  DollarSign,
  User,
  Package,
  FileText,
  Printer
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`/items/${id}`);
      setItem(response.data.item);
    } catch (error) {
      toast.error('Failed to fetch item details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const response = await axios.post(`/items/${item._id}/invoice`);
      // Download the PDF
      const link = document.createElement('a');
      link.href = response.data.invoiceUrl;
      link.download = `invoice-${item._id}.pdf`;
      link.click();
      toast.success('Invoice generated successfully!');
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleSendEmail = async () => {
    if (!item.customerEmail) {
      toast.error('Customer email is required');
      return;
    }

    try {
      await axios.post(`/items/${item._id}/send-email`);
      toast.success('Email sent successfully!');
    } catch (error) {
      toast.error('Failed to send email');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'unpaid': return 'status-unpaid';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The item you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3 no-print">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center space-x-2"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
            <button
              onClick={handleGenerateInvoice}
              className="btn-primary flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Download Invoice</span>
            </button>
            {item.customerEmail && (
              <button
                onClick={handleSendEmail}
                className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 flex items-center space-x-2"
              >
                <Mail size={16} />
                <span>Send Email</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Item Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-body">
            {/* Item Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8 mb-8">
              {/* Item Image */}
              {item.image && (
                <div className="flex-shrink-0 mb-6 lg:mb-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full lg:w-64 h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                    <span className={`status-badge ${getStatusColor(item.status)} text-sm`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">${item.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Amount</div>
                  </div>
                </div>

                {item.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                )}

                {/* Item Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Created Date</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(item.createdAt), 'MMMM dd, yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <User className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Created By</div>
                        <div className="text-sm text-gray-600">{item.user?.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Status</div>
                        <div className="text-sm text-gray-600">
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    {item.customerEmail && (
                      <div className="flex items-center space-x-3">
                        <Mail className="text-gray-400" size={20} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Customer Email</div>
                          <div className="text-sm text-gray-600">{item.customerEmail}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <FileText size={20} />
                <span>Invoice Preview</span>
              </h3>

              <div className="bg-white border border-gray-200 rounded-lg p-8">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Marketbook<span className="text-primary-600">&</span>solution
                    </h2>
                    <div className="text-sm text-gray-600">
                      {item.user?.billingAddress ? (
                        <div>
                          <div>{item.user.billingAddress.street}</div>
                          <div>
                            {item.user.billingAddress.city}, {item.user.billingAddress.state} {item.user.billingAddress.zipCode}
                          </div>
                          <div>{item.user.billingAddress.country}</div>
                        </div>
                      ) : (
                        <div>Business Address</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">INVOICE</h3>
                    <div className="text-sm text-gray-600">
                      <div>Invoice #: {item._id.slice(-8).toUpperCase()}</div>
                      <div>Date: {format(new Date(item.createdAt), 'MM/dd/yyyy')}</div>
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">BILL TO:</h4>
                  <div className="text-sm text-gray-600">
                    {item.customerEmail ? (
                      <div>{item.customerEmail}</div>
                    ) : (
                      <div>Customer Information</div>
                    )}
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-semibold text-gray-900">Description</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-4 text-sm text-gray-900">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-gray-600 text-xs mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-900 text-right">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoice Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm text-gray-900">${item.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Total:</span>
                        <span className="text-base font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Payment Status:</span>
                    <span className={`status-badge ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ItemDetails;