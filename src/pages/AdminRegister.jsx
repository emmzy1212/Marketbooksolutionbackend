import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [copied, setCopied] = useState(false);
  const { registerAsAdmin } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    setIsLoading(true);
    const result = await registerAsAdmin();
    if (result.success) {
      setAdminPass(result.adminPass);
    }
    setIsLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(adminPass);
      setCopied(true);
      toast.success('Admin pass copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleContinue = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-accent-600 to-primary-600 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">Admin Registration</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {adminPass ? 'Admin Pass Generated!' : 'Register as Admin'}
          </h1>
          <p className="text-gray-600">
            {adminPass 
              ? 'Save your admin pass securely. You can only register once.'
              : 'Generate your unique admin pass to access admin features'
            }
          </p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-body">
            {!adminPass ? (
              <div className="space-y-6">
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="text-warning-600 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-medium text-warning-800">Important Notice</h3>
                      <p className="text-sm text-warning-700 mt-1">
                        You can only register as an admin once per account. Your admin pass will be unique and cannot be regenerated.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Shield size={16} />
                      <span>Generate Admin Pass</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="text-success-600 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-medium text-success-800">Registration Successful</h3>
                      <p className="text-sm text-success-700 mt-1">
                        Your admin pass has been generated. Please save it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Admin Pass
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={adminPass}
                      readOnly
                      className="input-field pr-10 font-mono text-sm bg-gray-50"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {copied ? (
                        <CheckCircle size={20} className="text-success-600" />
                      ) : (
                        <Copy size={20} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click the copy button to save this pass to your clipboard
                  </p>
                </div>

                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="text-error-600 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-medium text-error-800">Security Warning</h3>
                      <p className="text-sm text-error-700 mt-1">
                        Store this admin pass safely. It cannot be recovered or regenerated. You will need it to access admin features.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                  Continue to Admin Login
                </button>
              </div>
            )}

            {/* Login Link */}
            {!adminPass && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have admin access?{' '}
                  <Link
                    to="/admin/login"
                    className="text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Login as Admin
                  </Link>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminRegister;