/**
 * Database initialization script
 * 
 * This script initializes the PostgreSQL database and creates all required tables.
 * Run with: node scripts/init-db.js
 */
require('dotenv').config();
const { sequelize, syncModels, User } = require('../models');
const bcrypt = require('bcryptjs');

// Function to initialize the database
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    console.log('Using database configuration:');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`SSL: ${process.env.DB_SSL}`);
    
    // Test connection to the database
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (connError) {
      console.error('Connection error details:', connError);
      throw new Error(`Database connection failed: ${connError.message}`);
    }
    
    // Sync all models with the database
    console.log('Syncing models with database...');
    try {
      await syncModels();
      console.log('Models synced successfully.');
    } catch (syncError) {
      console.error('Sync error details:', syncError);
      throw new Error(`Models sync failed: ${syncError.message}`);
    }
    
    // Create admin user if not exists
    try {
      const adminExists = await User.findOne({
        where: { email: 'admin@example.com' }
      });
      
      if (!adminExists) {
        console.log('Creating admin user...');
        
        // Temporarily disable password hashing hooks
        const oldBeforeCreate = User.options.hooks.beforeCreate;
        User.options.hooks.beforeCreate = [];
        
        // Generate a password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Create the admin user with the hash
        await User.create({
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          company: 'Sales Prospector Inc.',
          role: 'admin'
        });
        
        // Restore hooks
        User.options.hooks.beforeCreate = oldBeforeCreate;
        
        console.log('Admin user created successfully.');
        console.log('Login with:');
        console.log('  Email: admin@example.com');
        console.log('  Password: admin123');
      } else {
        console.log('Admin user already exists.');
      }
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    }
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run initialization
initializeDatabase();