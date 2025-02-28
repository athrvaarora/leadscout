# Sales Prospector Server

This is the backend server for the Sales Prospector application, built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js v14+ and npm
- PostgreSQL database (local or hosted service like Railway)

## Getting Started

1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Set up environment variables (see below)
5. Initialize the database: `node scripts/init-db.js`
6. Start the server: `npm run dev`

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
NODE_ENV=development
PORT=5001
JWT_SECRET=your_jwt_secret_replace_this_in_production
JWT_EXPIRE=30d
OPENAI_API_KEY=your_openai_api_key

# PostgreSQL credentials - local database (default)
DB_NAME=salesprospector
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

## Setting up PostgreSQL

### Local PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a new database:
   ```
   psql -U postgres
   CREATE DATABASE salesprospector;
   \q
   ```
3. Update the `.env` file with your PostgreSQL credentials
4. Run the initialization script: `node scripts/init-db.js`

### Railway PostgreSQL Setup

1. Sign up for a Railway account at https://railway.app
2. Create a new PostgreSQL database
3. Get the connection details from Railway dashboard
4. Update the `.env` file with the Railway credentials:
   ```
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=your-railway-password
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=7890
   DB_SSL=true
   ```
5. Run the initialization script: `node scripts/init-db.js`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details

### Prospecting
- `POST /api/prospecting/search` - Submit product search
- `POST /api/prospecting/contacts` - Find contacts for a company
- `POST /api/prospecting/save` - Save a prospect
- `GET /api/prospecting/prospects` - Get all prospects
- `GET /api/prospecting/prospects/:id` - Get a single prospect
- `DELETE /api/prospecting/prospects/:id` - Delete a prospect

## Running in Development Mode

```
npm run dev
```

## Running in Production Mode

```
npm start
```