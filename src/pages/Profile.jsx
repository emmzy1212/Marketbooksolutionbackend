import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  MapPin,
  Phone,
  Building,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from 'axios';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    }
  });

  const addressForm = useForm({
    defaultValues: {
      street: user?.billingAddress?.street || '',
      city: user?.billingAddress?.city || '',
      state: user?.billingAddress?.state || '',
      zipCode: user?.billingAddress?.zipCode || '',
      country: user?.billingAddress?.country || '',
    }
  });

  const passwordForm = useForm();

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value;
    profileForm.setValue('avatar', url);
    setAvatarPreview(url);
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.avatarUrl;
    } catch (error) {
      throw new Error('Avatar upload failed');
    }
  };

  const onSubmitProfile = async (data) => {
    setIsLoading(true);
    try {
      let avatarUrl = data.avatar;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const result = await updateProfile({
        ...data,
        avatar: avatarUrl,
      });

      if (result.success) {
        setAvatarFile(null);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAddress = async (data) => {
    setIsLoading(true);
    try {
      const result = await updateProfile({
        billingAddress: data,
      });

      if (result.success) {
        toast.success('Billing address updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update billing address');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setIsLoading(true);
    try {
      await axios.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      passwordForm.reset();
      toast.success('Password changed successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'address', label: 'Billing Address', icon: MapPin },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Profile Information */}
              {activeTab === 'profile' && (
                <div className="card-body">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={32} className="text-gray-400" />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors duration-200"
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            {...profileForm.register('name', { required: 'Name is required' })}
                            className="input-field pl-10"
                            placeholder="John Doe"
                          />
                        </div>
                        {profileForm.formState.errors.name && (
                          <p className="text-error-600 text-sm mt-1">
                            {profileForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            {...profileForm.register('email', { required: 'Email is required' })}
                            type="email"
                            className="input-field pl-10"
                            placeholder="john@example.com"
                          />
                        </div>
                        {profileForm.formState.errors.email && (
                          <p className="text-error-600 text-sm mt-1">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            {...profileForm.register('phone')}
                            type="tel"
                            className="input-field pl-10"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Avatar URL
                        </label>
                        <input
                          {...profileForm.register('avatar')}
                          type="url"
                          onChange={handleAvatarUrlChange}
                          className="input-field"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Billing Address */}
              {activeTab === 'address' && (
                <div className="card-body">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Address</h3>
                    <p className="text-gray-600">
                      This address will appear on your invoices and receipts.
                    </p>
                  </div>

                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                        <textarea
                          {...addressForm.register('street', { required: 'Street address is required' })}
                          rows={2}
                          className="input-field pl-10"
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>
                      {addressForm.formState.errors.street && (
                        <p className="text-error-600 text-sm mt-1">
                          {addressForm.formState.errors.street.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          {...addressForm.register('city', { required: 'City is required' })}
                          className="input-field"
                          placeholder="New York"
                        />
                        {addressForm.formState.errors.city && (
                          <p className="text-error-600 text-sm mt-1">
                            {addressForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province *
                        </label>
                        <input
                          {...addressForm.register('state', { required: 'State is required' })}
                          className="input-field"
                          placeholder="NY"
                        />
                        {addressForm.formState.errors.state && (
                          <p className="text-error-600 text-sm mt-1">
                            {addressForm.formState.errors.state.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP/Postal Code *
                        </label>
                        <input
                          {...addressForm.register('zipCode', { required: 'ZIP code is required' })}
                          className="input-field"
                          placeholder="10001"
                        />
                        {addressForm.formState.errors.zipCode && (
                          <p className="text-error-600 text-sm mt-1">
                            {addressForm.formState.errors.zipCode.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          {...addressForm.register('country', { required: 'Country is required' })}
                          className="input-field"
                          placeholder="United States"
                        />
                        {addressForm.formState.errors.country && (
                          <p className="text-error-600 text-sm mt-1">
                            {addressForm.formState.errors.country.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Address</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Change Password */}
              {activeTab === 'password' && (
                <div className="card-body">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                    <p className="text-gray-600">
                      Ensure your account is using a long, random password to stay secure.
                    </p>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-error-600 text-sm mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          {...passwordForm.register('newPassword', {
                            required: 'New password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-error-600 text-sm mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          {...passwordForm.register('confirmPassword', {
                            required: 'Please confirm your new password',
                            validate: (value) =>
                              value === passwordForm.watch('newPassword') || 'Passwords do not match'
                          })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-error-600 text-sm mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;