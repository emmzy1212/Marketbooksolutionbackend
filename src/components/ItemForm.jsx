import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Upload, Link, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ItemForm = ({ isOpen, onClose, onSubmit, item = null, currentUser = null }) => {
  // currentUser should be an object like { _id, name, email }

  const [imagePreview, setImagePreview] = useState(item?.image || '');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(item?.image || '');
  const [imageType, setImageType] = useState('url');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      amount: item?.amount || '',
      status: item?.status || 'pending',
      customerEmail: item?.customerEmail || '',
      customerName: item?.customerName || '',
      customerAddress: item?.customerAddress || '',
      // No need to pass user ID here, backend assigns it
    }
  });

  useEffect(() => {
    // Reset form and preview when item or open state changes
    reset({
      title: item?.title || '',
      description: item?.description || '',
      amount: item?.amount || '',
      status: item?.status || 'pending',
      customerEmail: item?.customerEmail || '',
      customerName: item?.customerName || '',
      customerAddress: item?.customerAddress || '',
    });
    setImagePreview(item?.image || '');
    setImageUrl(item?.image || '');
    setImageFile(null);
    setImageType('url');
  }, [item, reset]);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      throw new Error('Image upload failed');
    }
  };

  const onSubmitForm = async (data) => {
    setIsSubmitting(true);
    try {
      let imageUrlToSave = imageUrl;

      if (imageType === 'file' && imageFile) {
        imageUrlToSave = await uploadImage(imageFile);
      }

      const itemData = {
        ...data,
        image: imageUrlToSave,
        amount: parseFloat(data.amount),
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        // Don't send user here, backend handles user ID based on auth
      };

      await onSubmit(itemData);

      reset();
      setImagePreview('');
      setImageFile(null);
      setImageUrl('');
      onClose();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
          {currentUser && (
            <p className="mt-1 text-sm text-gray-600">
              Logged in as: <strong>{currentUser.name}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input-field"
              placeholder="Enter item title"
            />
            {errors.title && (
              <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input-field"
              placeholder="Enter item description"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₦) *
            </label>
            <div className="flex items-center">
              <span className="inline-block px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-700 select-none">
                ₦
              </span>
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' },
                  valueAsNumber: true
                })}
                type="number"
                step="0.01"
                className="input-field rounded-l-none flex-1"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-error-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select {...register('status', { required: 'Status is required' })} className="input-field">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            {errors.status && (
              <p className="text-error-600 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email
            </label>
            <input
              {...register('customerEmail', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="input-field"
              placeholder="customer@example.com"
            />
            {errors.customerEmail && (
              <p className="text-error-600 text-sm mt-1">{errors.customerEmail.message}</p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              {...register('customerName')}
              className="input-field"
              placeholder="Enter customer name"
            />
          </div>

          {/* Customer Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Address
            </label>
            <textarea
              {...register('customerAddress')}
              rows={2}
              className="input-field"
              placeholder="Enter customer address"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image
            </label>

            {/* Image Type Toggle */}
            <div className="flex space-x-4 mb-3">
              <button
                type="button"
                onClick={() => setImageType('url')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  imageType === 'url'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Link size={16} />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setImageType('file')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  imageType === 'file'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
            </div>

            {/* Image Input */}
            {imageType === 'url' ? (
              <input
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                className="input-field"
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="input-field"
              />
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="spinner" />
              ) : (
                <>
                  <Save size={16} />
                  <span>{item ? 'Update' : 'Add'} Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ItemForm;
