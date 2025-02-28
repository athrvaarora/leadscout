const express = require('express');
const { getDashboardData, updatePassword, getProfile } = require('../controllers/user');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboardData);
router.put('/updatepassword', protect, updatePassword);
router.get('/profile', protect, getProfile);

module.exports = router;