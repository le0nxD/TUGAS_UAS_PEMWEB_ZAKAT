import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, Database, DollarSign, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { path: '/', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/muzakki', icon: <Users className="w-5 h-5" />, label: 'Muzakki' },
    { path: '/kategori-mustahik', icon: <Database className="w-5 h-5" />, label: 'Kategori Mustahik' },
    { path: '/bayar-zakat', icon: <DollarSign className="w-5 h-5" />, label: 'Pengumpulan Zakat' },
    { path: '/distribusi-warga', icon: <Users className="w-5 h-5" />, label: 'Distribusi Warga' },
    { path: '/distribusi-lainnya', icon: <Users className="w-5 h-5" />, label: 'Distribusi Lainnya' },
  ];

  const sidebarVariants = {
    open: {
      width: '256px',
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    closed: {
      width: '80px',
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const mobileMenuVariants = {
    open: {
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    closed: {
      x: '-100%',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: { 
      opacity: 0,
      y: -4,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30"
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <span className={`text-xl font-bold text-gray-900 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Manajemen Zakat
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              onClick={toggleSidebar}
              className="!p-1"
            />
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {item.icon}
                <span className={`ml-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              onClick={toggleMobileMenu}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <span className="text-xl font-bold text-gray-900">Zakat Management</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-5 h-5" />}
                  onClick={toggleMobileMenu}
                  className="!p-1"
                />
              </div>
              <nav className="px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div 
        className={`flex flex-col min-h-screen ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        } transition-all duration-300`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <Button
              variant="ghost"
              size="sm"
              icon={<Menu className="w-5 h-5" />}
              onClick={toggleMobileMenu}
              className="lg:hidden !p-1"
            />
            <div className="flex items-center gap-4 ml-auto">
              {user?.email && (
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user.email}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={<LogOut className="w-4 h-4" />}
                onClick={handleSignOut}
              >
                <span className="hidden sm:block">Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <motion.div
            key={location.pathname}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="py-6 px-4 lg:px-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;