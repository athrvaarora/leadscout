require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const timeout = require('express-timeout-handler');

// Import database and models
const { testConnection } = require('./config/database');
const { syncModels } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const prospectingRoutes = require('./routes/prospecting');
const userRoutes = require('./routes/user');

// Create Express app
const app = express();

// Set up middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://leadscout.netlify.app', 'https://leadscout-seven.vercel.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Configure global timeout handling
app.use(timeout.handler({
  timeout: 600000, // 10 minutes in milliseconds
  onTimeout: function(req, res) {
    console.log(`Request timeout detected for ${req.method} ${req.url}`);
    res.status(503).json({
      success: false,
      message: 'Request processing timed out. Please try again later.',
      timeout: true
    });
  },
  onDelayedResponse: function(req, method, args, requestTime) {
    console.log(`Delayed response detected (${requestTime}ms) for ${req.method} ${req.url}`);
  },
  disable: ['write', 'setHeaders', 'send', 'json', 'end']
}));

// Debug middleware to log requests and enhance error handling
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Capture the original send method
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Responding to ${req.method} ${req.url} with status ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/prospecting', prospectingRoutes);
app.use('/api/user', userRoutes);

// Serve static assets in production - keep for Railway deployment and local development
// Check if we're in production and not running on Railway static URL service
if (process.env.NODE_ENV === 'production') {
  // Check if client/build directory exists before trying to serve from it
  const buildPath = path.join(__dirname, '../client/build');
  try {
    if (require('fs').existsSync(buildPath)) {
      console.log('Serving static assets from client/build directory');
      app.use(express.static(buildPath));
      app.get('*', (req, res) => {
        // Only serve index.html for non-API routes to avoid interfering with API routes
        if (!req.path.startsWith('/api/')) {
          res.sendFile(path.resolve(buildPath, 'index.html'));
        } else {
          next();
        }
      });
    } else {
      console.log('Client build directory not found. Not serving static files.');
    }
  } catch (err) {
    console.log('Error checking for static files directory:', err.message);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Connect to PostgreSQL and sync models
const initializeDatabase = async () => {
  try {
    console.log('Attempting to connect to PostgreSQL database...');
    
    // Set a timeout for the database connection attempt
    const connectionPromise = testConnection();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 10s')), 10000);
    });
    
    // Race between connection and timeout
    const connected = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (connected) {
      console.log('Database connection successful, syncing models...');
      // Sync models with database
      try {
        await syncModels();
        console.log('Models synchronized successfully');
        return true;
      } catch (syncError) {
        console.error('Error synchronizing models:', syncError.message);
        console.error('The server will start, but database functionality may be limited');
        return false;
      }
    } else {
      console.warn('⚠️ Failed to connect to database. Starting in limited functionality mode.');
      console.warn('⚠️ Data storage features will not be available.');
      return false;
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.warn('⚠️ Starting server in fallback mode. Some features will be disabled.');
    return false;
  }
};

// Add database status route to check connection status during runtime
app.get('/api/system/status', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'online',
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'online',
      database: 'error',
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize database and start server with enhanced error handling
const startServer = async () => {
  console.log(`Starting LeadScout API Server in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Try to initialize database but continue even if it fails
  const dbInitialized = await initializeDatabase().catch(err => {
    console.error('Fatal database initialization error:', err);
    return false;
  });
  
  // Set up a global flag that routes can check to determine if DB features are available
  app.set('dbAvailable', dbInitialized);
  
  // Configure graceful shutdown - definition modified to handle dynamic server
  let gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      
      // Force close after 10s
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      console.log('Server not initialized, exiting...');
      process.exit(0);
    }
  };
  
  // Simplified PORT handling for Railway while keeping fallback port options for local development
  const defaultPort = parseInt(process.env.PORT) || 5000;
  
  // For Railway, we'll just use the provided PORT, for local we'll try multiple ports
  if (process.env.RAILWAY_ENVIRONMENT) {
    // We're on Railway, just use the provided port
    const PORT = defaultPort;
    
    try {
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Database status: ${dbInitialized ? 'Connected' : 'Disconnected'}`);
      });
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  } else {
    // We're in local development, try multiple ports
    const tryPorts = [defaultPort, 5001, 5002, 5003];
    let server;
    
    // Function to try starting server on different ports
    const startServerOnPort = (portIndex) => {
      if (portIndex >= tryPorts.length) {
        console.error('Failed to start server. All ports are in use.');
        process.exit(1);
        return;
      }
      
      const PORT = tryPorts[portIndex];
      
      try {
        server = app.listen(PORT, () => {
          console.log(`Server running at http://localhost:${PORT}`);
          console.log(`Database status: ${dbInitialized ? 'Connected' : 'Disconnected'}`);
          console.log('Press Ctrl+C to stop the server');
          
          // If running on a different port than the explicitly provided default, print instructions for client
          if (PORT !== defaultPort) {
            console.log(`\n⚠️ NOTE: Server running on different port than default (${defaultPort})`);
            console.log('If client cannot connect, you may need to:');
            console.log(`1. Set REACT_APP_API_URL=http://localhost:${PORT}/api in client environment`);
            console.log('2. Or update the client baseURL in src/services/api.js');
            console.log(`3. Restart the client application with npm start\n`);
          }
        });
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is in use, trying next port...`);
          startServerOnPort(portIndex + 1);
        } else {
          console.error('Error starting server:', error);
          process.exit(1);
        }
      }
    };
    
    // Start attempting to start the server
    startServerOnPort(0);
  }
  
  // Handle different signals for graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions - Log but don't necessarily shutdown
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception received. Logging but continuing to run:', error);
    console.error(error.stack);
    
    // Only shut down for critical errors that would affect server stability
    if (error.message.includes('EADDRINUSE') || 
        error.message.includes('out of memory') ||
        error.message.includes('Invalid SSL certificate')) {
      console.error('Critical error detected. Shutting down gracefully...');
      gracefulShutdown('Uncaught Exception');
    } else {
      console.log('Non-critical error. Server will continue running.');
    }
  });
  
  // Handle unhandled promise rejections with better reporting
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection at:', promise);
    console.error('Reason:', reason);
    
    // Check if it's a timeout error from OpenAI
    if (reason && reason.message && 
        (reason.message.includes('timeout') || 
         reason.message.includes('signal') ||
         reason.message.includes('aborted'))) {
      console.log('Request timeout detected, resources have been properly cleaned up');
    }
    
    // Don't exit for promise rejections to keep server resilient
    // This is especially important for external API timeouts and scraping errors
  });
};

startServer();
