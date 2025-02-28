import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

// Icons
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  BuildingOfficeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const { register, loginAsGuest, isAuthenticated } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    company: Yup.string(),
    industry: Yup.string()
  });

  // Initial form values
  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    industry: ''
  };

  // Industry options
  const industries = [
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Manufacturing',
    'Retail',
    'Real Estate',
    'Energy',
    'Transportation',
    'Entertainment',
    'Hospitality',
    'Agriculture',
    'Other'
  ];

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = values;
      
      const result = await register(userData);
      
      if (result.success) {
        resetForm();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    await loginAsGuest();
    navigate('/product-input');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="page-container py-12 bg-gradient-to-br from-primary-50 to-secondary-50 min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-lg mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="py-8 px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-dark-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Join LeadScout to find your ideal customers</p>
            </motion.div>
            
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    <motion.div variants={itemVariants} className="mb-4">
                      <label htmlFor="name" className="label">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          id="name"
                          name="name"
                          className={`input-field pl-10 ${errors.name && touched.name ? 'error' : ''}`}
                          placeholder="John Smith"
                        />
                      </div>
                      <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="mb-4">
                      <label htmlFor="email" className="label">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="email"
                          id="email"
                          name="email"
                          className={`input-field pl-10 ${errors.email && touched.email ? 'error' : ''}`}
                          placeholder="you@example.com"
                        />
                      </div>
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={itemVariants} className="mb-4">
                        <label htmlFor="password" className="label">Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <Field
                            type="password"
                            id="password"
                            name="password"
                            className={`input-field pl-10 ${errors.password && touched.password ? 'error' : ''}`}
                            placeholder="••••••••"
                          />
                        </div>
                        <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="mb-4">
                        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <Field
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`input-field pl-10 ${errors.confirmPassword && touched.confirmPassword ? 'error' : ''}`}
                            placeholder="••••••••"
                          />
                        </div>
                        <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                      </motion.div>
                    </div>
                    
                    <motion.div variants={itemVariants} className="mb-4">
                      <label htmlFor="company" className="label">Company Name (Optional)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          id="company"
                          name="company"
                          className="input-field pl-10"
                          placeholder="Your company name"
                        />
                      </div>
                      <ErrorMessage name="company" component="div" className="text-red-500 text-sm mt-1" />
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="mb-6">
                      <label htmlFor="industry" className="label">Industry (Optional)</label>
                      <Field
                        as="select"
                        id="industry"
                        name="industry"
                        className="input-field"
                      >
                        <option value="">Select your industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="industry" component="div" className="text-red-500 text-sm mt-1" />
                    </motion.div>
                    
                    <motion.button
                      variants={itemVariants}
                      type="submit"
                      className="w-full button-primary group"
                      disabled={isSubmitting || isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Create Account
                          <ArrowRightIcon className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                </Form>
              )}
            </Formik>
            
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-gray-600 mb-4">Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">Sign in</Link></p>
              
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              
              <motion.button
                onClick={handleGuestLogin}
                className="w-full button-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue as Guest
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;