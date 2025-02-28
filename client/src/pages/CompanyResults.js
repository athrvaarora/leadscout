import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { prospectingService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Helper function to highlight buyer intent phrases in descriptions
const highlightBuyerIntent = (text) => {
  if (!text) return '';
  
  const buyerIntentPhrases = [
    'looking for', 'seeking', 'need', 'evaluate', 'implement', 
    'solution for', 'challenge', 'problem', 'opportunity',
    'improve', 'enhance', 'optimize', 'streamline', 'automate',
    'investment', 'adopt', 'migrate', 'upgrade', 'transform',
    'plan to', 'interested in', 'considering'
  ];
  
  let result = text;
  
  // Replace buyer intent phrases with highlighted versions
  buyerIntentPhrases.forEach(phrase => {
    const regex = new RegExp(`(${phrase})`, 'gi');
    result = result.replace(regex, '<span class="font-medium text-primary-800">$1</span>');
  });
  
  // Return as JSX with dangerouslySetInnerHTML (safe in this case as we control the content)
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};

// Helper function to get a reason why this company is a good match
const getMatchReason = (company) => {
  const reasons = [
    company.hasBuyerIntent ? "Shows signs of actively looking for solutions" : null,
    company.aggregatedFrom > 1 ? "Appeared in multiple relevant search results" : null,
    company.relevanceScore >= 90 ? "Closely matches your product's target market" : null,
    company.industry ? `Operates in the ${company.industry} industry` : null
  ];
  
  // Filter out null reasons and get the first valid one
  const validReasons = reasons.filter(reason => reason !== null);
  return validReasons[0] || "High relevance to your product";
};

const CompanyResults = () => {
  const [results, setResults] = useState(null);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCompanyCount, setTotalCompanyCount] = useState(0);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Get results from localStorage
    const storedResults = localStorage.getItem('companyResults');
    
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults);
      setResults(parsedResults);
      setFilteredCompanies(parsedResults.companies);
      
      // Initialize pagination data
      setCurrentPage(0);
      setHasMoreCompanies(true);
      
      // If we have total count info (might be added with the first batch)
      if (parsedResults.totalCount) {
        setTotalCompanyCount(parsedResults.totalCount);
      } else {
        // Default to showing that we have more than the initial batch
        setTotalCompanyCount(parsedResults.companies.length + 10);
      }
    } else {
      // If no results found, redirect to input page
      navigate('/product-input');
    }
  }, [navigate]);

  useEffect(() => {
    if (!results || !results.companies) return;

    // Filter companies based on industry and search term
    let filtered = [...results.companies];
    
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(company => company.industry === selectedIndustry);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(term) || 
        company.description.toLowerCase().includes(term)
      );
    }
    
    // Sort companies
    filtered.sort((a, b) => {
      if (sortBy === 'relevance') {
        return b.relevanceScore - a.relevanceScore;
      } else if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    setFilteredCompanies(filtered);
  }, [results, selectedIndustry, sortBy, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleIndustryChange = (e) => {
    setSelectedIndustry(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSaveProspect = async (company) => {
    if (!isAuthenticated) {
      toast.info('Create an account to save prospects.', {
        action: {
          label: 'Sign Up',
          onClick: () => navigate('/register')
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      const prospectData = {
        companyName: company.name,
        industry: company.industry,
        description: company.description,
        website: company.website,
        relevanceScore: company.relevanceScore
      };

      await prospectingService.saveProspect(prospectData);
      toast.success(`${company.name} has been saved to your prospects.`);
    } catch (error) {
      toast.error('Failed to save prospect. Please try again.');
      console.error('Save prospect error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to load more companies
  const loadMoreCompanies = async () => {
    if (!hasMoreCompanies || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      // Get the next page (currentPage is 0-based, but API expects 1-based pages)
      const nextPage = currentPage + 1;
      
      const response = await prospectingService.getMoreCompanies(nextPage);
      
      if (response.data.success) {
        // Get the additional companies
        const { companies, hasMore, totalCount } = response.data.data;
        
        if (companies && companies.length > 0) {
          // Update results with the new companies
          setResults(prev => {
            const updatedCompanies = [...prev.companies, ...companies];
            return { ...prev, companies: updatedCompanies };
          });
          
          // Also update filtered companies if not filtered
          if (selectedIndustry === 'all' && searchTerm === '') {
            setFilteredCompanies(prev => [...prev, ...companies]);
          }
          
          // Update pagination info
          setCurrentPage(nextPage);
          setHasMoreCompanies(hasMore);
          setTotalCompanyCount(totalCount || companies.length);
          
          // Store the updated results in localStorage
          const updatedResults = {
            ...results,
            companies: [...results.companies, ...companies]
          };
          localStorage.setItem('companyResults', JSON.stringify(updatedResults));
        } else {
          // No more companies
          setHasMoreCompanies(false);
        }
      } else {
        toast.error('Failed to load more companies. Please try again.');
      }
    } catch (error) {
      console.error('Load more companies error:', error);
      toast.error('Error loading more companies.');
    } finally {
      setLoadingMore(false);
    }
  };

  const getIndustryList = () => {
    if (!results || !results.companies) return [];
    
    const industries = new Set(results.companies.map(company => company.industry));
    return Array.from(industries);
  };

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Prospective Companies</h2>
            <p className="text-gray-600">
              We found {filteredCompanies.length} companies that might be interested in your product.
            </p>
          </div>

          {/* Target Industries */}
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Target Industries</h3>
            <div className="flex flex-wrap gap-2">
              {results.targetIndustries.map((industry, index) => (
                <span key={index} className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm">
                  {industry}
                </span>
              ))}
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="label">Search Companies</label>
                <input
                  type="text"
                  id="search"
                  className="input-field"
                  placeholder="Search by name or description"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div>
                <label htmlFor="industryFilter" className="label">Filter by Industry</label>
                <select
                  id="industryFilter"
                  className="input-field"
                  value={selectedIndustry}
                  onChange={handleIndustryChange}
                >
                  <option value="all">All Industries</option>
                  {getIndustryList().map((industry, index) => (
                    <option key={index} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sortBy" className="label">Sort By</label>
                <select
                  id="sortBy"
                  className="input-field"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="relevance">Relevance Score</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company List */}
          <div className="space-y-6">
            {filteredCompanies.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-xl font-bold text-gray-500 mb-2">No companies found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              filteredCompanies.map((company, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{company.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-gray-600">{company.industry}</p>
                          {company.hasBuyerIntent && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-accent-100 text-accent-800 font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Buyer Intent
                            </span>
                          )}
                          {company.aggregatedFrom > 1 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-600 font-medium">
                              {company.aggregatedFrom} sources
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Match</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          company.relevanceScore >= 90 ? 'bg-accent-100 text-accent-800' :
                          company.relevanceScore >= 80 ? 'bg-primary-100 text-primary-800' :
                          'bg-secondary-100 text-secondary-800'
                        }`}>
                          {company.relevanceScore}/100
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700">
                        {highlightBuyerIntent(company.description)}
                      </p>
                      
                      {/* Potential fit indicators */}
                      {company.relevanceScore >= 85 && (
                        <div className="mt-2 p-2 bg-accent-50 rounded-md border border-accent-100">
                          <p className="text-sm text-accent-800 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            High potential match: {getMatchReason(company)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary-600 hover:text-primary-800 hover:underline flex items-center transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        {company.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                      
                      <div className="flex-grow"></div>
                      
                      <button
                        onClick={() => handleSaveProspect(company)}
                        disabled={isLoading}
                        className="button-secondary text-sm py-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        Save
                      </button>
                      
                      <Link
                        to={`/contact-discovery/${encodeURIComponent(company.name)}`}
                        className="button-primary text-sm py-1 px-3"
                        state={{ company }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Find Contacts
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {hasMoreCompanies && (
            <div className="mt-6 text-center">
              <button 
                className="button-secondary w-full max-w-md mx-auto py-2"
                onClick={loadMoreCompanies}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading more companies...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Load More Companies
                  </span>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Showing {filteredCompanies.length} of {totalCompanyCount} companies
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between">
            <Link to="/product-input" className="button-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Product Input
            </Link>
            
            {isAuthenticated && (
              <Link to="/dashboard" className="button-primary">
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyResults;