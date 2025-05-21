import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout: React.FC = () => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 4 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-800"
    >
      <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/0a/27/d0/0a27d01a063a6709c44b763e116e950c.jpg')] bg-cover bg-center opacity-10" />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          variants={itemVariants}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-6">
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczPf-BtVAkOxlw387_u0Rszzg5wKj8p4SHXpOeeBtUNUAJ0w-UywJPgt5QTmFPZZccQ5Ff-PdC2CY5O1GOSDKuhhqGYcR01sTq6u4AeEOXs7v662OXUDHSlZE-dU12xgwpa2c4lbCqo5Wv6jSWaM8BXL=w969-h1039-s-no-gm"
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Manajemen Zakat</h1>
          <p className="text-primary-100 text-lg">Kelola pengumpulan dan penyaluran zakat Anda secara efisien</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <Outlet />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-center mt-6 text-primary-100 text-sm"
        >
          © {new Date().getFullYear()} Sistem Pengelolaan Zakat
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AuthLayout;