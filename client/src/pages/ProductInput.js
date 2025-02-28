import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { prospectingService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProductInput = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Validation schema
  const validationSchema = Yup.object({
    productName: Yup.string()
      .required('Product name is required')
      .min(2, 'Product name must be at least 2 characters'),
    industry: Yup.string(),
    description: Yup.string()
      .required('Product description is required')
      .min(20, 'Please provide a more detailed description (at least 20 characters)')
  });

  // Initial form values
  const initialValues = {
    productName: '',
    industry: '',
    description: ''
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
  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      console.log('Submitting product search:', values);
      
      // Add additional debug info
      console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      // Remove timeout constraint to allow request to complete
      const response = await prospectingService.submitProductSearch(values);
      console.log('Raw API response:', response);
      
      if (response.data && response.data.success) {
        console.log('Search successful, results:', response.data.data);
        // Validate response data with better error handling
        if (!response.data.data) {
          console.error('Missing data in response');
          throw new Error('Missing data in API response');
        }
        
        if (!response.data.data.targetIndustries || !Array.isArray(response.data.data.targetIndustries)) {
          console.error('Invalid targetIndustries in response:', response.data.data.targetIndustries);
          throw new Error('Invalid targetIndustries data');
        }
        
        if (!response.data.data.companies || !Array.isArray(response.data.data.companies)) {
          console.error('Invalid companies in response:', response.data.data.companies);
          throw new Error('Invalid companies data');
        }
        
        // Store the search results in localStorage to pass to the next page
        localStorage.setItem('companyResults', JSON.stringify(response.data.data));
        
        // Navigate to results page
        navigate('/company-results');
      } else {
        console.error('API returned unsuccessful response:', response);
        toast.error('Failed to process your request. Please try again.');
      }
    } catch (error) {
      console.error('Product search error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code outside the 2xx range
        toast.error(`Server error: ${error.response.data?.message || 'Unknown server error'}`);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error(`Request error: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
                <div className="animate-float mb-4">
                  <svg className="w-16 h-16 mx-auto text-primary-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM3.5 10a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary-600">Finding the Best Prospects</h3>
                <p className="text-gray-600 mb-4">Our AI is searching the web for relevant companies that match your product. This may take a minute or two.</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary-400 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 rounded-full bg-primary-600 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="py-8 px-8">
              <h2 className="text-2xl font-bold mb-6">Tell Us About Your Product</h2>
              
              {!isAuthenticated && (
                <div className="mb-6 p-4 bg-primary-100 rounded-md text-primary-800 text-sm">
                  <p className="font-medium">You're using LeadScout as a guest.</p>
                  <p>Create an account to save your results and access more features.</p>
                </div>
              )}
              
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form>
                    <div className="mb-4">
                      <label htmlFor="productName" className="label">Product Name</label>
                      <Field
                        type="text"
                        id="productName"
                        name="productName"
                        className={`input-field ${errors.productName && touched.productName ? 'border-red-500' : ''}`}
                        placeholder="Enter the name of your product or service"
                      />
                      <ErrorMessage name="productName" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="industry" className="label">Primary Industry</label>
                      <Field
                        as="select"
                        id="industry"
                        name="industry"
                        className="input-field"
                      >
                        <option value="">Select your product's primary industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </Field>
                      <p className="text-gray-500 text-sm mt-1">
                        This helps us better understand your product context. If unsure, leave blank.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="description" className="label">Product Description</label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        rows="6"
                        className={`input-field ${errors.description && touched.description ? 'border-red-500' : ''}`}
                        placeholder="Describe your product in detail. What does it do? What problems does it solve? Who is your target user?"
                      />
                      <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                      <p className="text-gray-500 text-sm mt-1">
                        The more detailed your description, the better our AI can identify relevant prospects.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full button-primary"
                      disabled={isSubmitting || isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Finding Prospects... (This may take a minute)
                        </span>
                      ) : "Find Prospects"}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="py-6 px-8">
              <h3 className="text-lg font-semibold mb-4">Tips for Better Results</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Be specific about what your product does and the problems it solves</li>
                <li>Mention any unique features or competitive advantages</li>
                <li>Include information about your target market or ideal customer</li>
                <li>If applicable, mention technologies, integrations, or standards</li>
                <li>Briefly explain how your pricing model works (subscription, one-time, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInput;