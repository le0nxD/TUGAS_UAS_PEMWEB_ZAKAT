import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { UserPlus, AlertCircle, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Email ini sudah terdaftar</span>
            </div>
          );
        } else {
          toast.error(error.message);
        }
      } else {
        // Show success notification
        toast.success(
          <div className="space-y-2">
            <p>Pendaftaran berhasil!</p>
            <p className="text-sm">Silakan masuk menggunakan akun yang telah dibuat.</p>
          </div>,
          {
            duration: 5000,
            icon: '✅'
          }
        );
        
        // Redirect to login page with registration success state
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            email: data.email 
          },
          replace: true
        });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mendaftar');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
        <p className="mt-2 text-gray-600">Bergabung dengan kami sekarang</p>
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
            placeholder="Buat kata sandi"
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
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="password"
            placeholder="Konfirmasi kata sandi"
            className="pl-10"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Konfirmasi kata sandi harus diisi',
              validate: (value) => value === password || 'Kata sandi tidak cocok',
            })}
          />
        </div>
        
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full py-2.5"
          icon={<UserPlus size={18} />}
        >
          Daftar
        </Button>
      </motion.form>
      
      <motion.div 
        variants={itemVariants}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link 
            to="/login" 
            className="font-medium text-primary-600 hover:text-primary-500 transition-all duration-200"
          >
            Masuk di sini
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterPage;