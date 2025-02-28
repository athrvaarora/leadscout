import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section with enhanced animations */}
      <section className="bg-gradient-to-r from-primary-200 to-accent-200 py-20 text-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-primary-300 rounded-full opacity-20 animate-3d-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-accent-300 rounded-full opacity-20 animate-3d-float animate-delay-300"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-secondary-200 rounded-full opacity-20 animate-3d-float animate-delay-500"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Find the Perfect Prospects for Your Product
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up animate-delay-100">
              Discover relevant companies and decision makers tailored to your product or service.
            </p>
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 animate-slide-up animate-delay-200">
              <p className="text-lg opacity-80">
                LeadScout uses advanced AI to analyze your product and identify ideal target companies,
                saving you <span className="font-bold text-accent-700">hours of manual research</span> and 
                <span className="font-bold text-primary-700"> increasing your conversion rates</span> by up to 40%.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animate-delay-300">
              <Link to="/product-input" className="button-primary px-6 py-3 text-lg card-3d hover:scale-105">
                Get Started Now
              </Link>
              <Link to="/register" className="button-secondary px-6 py-3 text-lg card-3d hover:scale-105">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with enhanced animations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary-600">How LeadScout Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Our AI-powered platform streamlines your sales prospecting process in three simple steps</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {/* Feature 1 */}
            <div className="card text-center group hover:border-primary-300 transition-all duration-300 card-3d">
              <div className="bg-primary-200/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-300/50 transition-all duration-500 transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block">Step 1</span>
              <h3 className="text-xl font-bold mb-3 text-primary-700">Describe Your Product</h3>
              <p className="text-gray-600">
                Input your product details, including name, industry, and a thorough description. Our advanced AI system analyzes key features, benefits, and market fit to identify your ideal customer profile.
              </p>
              <div className="mt-4 h-1 w-16 bg-primary-200 mx-auto rounded-full"></div>
            </div>

            {/* Feature 2 */}
            <div className="card text-center group hover:border-secondary-300 transition-all duration-300 card-3d">
              <div className="bg-secondary-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary-200/50 transition-all duration-500 transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="bg-secondary-100 text-secondary-800 text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block">Step 2</span>
              <h3 className="text-xl font-bold mb-3 text-secondary-700">Discover Ideal Companies</h3>
              <p className="text-gray-600">
                Our AI identifies companies in relevant industries most likely to need your product, with particular focus on organizations showing buying intent. We analyze market data to find your perfect-fit prospects.
              </p>
              <div className="mt-4 h-1 w-16 bg-secondary-200 mx-auto rounded-full"></div>
            </div>

            {/* Feature 3 */}
            <div className="card text-center group hover:border-accent-300 transition-all duration-300 card-3d">
              <div className="bg-accent-200/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent-300/50 transition-all duration-500 transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="bg-accent-100 text-accent-800 text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block">Step 3</span>
              <h3 className="text-xl font-bold mb-3 text-accent-700">Connect with Decision Makers</h3>
              <p className="text-gray-600">
                Identify and verify the right contacts at each company, complete with personalized email templates designed to resonate with each prospect's specific needs, pain points, and industry challenges.
              </p>
              <div className="mt-4 h-1 w-16 bg-accent-200 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section with enhanced visuals */}
      <section className="py-24 bg-gradient-to-br from-secondary-50 to-primary-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-dots opacity-5"></div>
        
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 w-64 h-64 bg-secondary-100 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary-100 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-600">Why Choose LeadScout?</h2>
            <p className="text-lg text-gray-700">
              Our platform helps you find qualified leads faster and more efficiently than traditional methods, 
              with a <span className="font-bold text-accent-700">40% higher conversion rate</span> compared to generic prospecting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Benefits Column 1 */}
            <div className="space-y-10">
              {/* Benefit 1 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-primary-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-700">Save 15+ Hours Weekly</h3>
                </div>
                <p className="text-gray-600">
                  Our AI-powered system identifies relevant prospects in seconds, not days or weeks. Users report saving 15+ hours per week on prospecting tasks and seeing results within the first day.
                </p>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-secondary-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-700">Higher Conversion Rates</h3>
                </div>
                <p className="text-gray-600">
                  Targeted prospecting leads to better conversations and results. Our customers report 3x higher response rates and 40% increased conversion rates compared to traditional cold outreach.
                </p>
              </div>
            </div>
            
            {/* Benefits Column 2 */}
            <div className="space-y-10 md:mt-12">
              {/* Benefit 3 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-accent-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-accent-700">Personalized Outreach</h3>
                </div>
                <p className="text-gray-600">
                  Generate customized email templates based on your product and the prospect's details, with tone and messaging that resonates with each specific audience and decision-maker role.
                </p>
              </div>
              
              {/* Benefit 4 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-primary-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-700">Discover New Markets</h3>
                </div>
                <p className="text-gray-600">
                  Identify industries and companies you might not have considered for your product. Our customers typically find 3-5 new market segments in their first month of using our platform.
                </p>
              </div>
            </div>
            
            {/* Benefits Column 3 */}
            <div className="space-y-10">
              {/* Benefit 5 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-secondary-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-700">Track Your Outreach</h3>
                </div>
                <p className="text-gray-600">
                  Save prospects and monitor your outreach efforts with our intuitive dashboard. Stay organized with full CRM integration capabilities and receive real-time performance analytics.
                </p>
              </div>
              
              {/* Benefit 6 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-3d">
                <div className="flex items-center mb-4">
                  <div className="mr-4 bg-accent-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-accent-700">Data-Driven Insights</h3>
                </div>
                <p className="text-gray-600">
                  Gain intelligence on what makes your best customers tick and refine your sales strategy with actionable analytics and AI-powered recommendations to optimize your sales approach.
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center">
            <div className="bg-white rounded-xl p-8 shadow-card animate-float">
              <div className="text-4xl font-bold text-primary-600 mb-2">3x</div>
              <p className="text-gray-700">Higher response rates compared to cold outreach</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-card animate-float animate-delay-200">
              <div className="text-4xl font-bold text-secondary-600 mb-2">15+</div>
              <p className="text-gray-700">Hours saved per week on prospecting tasks</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-card animate-float animate-delay-400">
              <div className="text-4xl font-bold text-accent-600 mb-2">40%</div>
              <p className="text-gray-700">Increase in sales conversion rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with enhanced design */}
      <section className="py-20 bg-gradient-to-r from-accent-200 to-primary-200 text-dark-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-circuit-pattern opacity-10"></div>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-300/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-300/30 rounded-full filter blur-3xl animate-pulse"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">Ready to Find Your Perfect Prospects?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto animate-slide-up animate-delay-100">
              Join thousands of businesses that use LeadScout to find and connect with their ideal customers. Start boosting your sales pipeline today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10 animate-slide-up animate-delay-200">
              <Link to="/product-input" className="button-primary px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Prospecting Now
              </Link>
              <Link to="/register" className="button-secondary px-8 py-4 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Free Account
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-3xl mx-auto animate-fade-in animate-delay-300">
              <div className="bg-white/60 rounded-lg p-4 shadow-sm backdrop-blur-sm flex items-center">
                <div className="bg-primary-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-dark-900">14-Day Free Trial</h3>
                  <p className="text-sm text-gray-600">Full access to all features</p>
                </div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-4 shadow-sm backdrop-blur-sm flex items-center">
                <div className="bg-secondary-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-dark-900">No Credit Card</h3>
                  <p className="text-sm text-gray-600">Start without payment info</p>
                </div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-4 shadow-sm backdrop-blur-sm flex items-center">
                <div className="bg-accent-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-dark-900">Cancel Anytime</h3>
                  <p className="text-sm text-gray-600">No long-term commitment</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 text-center animate-fade-in animate-delay-400">
              <p className="text-sm text-gray-600">Trusted by companies of all sizes, from startups to enterprises</p>
              <div className="flex justify-center gap-8 mt-4 opacity-70">
                <div className="text-gray-600 font-bold text-xl">Company A</div>
                <div className="text-gray-600 font-bold text-xl">Company B</div>
                <div className="text-gray-600 font-bold text-xl">Company C</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;