import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Mail,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import ItemForm from '../components/ItemForm';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaNairaSign } from 'react-icons/fa6';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    pending: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items');
      setItems(response.data.items);
      calculateStats(response.data.items);
    } catch (error) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (itemsData) => {
    const stats = itemsData.reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      acc.totalAmount += item.amount;
      return acc;
    }, { total: 0, paid: 0, unpaid: 0, pending: 0, totalAmount: 0 });
    
    setStats(stats);
  };

  const handleAddItem = async (itemData) => {
    try {
      const response = await axios.post('/items', itemData);
      setItems([response.data.item, ...items]);
      calculateStats([response.data.item, ...items]);
      toast.success('Item added successfully!');
    } catch (error) {
      toast.error('Failed to add item');
      throw error;
    }
  };

  const handleEditItem = async (itemData) => {
    try {
      const response = await axios.put(`/items/${editingItem._id}`, itemData);
      const updatedItems = items.map(item =>
        item._id === editingItem._id ? response.data.item : item
      );
      setItems(updatedItems);
      calculateStats(updatedItems);
      setEditingItem(null);
      toast.success('Item updated successfully!');
    } catch (error) {
      toast.error('Failed to update item');
      throw error;
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await axios.delete(`/items/${itemId}`);
      const updatedItems = items.filter(item => item._id !== itemId);
      setItems(updatedItems);
      calculateStats(updatedItems);
      toast.success('Item deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleGenerateInvoice = async (item) => {
    try {
      const response = await axios.post(`/items/${item._id}/invoice`);
      const link = document.createElement('a');
      link.href = response.data.invoiceUrl;
      link.download = `invoice-${item._id}.pdf`;
      link.click();
      toast.success('Invoice generated successfully!');
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleSendEmail = async (item) => {
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'unpaid': return 'status-unpaid';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'unpaid': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your business today.
              </p>
            </div>
            <button
              onClick={() => setShowItemForm(true)}
              className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={stats.total}
            icon={Package}
            color="primary"
          />
          <StatCard
            title="Paid Items"
            value={stats.paid}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Unpaid Items"
            value={stats.unpaid}
            icon={XCircle}
            color="error"
          />
          <StatCard
            title="Pending Items"
            value={stats.pending}
            icon={Clock}
            color="warning"
          />
          <StatCard
            title="Total Revenue"
            value={`₦${stats.totalAmount.toFixed(2)}`}
            icon={FaNairaSign}
            color="secondary"
          />
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field pl-10 pr-8"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">
                  {items.length === 0 
                    ? "Get started by adding your first item"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {items.length === 0 && (
                  <button
                    onClick={() => setShowItemForm(true)}
                    className="btn-primary"
                  >
                    Add Your First Item
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card hover:shadow-lg transition-all duration-200"
                >
                  <div className="card-body">
                    <div className="flex items-center space-x-4">
                      {item.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`status-badge ${getStatusColor(item.status)}`}>
                              <StatusIcon size={14} className="mr-1" />
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="font-medium text-lg text-gray-900">
                              ₦{item.amount.toFixed(2)}
                            </span>
                            <span>
                              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                            </span>
                            {item.customerEmail && (
                              <span className="flex items-center space-x-1">
                                <Mail size={14} />
                                <span>{item.customerEmail}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleGenerateInvoice(item)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                          title="Generate Invoice"
                        >
                          <Download size={18} />
                        </button>
                        
                        {item.customerEmail && (
                          <button
                            onClick={() => handleSendEmail(item)}
                            className="p-2 text-gray-600 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors duration-200"
                            title="Send Email"
                          >
                            <Mail size={18} />
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setShowItemForm(true);
                              }}
                              className="p-2 text-gray-600 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors duration-200"
                              title="Edit Item"
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-2 text-gray-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200"
                              title="Delete Item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Item Form Modal */}
        <ItemForm
          isOpen={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          item={editingItem}
        />
      </div>
    </div>
  );
};

export default Dashboard;
