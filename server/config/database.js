const { Sequelize } = require('sequelize');
require('dotenv').config();

// Function to parse connection string if provided
const parseConnectionString = (connectionString) => {
  if (!connectionString) return null;
  
  try {
    // Format: postgresql://username:password@hostname:port/database
    const matches = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (matches && matches.length === 6) {
      return {
        username: matches[1],
        password: matches[2],
        host: matches[3],
        port: parseInt(matches[4], 10),
        database: matches[5]
      };
    }
  } catch (err) {
    console.error('Error parsing connection string:', err);
  }
  return null;
};

// Check if a direct connection string is provided
const connDetails = parseConnectionString(process.env.DATABASE_URL);

// Create PostgreSQL connection with improved error handling and connection options
const sequelize = connDetails ? 
  // Use connection string if provided
  new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log, // More explicit logging
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === 'true', // Explicitly check SSL flag
        rejectUnauthorized: false // Required for Railway's self-signed certificates
      },
      connectTimeout: 60000 // Increase timeout for slower connections
    },
    pool: {
      max: 10, // Increased pool size for better handling of concurrent requests
      min: 0,
      acquire: 60000, // Increased timeout
      idle: 10000
    },
    retry: {
      max: 3 // Attempt to reconnect up to 3 times on failure
    }
  }) : 
  // Use individual connection parameters
  new Sequelize(
    process.env.DB_NAME || 'salesprospector',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false // Required for Railway's self-signed certificates
        } : false,
        connectTimeout: 60000 // Increase timeout for slower connections
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000
      },
      retry: {
        max: 3 // Attempt to reconnect up to 3 times on failure
      }
    }
  );

// Test the connection with enhanced error reporting
const testConnection = async () => {
  try {
    console.log('Attempting to connect to PostgreSQL database...');
    
    if (connDetails) {
      console.log(`Using connection string for ${connDetails.username}@${connDetails.host}:${connDetails.port}/${connDetails.database}`);
    } else {
      console.log(`Using individual parameters: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    }
    
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
    
    // Test query to verify further functionality
    try {
      await sequelize.query('SELECT NOW()');
      console.log('Test query executed successfully.');
    } catch (queryError) {
      console.warn('Connection established but test query failed:', queryError.message);
      console.warn('This may indicate permission issues with the database user.');
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database:', error.message);
    
    // More detailed error diagnosis
    if (error.original) {
      console.error('Original error:', error.original.message);
      
      if (error.original.code === 'ECONNREFUSED') {
        console.error('Connection refused. Verify host and port are correct and the database server is running.');
      } else if (error.original.code === 'ENOTFOUND') {
        console.error('Host not found. Verify the DB_HOST value is correct.');
      } else if (error.original.code === 'ETIMEDOUT') {
        console.error('Connection timed out. The database server may be slow or unreachable.');
      } else if (error.original.code === '28P01') {
        console.error('Authentication failed. Verify DB_USER and DB_PASSWORD are correct.');
      } else if (error.original.code === '3D000') {
        console.error('Database does not exist. Verify DB_NAME is correct.');
      }
    }
    
    return false;
  }
};

module.exports = { sequelize, testConnection };