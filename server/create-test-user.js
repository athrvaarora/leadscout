require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Delete any existing test users
    await User.destroy({ where: { email: 'test@example.com' } });
    
    // Create a fixed password hash directly
    // This hash is for the password 'password123'
    const fixedHash = '$2a$10$HCwRQ1WjUPNbzO8MUQsoluFj2aQxFoCABiXAw4AJZIXtKEdwBjjOi';
    
    // Create the test user with a known hash
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: fixedHash,
      company: 'Test Company',
      role: 'user'
    });
    
    console.log('Test user created:', user.id);
    console.log('Login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    // Test the password
    const isMatch = await user.comparePassword('password123');
    console.log('Password verification:', isMatch);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createTestUser();