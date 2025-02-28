# LeadScout Development Guide

## Running the application

### Server
```bash
cd server
PORT=5100 node server.js
```

### Client
```bash
cd client
npm start
```

## Environment Configuration
- Make sure client/.env has REACT_APP_API_URL=http://localhost:5100/api
- Make sure client/package.json has "proxy": "http://localhost:5100"
- Server runs on port 5100 to avoid port conflicts

## API Response Time Issues
If experiencing timeouts or "No response from server" errors:
1. Check the server console for errors
2. The server has a 10-minute timeout (600000ms) for long-running operations
3. OpenAI calls use gpt-3.5-turbo model with reduced token counts for better performance
4. Fallback mechanisms exist for all AI operations

## Common Issues
- Port conflicts: The server tries alternate ports (5100, 5101, 5102, 5103) if the primary port is in use
- Timeouts during prospect search: This is normal for the first search as the model warms up
- Database connection issues: The server will still run with limited functionality if the DB is unavailable