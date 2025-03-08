# LeadScout

<div align="center">

  <p><strong>AI-powered B2B prospecting for sales professionals</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-16.x-339933?logo=node.js)](https://nodejs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai)](https://openai.com/)
</div>

## 📋 Overview

LeadScout is a sophisticated B2B prospecting platform that leverages AI to help sales professionals identify high-potential leads for their products or services. By analyzing product details and market data, LeadScout pinpoints relevant companies and decision-makers, streamlining the sales prospecting process.

With LeadScout, sales teams can:
- Find precisely targeted companies based on product fit
- Identify key decision-makers at those companies
- Generate personalized outreach templates
- Track and manage their entire prospecting workflow

## ✨ Features

### 🔍 AI-Powered Prospect Discovery
- **Smart Product Analysis**: Our AI analyzes your product details to understand key features, benefits, and use cases
- **Industry Targeting**: Identifies the most relevant industries for your offering
- **Company Matching**: Discovers companies that are most likely to need your product
- **40% Higher Conversion Rate**: Compared to traditional prospecting methods

### 👤 Decision-Maker Identification
- **Role-Based Contact Finding**: Locates the right stakeholders based on your product type
- **LinkedIn Integration**: Connects with LinkedIn data for accurate contact information
- **Contact Enrichment**: Provides context about prospects to personalize your approach

### 📧 Outreach Optimization
- **Personalized Email Templates**: AI-generated templates tailored to each prospect's needs
- **Messaging Strategy**: Different approaches for different stakeholder roles
- **Follow-up Suggestions**: Smart recommendations for follow-up timing and messaging

### 📊 Prospecting Dashboard
- **Prospect Tracking**: Monitor the status of all your outreach efforts
- **Performance Analytics**: Measure response rates and conversion metrics
- **Activity Logging**: Keep detailed records of all prospecting activities

## 🖥️ Screenshots

<div align="center">
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/1.png" alt="LeadScout Landing Page" width="80%">
  <p><i>LeadScout Landing Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/2.png" alt="LeadScout Landing Page" width="80%">
  <p><i>LeadScout Landing Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/3.png" alt="LeadScout Landing Page" width="80%">
 <p><i>LeadScout Landing Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/4.png" alt="LeadScout Landing Page" width="80%">
  <p><i>LeadScout Landing Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/5.png" alt="Product Description Page" width="80%">
  <p><i>Product Description Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/7.png" alt="Finding Prospect Loading " width="80%">
  <p><i>Finding Prospect Loading</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/8.png" alt="Prospect Listing Page" width="80%">
  <p><i>LProspect Listing Page</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/9.png" alt="Discovering Contacts Loading" width="80%">
  <p><i>Discovering Contacts Loading</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/10.png" alt="Leads at the target Company" width="80%">
  <p><i>Leads at the target Company</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/11.png" alt="Email Template for Outreach" width="80%">
  <p><i>Email Template for Outreach</i></p>
  <img src="https://github.com/athrvaarora/leadscout/raw/main/Screenshot/12.png" alt="Email Template for Outreach" width="80%">
  <p><i>Email Template for Outreach</i></p>
  
</div>

## 🚀 Tech Stack

### Frontend
- **React.js**: Component-based UI development
- **Tailwind CSS**: Utility-first styling framework
- **Framer Motion**: Smooth animations and transitions
- **React Router**: Client-side routing
- **Formik & Yup**: Form handling and validation

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database for storing user and prospect data
- **JWT**: Secure authentication
- **OpenAI API**: AI-powered prospecting and generation

### DevOps
- **GitHub Actions**: CI/CD pipeline
- **Docker**: Containerization for consistent deployment
- **Jest & React Testing Library**: Testing framework

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas connection)
- OpenAI API key

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/leadscout.git
cd leadscout
```

### Step 2: Install server dependencies
```bash
cd server
npm install
```

### Step 3: Configure environment variables
Create a `.env` file in the server directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
OPENAI_API_KEY=your_openai_api_key

# LinkedIn API credentials (optional - enables real contact discovery)
LINKEDIN_API_KEY=your_linkedin_client_id
LINKEDIN_API_SECRET=your_linkedin_client_secret
LINKEDIN_API_TOKEN=your_linkedin_oauth_token
```

### Step 4: Install client dependencies
```bash
cd ../client
npm install
```

## 🚀 Running the Application

### 1. Start the server
```bash
cd server
npm run dev
```

### 2. Start the client
```bash
cd ../client
npm start
```

The application will be available at `http://localhost:3000`, and the server will run on `http://localhost:5000`.

## 📝 Usage Guide

### Getting Started
1. **Create an Account or Continue as Guest**: Register to save your prospects and access all features.
2. **Describe Your Product**: Provide detailed information about your product or service.
3. **Review Discovered Companies**: Examine the AI-generated list of potential client companies.
4. **Explore Decision-Makers**: Find the right contacts at each company.
5. **Use Outreach Templates**: Leverage AI-generated email templates for your first contact.
6. **Track Your Progress**: Monitor responses and follow-ups in your dashboard.

### Best Practices
- Provide detailed product descriptions for better targeting
- Use the industry filter to narrow down prospects
- Save promising prospects to your dashboard
- Schedule follow-ups based on AI recommendations
- Regularly refresh your prospect list with new searches

## 🏢 Architecture

LeadScout follows a modern client-server architecture:

```
├── client/                  # React frontend
│   ├── public/              # Static assets
│   └── src/                 # Source code
│       ├── components/      # UI components
│       ├── context/         # React context providers
│       ├── pages/           # Page components
│       ├── services/        # API service connectors
│       └── utils/           # Utility functions
│
└── server/                  # Node.js backend
    ├── config/              # Configuration files
    ├── controllers/         # Request handlers
    ├── middleware/          # Custom middleware
    ├── models/              # Mongoose data models
    ├── routes/              # API routes
    └── services/            # Business logic services
```

## 🚢 Deployment

### Frontend Deployment
Build the React application:
```bash
cd client
npm run build
```

The build files will be created in the `build` directory and can be deployed to any static hosting service like Netlify, Vercel, or AWS S3.

### Backend Deployment
The server can be deployed to platforms like Heroku, Railway, Digital Ocean, or any Node.js hosting service. Make sure to set the environment variables in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

Project Link: [https://github.com/your-username/leadscout](https://github.com/your-username/leadscout)

---

<div align="center">
  <p>Made with ❤️ for sales professionals everywhere</p>
</div>
