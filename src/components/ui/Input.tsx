import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200';
    
    const getInputStyles = () => {
      if (error) {
        return `${baseStyles} border-red-300 focus:border-red-500 focus:ring-red-500/20 text-gray-900`;
      }
      return `${baseStyles} border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 text-gray-900`;
    };
    
    return (
      <div className="mb-4">
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </motion.label>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <input
            ref={ref}
            className={`${getInputStyles()} ${className}`}
            {...props}
          />
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-1.5 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;