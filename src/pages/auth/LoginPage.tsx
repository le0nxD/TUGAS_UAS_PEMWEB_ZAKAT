import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LogIn, AlertCircle, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LocationState {
  registrationSuccess?: boolean;
  email?: string;
}

const LoginPage: React.FC = () => {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const email = watch('email');

  // Auto-fill email if coming from registration
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.registrationSuccess && state?.email) {
      setValue('email', state.email);
      toast.success('Silakan masuk dengan akun yang telah dibuat');
    }
  }, [location.state, setValue]);
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        let errorMessage = error.message;
        
        // Provide a more user-friendly message for invalid credentials
        if (error.message.includes('invalid_credentials')) {
          errorMessage = 'Email atau kata sandi tidak valid';
        }
        
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        );
      } else {
        // Show success notification before redirecting
        toast.success('Login berhasil! Selamat datang kembali.');
        
        // Use replace: true to prevent going back to login page
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat masuk');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Masukkan email Anda terlebih dahulu');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Instruksi reset kata sandi telah dikirim ke email Anda');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim reset kata sandi');
      console.error('Reset password error:', error);
    } finally {
      setIsResetting(false);
    }
  };
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 4 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div 
        variants={itemVariants}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900">Selamat Datang Kembali</h2>
        <p className="mt-2 text-gray-600">Silakan masuk ke akun Anda</p>
      </motion.div>
      
      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="email"
            placeholder="Masukkan email Anda"
            className="pl-10"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email harus diisi',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Masukkan alamat email yang valid',
              },
            })}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="password"
            placeholder="Masukkan kata sandi"
            className="pl-10"
            error={errors.password?.message}
            {...register('password', {
              required: 'Kata sandi harus diisi',
              minLength: {
                value: 6,
                message: 'Kata sandi minimal 6 karakter',
              },
            })}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResetting || !email}
            className="text-sm text-primary-600 hover:text-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Mengirim...' : 'Lupa kata sandi?'}
          </button>
        </div>
        
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full py-2.5"
          icon={<LogIn size={18} />}
        >
          Masuk
        </Button>
      </motion.form>
      
      <motion.div 
        variants={itemVariants}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link 
            to="/register" 
            className="font-medium text-primary-600 hover:text-primary-500 transition-all duration-200"
          >
            Daftar sekarang
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;