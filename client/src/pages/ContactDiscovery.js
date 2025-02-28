import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { prospectingService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ContactDiscovery = () => {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get company from location state or try to parse from URL
        let companyData;
        if (location.state && location.state.company) {
          companyData = location.state.company;
        } else {
          // If no company data in location state, check localStorage
          const storedResults = localStorage.getItem('companyResults');
          if (storedResults) {
            const parsedResults = JSON.parse(storedResults);
            const decoded = decodeURIComponent(companyId);
            companyData = parsedResults.companies.find(c => c.name === decoded);
          }
        }

        if (!companyData) {
          toast.error('Company information not found.');
          navigate('/company-results');
          return;
        }

        setCompany(companyData);

        // Fetch contacts and email templates
        const response = await prospectingService.findContacts({
          companyName: companyData.name,
          companyWebsite: companyData.website,
          companyIndustry: companyData.industry
        });

        if (response.data.success) {
          setContacts(response.data.data.contacts);
          setEmailTemplates(response.data.data.emailTemplates);
        } else {
          toast.error('Failed to find contacts. Please try again.');
        }
      } catch (error) {
        toast.error('An error occurred while retrieving contact information.');
        console.error('Contact discovery error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId, location.state, navigate]);

  const handleSaveProspect = async () => {
    if (!isAuthenticated) {
      toast.info('Create an account to save prospects.', {
        action: {
          label: 'Sign Up',
          onClick: () => navigate('/register')
        }
      });
      return;
    }

    setSaving(true);
    try {
      const prospectData = {
        companyName: company.name,
        industry: company.industry,
        description: company.description,
        website: company.website,
        relevanceScore: company.relevanceScore,
        contacts,
        emailTemplates
      };

      await prospectingService.saveProspect(prospectData);
      toast.success(`${company.name} has been saved to your prospects.`);
    } catch (error) {
      toast.error('Failed to save prospect. Please try again.');
      console.error('Save prospect error:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard.');
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-20 h-20 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Discovering Contacts</h2>
          <p className="text-gray-600 mb-4">
            We're searching for real contacts at {company?.name || 'this company'}.
          </p>
          <div className="space-y-2 text-left text-sm text-gray-500 mt-6">
            <p className="flex items-center animate-fade-in animate-delay-100">
              <svg className="h-4 w-4 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Finding LinkedIn profiles for current employees
            </p>
            <p className="flex items-center animate-fade-in animate-delay-200">
              <svg className="h-4 w-4 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Verifying employment and position information
            </p>
            <p className="flex items-center animate-fade-in animate-delay-300">
              <svg className="h-4 w-4 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Generating personalized email templates
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-6">This may take a few minutes. The system will search until it finds real contacts.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Company Not Found</h2>
            <p className="text-gray-600 mb-8">
              The company information could not be found. Please try again.
            </p>
            <Link to="/company-results" className="button-primary">
              Back to Company Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Company Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold">{company.name}</h2>
                  <p className="text-gray-600">{company.industry}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Relevance</span>
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {company.relevanceScore}/100
                  </span>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{company.description}</p>
              <div className="flex items-center">
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  {company.website.replace(/(^\w+:|^)\/\//, '')}
                </a>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  className={`${
                    activeTab === 'contacts'
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center transition-all duration-200`}
                  onClick={() => setActiveTab('contacts')}
                >
                  Contacts
                </button>
                <button
                  className={`${
                    activeTab === 'emailTemplates'
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center transition-all duration-200`}
                  onClick={() => setActiveTab('emailTemplates')}
                >
                  Email Templates
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'contacts' ? (
                <div>
                  <h3 className="text-xl font-bold mb-4">Key Contacts at {company.name}</h3>
                  
                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h4 className="text-lg font-medium text-gray-500 mb-2">No contacts found</h4>
                      <p className="text-gray-500">We couldn't find any contacts at this company.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {contacts.map((contact, index) => (
                        <div key={index} className="border-b border-gray-200 pb-5 last:border-0 last:pb-0">
                          <h4 className="text-lg font-medium">
                            {contact.name}
                            {contact.source === 'synthetic' && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary-100 text-secondary-800 rounded">
                                Generated
                              </span>
                            )}
                            {contact.verifiedCompany && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full">
                                Verified
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-600 mb-2">{contact.title} • {company.name}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-600">{contact.email}</span>
                              <div className="flex ml-2 space-x-1">
                                <button 
                                  onClick={() => copyToClipboard(contact.email)}
                                  className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
                                  title="Copy to clipboard"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                  </svg>
                                </button>
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
                                  title="Open in email client"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                            
                            {contact.linkedInUrl && (
                              <a 
                                href={contact.linkedInUrl}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`flex items-center ${contact.verifiedCompany ? 'text-accent-700 hover:text-accent-800' : 'text-primary-600 hover:text-primary-800'} ${contact.profileIsValid === false ? 'opacity-70' : ''} transition-colors duration-200`}
                                onClick={(e) => {
                                  // If profile might be invalid, warn the user
                                  if (contact.profileIsValid === false) {
                                    const confirmNavigation = window.confirm(
                                      "This LinkedIn profile URL may not be accessible. Try to open it anyway?"
                                    );
                                    if (!confirmNavigation) {
                                      e.preventDefault();
                                    }
                                  }
                                }}
                              >
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                                {contact.verifiedCompany ? 
                                  <span className="flex items-center">
                                    LinkedIn Profile 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-accent-700" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </span> : 
                                  'LinkedIn Profile'
                                }
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold mb-4">Email Templates</h3>
                  
                  {emailTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-lg font-medium text-gray-500 mb-2">No email templates found</h4>
                      <p className="text-gray-500">We couldn't generate email templates for this company.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {emailTemplates.map((template, index) => {
                        // Extract subject line if available
                        const subjectLineMatch = template.match(/^Subject:(.*?)$/mi);
                        const subjectLine = subjectLineMatch ? subjectLineMatch[1].trim() : `Template ${index + 1}`;
                        
                        // Extract email body for use in mailto link
                        const bodyText = template
                          .replace(/^Subject:.*$/mi, '')  // Remove subject line
                          .trim();
                          
                        // Create mailto link with template content
                        const mailtoLink = `mailto:${contacts[0]?.email || ''}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;
                        
                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-medium">{subjectLine}</h4>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => copyToClipboard(template)}
                                  className="text-primary-600 hover:text-primary-800 flex items-center transition-colors duration-200"
                                  title="Copy to clipboard"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                  </svg>
                                  Copy
                                </button>
                                <a
                                  href={mailtoLink}
                                  className="bg-primary-500 hover:bg-primary-600 text-dark-900 text-sm px-3 py-1 rounded flex items-center shadow-sm hover:shadow transition-all duration-200"
                                  title="Open in email client"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Email
                                </a>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                              {template}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Link to="/company-results" className="button-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Results
            </Link>
            
            <button
              onClick={handleSaveProspect}
              disabled={saving}
              className="button-primary"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Save Prospect
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDiscovery;