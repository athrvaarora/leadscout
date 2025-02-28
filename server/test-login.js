require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    const user = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found, testing password...');
    const isMatch = await user.comparePassword('admin123');
    console.log('Password match:', isMatch);
    
    // Check the raw password hash
    console.log('Stored password hash:', user.password);
    
    // Print user details
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testLogin();