require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminUser) {
      console.log('Admin user not found, creating new admin user...');
      
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        company: 'Sales Prospector Inc.',
        role: 'admin'
      });
      
      console.log('New admin user created:', newAdmin.id);
    } else {
      console.log('Admin user found, updating password...');
      
      await adminUser.update({
        password: hashedPassword
      });
      
      console.log('Admin password updated successfully');
      
      // Verify the password
      const isMatch = await adminUser.comparePassword('admin123');
      console.log('Password match verification:', isMatch);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateAdminPassword();