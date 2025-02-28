import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Transition } from '@headlessui/react';
import { AuthContext } from '../../context/AuthContext';

// Icons
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  BookmarkIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { isAuthenticated, user, logout, initializing } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll event to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  // Animation variants
  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      } 
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: i => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.3
      } 
    })
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      } 
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  // If authentication is still initializing, don't show anything
  if (initializing) {
    return null;
  }

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={logoVariants}
        >
          <Link to="/" className="flex items-center">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className="mr-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-9 h-9 text-primary-700"
              >
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold text-dark-900 font-display tracking-tight">
              Lead
              <span className="text-primary-700">Scout</span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={navItemVariants}
          >
            <Link 
              to="/product-input" 
              className={`flex items-center text-gray-700 hover:text-primary-700 transition-colors duration-200 px-3 py-2 rounded-lg ${location.pathname === '/product-input' ? 'bg-primary-100 text-primary-700 font-medium' : ''}`}
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
              <span>Find Prospects</span>
            </Link>
          </motion.div>

          {isAuthenticated ? (
            <>
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
              >
                <Link 
                  to="/dashboard" 
                  className={`flex items-center text-gray-700 hover:text-primary-700 transition-colors duration-200 px-3 py-2 rounded-lg ${location.pathname === '/dashboard' ? 'bg-primary-100 text-primary-700 font-medium' : ''}`}
                >
                  <ChartBarIcon className="h-5 w-5 mr-1" />
                  <span>Dashboard</span>
                </Link>
              </motion.div>
              
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
              >
                <Link 
                  to="/saved-prospects" 
                  className={`flex items-center text-gray-700 hover:text-primary-700 transition-colors duration-200 px-3 py-2 rounded-lg ${location.pathname === '/saved-prospects' ? 'bg-primary-100 text-primary-700 font-medium' : ''}`}
                >
                  <BookmarkIcon className="h-5 w-5 mr-1" />
                  <span>Saved Prospects</span>
                </Link>
              </motion.div>
              
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className="relative"
              >
                <button 
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-700 transition-colors duration-200 px-3 py-2 rounded-lg focus:outline-none"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-200 text-primary-700 flex items-center justify-center">
                    <span className="font-medium text-sm">{user?.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium">{user?.name.split(' ')[0]}</span>
                </button>

                <Transition
                  show={isUserMenuOpen}
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg overflow-hidden z-20 border border-gray-100">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Your Profile
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </Transition>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
              >
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-700 font-medium transition-colors duration-200 px-4 py-2"
                >
                  Sign In
                </Link>
              </motion.div>
              
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="button-primary">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden overflow-hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg rounded-b-xl">
              <Link
                to="/product-input"
                className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Find Prospects
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Dashboard
                  </Link>
                  
                  <Link
                    to="/saved-prospects"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BookmarkIcon className="h-5 w-5 mr-2" />
                    Saved Prospects
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5 mr-2" />
                    Profile
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5 mr-2" />
                    Sign In
                  </Link>
                  
                  <Link
                    to="/register"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-primary-700 hover:bg-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;