import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, className = '' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-600 border-secondary-200',
    accent: 'bg-accent-50 text-accent-600 border-accent-200',
    success: 'bg-success-50 text-success-600 border-success-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    error: 'bg-error-50 text-error-600 border-error-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`card p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-success-600' : 'text-error-600'}`}>
              {trend.positive ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;