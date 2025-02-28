const User = require('../models/User');
const Prospect = require('../models/Prospect');

// @desc    Get user's dashboard data
// @route   GET /api/user/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    // Get user's prospects
    const prospects = await Prospect.find({ createdBy: req.user.id });
    
    // Calculate metrics
    const totalProspects = prospects.length;
    const prospectsWithContacts = prospects.filter(p => p.contacts && p.contacts.length > 0).length;
    const prospectsWithEmailTemplates = prospects.filter(p => p.emailTemplates && p.emailTemplates.length > 0).length;
    
    // Get industries breakdown
    const industries = {};
    prospects.forEach(prospect => {
      if (prospect.industry) {
        industries[prospect.industry] = (industries[prospect.industry] || 0) + 1;
      }
    });
    
    // Get recent prospects (last 5)
    const recentProspects = await Prospect.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalProspects,
          prospectsWithContacts,
          prospectsWithEmailTemplates
        },
        industries,
        recentProspects
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

// @desc    Update user password
// @route   PUT /api/user/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        industry: user.industry,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile',
      error: error.message
    });
  }
};