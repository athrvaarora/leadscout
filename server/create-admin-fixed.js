require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // Using the uuid package

async function createAdminUser() {
  try {
    // First, get the current hook processing behavior
    const oldBeforeCreate = User.options.hooks.beforeCreate;
    
    // Temporarily disable the beforeCreate hook
    User.options.hooks.beforeCreate = [];
    
    // Create a fixed password hash directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    console.log('Generated password hash:', hashedPassword);
    
    // Delete any existing admin user
    await User.destroy({ where: { email: 'admin@example.com' } });
    
    // Create a new admin user with the fixed hash
    const adminUser = await User.create({
      id: uuidv4(),  // Manually generate UUID
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,  // Use the hash directly
      company: 'Sales Prospector Inc.',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Admin user created successfully:', adminUser.id);
    console.log('Login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    // Test the password manually
    const isMatch = await bcrypt.compare('admin123', adminUser.password);
    console.log('Direct password verification:', isMatch);
    
    // Restore the original hook
    User.options.hooks.beforeCreate = oldBeforeCreate;
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();