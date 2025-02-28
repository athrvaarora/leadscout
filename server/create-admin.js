require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createNewAdmin() {
  try {
    // Delete the existing admin user
    const deleted = await User.destroy({ where: { email: 'admin@example.com' } });
    console.log(`Deleted ${deleted} existing admin users`);
    
    // Create a new admin with a manually created hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('New password hash:', hashedPassword);
    
    const newAdmin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      company: 'Sales Prospector Inc.',
      role: 'admin'
    });
    
    console.log('New admin user created:', newAdmin.id);
    
    // Verify the login works
    const foundUser = await User.findOne({ where: { email: 'admin@example.com' } });
    const isMatch = await foundUser.comparePassword('admin123');
    console.log('Password verification:', isMatch);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createNewAdmin();