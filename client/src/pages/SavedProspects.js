import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { prospectingService } from '../services/api';

const SavedProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [filteredProspects, setFilteredProspects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState(null);
  const [deletingProspect, setDeletingProspect] = useState(false);

  // Fetch prospects
  useEffect(() => {
    const fetchProspects = async () => {
      try {
        const response = await prospectingService.getProspects();
        
        if (response.data.success) {
          setProspects(response.data.data);
          setFilteredProspects(response.data.data);
        } else {
          toast.error('Failed to load prospects.');
        }
      } catch (error) {
        toast.error('An error occurred while loading prospects.');
        console.error('Get prospects error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspects();
  }, []);

  // Filter and sort prospects
  useEffect(() => {
    if (!prospects) return;

    // Filter prospects based on industry and search term
    let filtered = [...prospects];
    
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(prospect => prospect.industry === selectedIndustry);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prospect => 
        prospect.companyName.toLowerCase().includes(term) || 
        (prospect.description && prospect.description.toLowerCase().includes(term))
      );
    }
    
    // Sort prospects
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'alphabetical') {
        return a.companyName.localeCompare(b.companyName);
      } else if (sortBy === 'relevance') {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      return 0;
    });
    
    setFilteredProspects(filtered);
  }, [prospects, selectedIndustry, sortBy, searchTerm]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle industry filter change
  const handleIndustryChange = (e) => {
    setSelectedIndustry(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Open delete confirmation modal
  const openDeleteModal = (prospect) => {
    setProspectToDelete(prospect);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProspectToDelete(null);
  };

  // Delete prospect
  const handleDeleteProspect = async () => {
    if (!prospectToDelete) return;
    
    setDeletingProspect(true);
    try {
      const response = await prospectingService.deleteProspect(prospectToDelete._id);
      
      if (response.data.success) {
        // Remove deleted prospect from state
        setProspects(prospects.filter(p => p._id !== prospectToDelete._id));
        toast.success(`${prospectToDelete.companyName} has been deleted.`);
      } else {
        toast.error('Failed to delete prospect.');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the prospect.');
      console.error('Delete prospect error:', error);
    } finally {
      setDeletingProspect(false);
      closeDeleteModal();
    }
  };

  // Get unique industry list
  const getIndustryList = () => {
    if (!prospects) return [];
    
    const industries = new Set(prospects.filter(p => p.industry).map(p => p.industry));
    return Array.from(industries);
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

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Saved Prospects</h2>
            <p className="text-gray-600">
              You have {prospects.length} saved prospects.
            </p>
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
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="relevance">Relevance Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prospects List */}
          {filteredProspects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No prospects found</h3>
              <p className="text-gray-500 mb-4">
                {prospects.length > 0 
                  ? "Try adjusting your filters to see more results."
                  : "You haven't saved any prospects yet."
                }
              </p>
              <Link to="/product-input" className="button-primary inline-block">
                Find New Prospects
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProspects.map((prospect) => (
                <div key={prospect._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{prospect.companyName}</h3>
                        <p className="text-gray-600">{prospect.industry || 'No industry specified'}</p>
                      </div>
                      <div className="flex items-center">
                        {prospect.relevanceScore && (
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            Score: {prospect.relevanceScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700">
                        {prospect.description?.length > 200
                          ? prospect.description.substring(0, 200) + '...'
                          : prospect.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {prospect.website && (
                          <a 
                            href={prospect.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            Visit Website
                          </a>
                        )}
                        
                        <span className="text-gray-500 text-sm">
                          Saved on {formatDate(prospect.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDeleteModal(prospect)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Delete
                        </button>
                        
                        <Link
                          to={`/saved-prospects/${prospect._id}`}
                          className="button-primary text-sm py-1 px-3"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex">
            <Link to="/dashboard" className="button-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          
          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && prospectToDelete && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Delete Prospect</h3>
                <p className="mb-6">
                  Are you sure you want to delete <span className="font-semibold">{prospectToDelete.companyName}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={closeDeleteModal}
                    className="button-secondary"
                    disabled={deletingProspect}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProspect}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    disabled={deletingProspect}
                  >
                    {deletingProspect ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </span>
                    ) : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedProspects;