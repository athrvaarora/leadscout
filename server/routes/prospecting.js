const express = require('express');
const {
  submitProductSearch,
  findContacts,
  saveProspect,
  getProspects,
  getProspect,
  deleteProspect
} = require('../controllers/prospecting');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Simple health check route to verify the API is accessible
router.get('/health', (req, res) => {
  console.log('Health check route accessed');
  return res.status(200).json({
    success: true,
    message: 'Prospecting API is working',
    timestamp: new Date().toISOString()
  });
});

// Routes that can be accessed by both authenticated and guest users
router.post('/search', optionalAuth, submitProductSearch);
router.post('/contacts', optionalAuth, findContacts);

// Add a new route for loading more companies
router.get('/more-companies', optionalAuth, (req, res) => {
  try {
    // Get page from query params (default to 1 if not provided)
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // If we have cached results, return the next page
    if (global.cachedCompanyResults && Array.isArray(global.cachedCompanyResults)) {
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      
      // Check if we have more results to return
      if (startIndex < global.cachedCompanyResults.length) {
        const moreCompanies = global.cachedCompanyResults.slice(startIndex, endIndex);
        
        return res.status(200).json({
          success: true,
          data: {
            companies: moreCompanies,
            hasMore: endIndex < global.cachedCompanyResults.length,
            totalCount: global.cachedCompanyResults.length
          }
        });
      }
    }
    
    // No more results or cache not available
    return res.status(200).json({
      success: true,
      data: {
        companies: [],
        hasMore: false,
        totalCount: global.cachedCompanyResults ? global.cachedCompanyResults.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching more companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching more companies',
      error: error.message
    });
  }
});

// Routes that require authentication
router.post('/save', protect, saveProspect);
router.get('/prospects', protect, getProspects);
router.get('/prospects/:id', protect, getProspect);
router.delete('/prospects/:id', protect, deleteProspect);

module.exports = router;