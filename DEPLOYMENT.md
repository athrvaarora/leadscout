# LeadScout Deployment Guide

This guide provides step-by-step instructions for deploying LeadScout using GitHub, Railway (backend), and Vercel (frontend).

## Prerequisites

- Git installed on your machine
- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- OpenAI API key for AI functionality

## Step 1: Push to GitHub

1. Create a new GitHub repository:
   - Go to https://github.com/new
   - Name it "leadscout"
   - Keep it private if you prefer

2. Push your code to GitHub:
```bash
cd /Users/athrva/Downloads/claude/sales-prospector
git init
git add .
git commit -m "Initial LeadScout commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leadscout.git
git push -u origin main
```

## Step 2: Deploy Backend to Railway

1. Login to Railway (https://railway.app)

2. Create a new project:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect to GitHub and select your "leadscout" repository

3. Configure the service:
   - Select "server" as the subdirectory to deploy from
   - Set the build command to `npm install`
   - Set the start command to `npm start`

4. Add environment variables:
   - Go to the "Variables" tab
   - Add all the variables from your .env file, including:
     - NODE_ENV=production
     - PORT=5100
     - JWT_SECRET=(generate a strong random string)
     - JWT_EXPIRE=30d
     - OPENAI_API_KEY=(your OpenAI API key)
     - CLAUDE_API_KEY=(optional)
     - LINKEDIN_API_KEY=(optional)
     - LINKEDIN_API_SECRET=(optional)

5. Setup a database:
   - Click "New" in the project dashboard
   - Select "Add Database" > "PostgreSQL"
   - Railway will automatically add the database connection variables to your project

6. Wait for the deployment to complete and note the URL (e.g., https://leadscout-production.up.railway.app)

## Step 3: Deploy Frontend to Vercel

1. Login to Vercel (https://vercel.com)

2. Create a new project:
   - Click "Add New" > "Project"
   - Connect to GitHub and select your "leadscout" repository

3. Configure the project:
   - Set the Framework Preset to "Create React App"
   - Set the Root Directory to "client"
   - Expand "Build and Output Settings" and set:
     - Build Command: `npm run build`
     - Output Directory: `build`

4. Add environment variables:
   - Click "Environment Variables"
   - Add the following:
     - REACT_APP_API_URL=https://your-railway-app-url.up.railway.app/api
     - (Use the URL from Step 2, with "/api" appended)

5. Click "Deploy" and wait for the deployment to complete

6. Your frontend will be available at a URL like https://leadscout.vercel.app

## Step 4: Test the Application

1. Visit your Vercel deployment URL
2. Test registration and login functionality
3. Test the prospecting features
4. Verify connections between frontend and backend

## Troubleshooting

1. **CORS Issues**: Ensure the backend CORS settings include your Vercel domain

2. **API Connection Problems**: 
   - Check REACT_APP_API_URL in Vercel environment variables
   - Verify Railway service is running

3. **Database Issues**:
   - Check Railway logs for database connection errors
   - Verify the DATABASE_URL environment variable is correct

4. **OpenAI API Errors**:
   - Verify your API key is valid
   - Check usage limits on your OpenAI account

## Updating Your Deployment

### Backend Updates
```bash
git add .
git commit -m "Update backend features"
git push
```
Railway will automatically redeploy when you push to GitHub.

### Frontend Updates
```bash
git add .
git commit -m "Update frontend features"
git push
```
Vercel will automatically redeploy when you push to GitHub.

## Production Considerations

1. Set up a custom domain for both frontend and backend
2. Configure SSL certificates (automatically handled by Railway and Vercel)
3. Set up monitoring and logging solutions
4. Implement proper error tracking
5. Consider upgrading to paid plans for production use