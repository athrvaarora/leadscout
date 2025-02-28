import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { updateProfile, logout } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userService.getProfile();
        
        if (response.data.success) {
          setUserProfile(response.data.data);
        } else {
          toast.error('Failed to load profile data.');
        }
      } catch (error) {
        toast.error('An error occurred while loading profile data.');
        console.error('Get profile error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Validation schema for profile update
  const profileValidationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    company: Yup.string(),
    industry: Yup.string()
  });

  // Validation schema for password change
  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string()
      .required('Current password is required'),
    newPassword: Yup.string()
      .required('New password is required')
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Confirm password is required')
  });

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

  // Handle profile update
  const handleProfileUpdate = async (values, { setSubmitting }) => {
    setIsUpdating(true);
    try {
      const result = await updateProfile(values);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        // Update local userProfile state with new values
        setUserProfile(prev => ({ ...prev, ...values }));
      } else {
        toast.error(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile.');
      console.error('Update profile error:', error);
    } finally {
      setIsUpdating(false);
      setSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    setIsChangingPassword(true);
    try {
      const response = await authService.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully!');
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect.');
      } else {
        toast.error('An error occurred while changing password.');
        console.error('Password change error:', error);
      }
    } finally {
      setIsChangingPassword(false);
      setSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-8">
              We couldn't load your profile information. Please try again later.
            </p>
            <Link to="/dashboard" className="button-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-primary-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Your Profile</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  className={`${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile Information
                </button>
                <button
                  className={`${
                    activeTab === 'security'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Account Information</h3>
                    <div className="text-sm text-gray-500 mb-2">
                      Member since {formatDate(userProfile.createdAt)}
                    </div>
                  </div>

                  <Formik
                    initialValues={{
                      name: userProfile.name || '',
                      email: userProfile.email || '',
                      company: userProfile.company || '',
                      industry: userProfile.industry || ''
                    }}
                    validationSchema={profileValidationSchema}
                    onSubmit={handleProfileUpdate}
                  >
                    {({ isSubmitting }) => (
                      <Form>
                        <div className="mb-4">
                          <label htmlFor="name" className="label">Full Name</label>
                          <Field
                            type="text"
                            id="name"
                            name="name"
                            className="input-field"
                            placeholder="Enter your full name"
                          />
                          <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="email" className="label">Email Address</label>
                          <Field
                            type="email"
                            id="email"
                            name="email"
                            className="input-field"
                            placeholder="Enter your email"
                          />
                          <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="company" className="label">Company Name (Optional)</label>
                          <Field
                            type="text"
                            id="company"
                            name="company"
                            className="input-field"
                            placeholder="Enter your company name"
                          />
                          <ErrorMessage name="company" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div className="mb-6">
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
                        </div>
                        
                        <button
                          type="submit"
                          className="button-primary w-full"
                          disabled={isSubmitting || isUpdating}
                        >
                          {isUpdating ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating Profile...
                            </span>
                          ) : "Save Changes"}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  </div>

                  <Formik
                    initialValues={{
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    }}
                    validationSchema={passwordValidationSchema}
                    onSubmit={handlePasswordChange}
                  >
                    {({ isSubmitting }) => (
                      <Form>
                        <div className="mb-4">
                          <label htmlFor="currentPassword" className="label">Current Password</label>
                          <Field
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            className="input-field"
                            placeholder="Enter your current password"
                          />
                          <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="newPassword" className="label">New Password</label>
                          <Field
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            className="input-field"
                            placeholder="Enter your new password"
                          />
                          <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div className="mb-6">
                          <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                          <Field
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="input-field"
                            placeholder="Confirm your new password"
                          />
                          <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <button
                          type="submit"
                          className="button-primary w-full"
                          disabled={isSubmitting || isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Changing Password...
                            </span>
                          ) : "Change Password"}
                        </button>
                      </Form>
                    )}
                  </Formik>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-red-600 mb-4">Logout</h3>
                    <p className="text-gray-600 mb-4">
                      Sign out of your account across all devices.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex">
            <Link to="/dashboard" className="button-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;