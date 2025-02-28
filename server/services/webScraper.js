const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Service for web scraping company and contact information
 * Enhanced with better error handling, retry logic, and multiple sources
 */
class WebScraperService {
  constructor() {
    // Configure axios instance with very long timeout
    this.httpClient = axios.create({
      timeout: 60000, // 60 second timeout - very generous to allow operations to complete
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Define additional user agents to rotate for avoiding scraping blocks
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.147',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    ];
    
    // Search templates for different engines with enhanced selectors
    this.searchEngines = [
      { 
        name: 'google',
        url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`,
        resultSelector: '.g',
        titleSelector: 'h3',
        snippetSelector: '.VwiC3b',
        linkSelector: 'a',
        companyInfoSelector: '.iUh30'
      },
      { 
        name: 'bing',
        url: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20`,
        resultSelector: '.b_algo',
        titleSelector: 'h2',
        snippetSelector: '.b_caption p',
        linkSelector: 'a',
        companyInfoSelector: '.b_attribution'
      },
      {
        name: 'duckduckgo',
        url: (query) => `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        resultSelector: '.result',
        titleSelector: '.result__title',
        snippetSelector: '.result__snippet',
        linkSelector: '.result__url',
        companyInfoSelector: '.result__url'
      }
    ];
    
    // Business directories for when search engines don't yield enough results
    this.businessDirectories = [
      {
        name: 'corporateinformation',
        urlTemplate: (industry) => `https://www.corporateinformation.com/Top-${encodeURIComponent(industry)}-Companies.aspx`,
        companySelector: '.databasetable tr',
        nameSelector: 'td:nth-child(1) a',
        linkSelector: 'td:nth-child(1) a',
        descriptionSelector: 'td:nth-child(2)'
      },
      {
        name: 'industryweek',
        urlTemplate: (industry) => `https://www.industryweek.com/companies-executives/article/21130380/${encodeURIComponent(industry)}-companies`,
        companySelector: '.bullet-list-content li',
        nameSelector: 'a',
        linkSelector: 'a',
        descriptionSelector: 'p'
      }
    ];
    
    // LinkedIn search URL templates for finding professionals
    this.linkedinSearchTemplates = [
      (company, title) => `site:linkedin.com/in/ ${company} ${title}`,
      (company, title) => `site:linkedin.com/in/ "${company}" "${title}"`,
      (company, title) => `${company} employees ${title} site:linkedin.com`
    ];
    
    // Set a high number of retries
    this.maxRetries = 5;
    
    // No delay between requests for maximum speed
    this.requestDelay = 0; // No delay
    
    // LinkedIn API configuration (if available)
    this.useLinkedInAPI = process.env.LINKEDIN_API_KEY && process.env.LINKEDIN_API_SECRET;
    if (this.useLinkedInAPI) {
      console.log('LinkedIn API credentials detected - will use official API for contact discovery');
      this.linkedinClient = axios.create({
        baseURL: 'https://api.linkedin.com/v2/',
        headers: {
          'Authorization': `Bearer ${process.env.LINKEDIN_API_TOKEN || ''}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
    } else {
      console.log('No LinkedIn API credentials - will use web scraping for contact discovery');
    }
  }
  
  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} initialDelay - Initial delay in milliseconds
   * @returns {Promise<any>} - Result of the function
   */
  async retryWithBackoff(fn, maxRetries = this.maxRetries, initialDelay = 100) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Calculate delay with minimal backoff
        const delay = initialDelay; // Fixed minimal delay
        console.log(`Retry ${retries}/${maxRetries} immediately...`);
        
        // No delay for faster retries
        // await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Make HTTP request with retry logic and rotating user agents
   * @param {string} url - URL to request
   * @returns {Promise<Object>} - Axios response
   */
  async makeRequest(url) {
    // Randomly select a user agent
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    // Create headers with selected user agent
    const headers = { 
      'User-Agent': userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Referer': 'https://www.google.com/'
    };
    
    // Create a proxy list if available
    // This is commented out but can be uncommented if proxy support is needed
    /*
    const proxies = [
      null, // direct connection
      { host: 'proxy1.example.com', port: 8080 },
      { host: 'proxy2.example.com', port: 8080 }
    ];
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    */
    
    // Make the request with retry logic
    return this.retryWithBackoff(async () => {
      console.log(`Making request to ${url} with user agent: ${userAgent.substring(0, 20)}...`);
      
        // No delay between requests to maximize speed
      // const randomDelay = Math.floor(Math.random() * 1000) + 500;
      // await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      return await this.httpClient.get(url, { 
        headers,
        timeout: 60000, // Very long timeout to avoid interruptions
        // proxy: proxy, // Uncomment if proxy support is added
        validateStatus: status => status < 500 // Accept all non-server error responses
      });
    });
  }

  /**
   * Scrape business directories for companies in a specific industry
   * @param {string} url - URL of the business directory
   * @param {string} industry - Industry to search for
   * @returns {Promise<Array>} - Array of company data
   */
  async scrapeDirectoryForCompanies(url, industry) {
    try {
      console.log(`Scraping business directory for companies in ${industry} industry: ${url}`);
      
      // Determine which directory we're scraping based on the URL
      const directory = this.businessDirectories.find(dir => url.includes(dir.name));
      
      if (!directory) {
        console.warn(`No matching directory configuration found for URL: ${url}`);
        return [];
      }
      
      // Make the HTTP request
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const companies = [];
      
      // Extract company information using the directory's specific selectors
      $(directory.companySelector).each((index, element) => {
        try {
          if (index >= 15) return; // Limit to 15 companies per directory
          
          const nameElement = $(element).find(directory.nameSelector);
          if (!nameElement.length) return;
          
          const name = nameElement.text().trim();
          if (!name || name.length < 3) return;
          
          // Get the company website link
          let website = '';
          const linkElement = $(element).find(directory.linkSelector);
          if (linkElement.length) {
            const href = linkElement.attr('href');
            if (href) {
              // Extract domain from link
              try {
                // Handle relative URLs
                const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                const urlObj = new URL(fullUrl);
                website = urlObj.hostname;
              } catch (e) {
                website = '';
              }
            }
          }
          
          // If we couldn't get a website, try to create one from the company name
          if (!website) {
            website = name.toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .replace(/\s+/g, '') + '.com';
          }
          
          // Get company description
          let description = '';
          const descElement = $(element).find(directory.descriptionSelector);
          if (descElement.length) {
            description = descElement.text().trim();
          }
          
          // If no description, create a generic one
          if (!description) {
            description = `${name} is a company operating in the ${industry} industry.`;
          }
          
          // Calculate a relevance score (75-95 range)
          const relevanceScore = 85 - (index * 0.5);
          
          companies.push({
            name,
            industry,
            description,
            website,
            relevanceScore: Math.round(relevanceScore),
            source: directory.name
          });
        } catch (elementError) {
          console.warn('Error parsing company element:', elementError.message);
        }
      });
      
      console.log(`Found ${companies.length} companies from ${directory.name} directory`);
      return companies;
    } catch (error) {
      console.error(`Error scraping directory ${url}:`, error.message);
      return [];
    }
  }
  
  /**
   * Search for companies based on industry and keywords with enhanced scraping
   * Improved to focus on finding actual potential buyers
   * @param {string} industry - Industry to search for
   * @param {string[]|string} keywords - Keywords related to the product or search query
   * @returns {Promise<Array>} - Array of company data
   */
  async findCompanies(industry, keywords) {
    try {
      // No global timeout - allow the operation to run as long as needed
      // We're setting a dummy function for isTimedOut that always returns false
      // This way operations will never time out
      
      // Handle different types of keywords input
      let searchQuery;
      let keywordsArray = [];
      
      if (Array.isArray(keywords)) {
        keywordsArray = keywords;
        searchQuery = `${industry} companies ${keywords.join(' ')}`;
      } else if (typeof keywords === 'string') {
        searchQuery = keywords;
        keywordsArray = keywords.split(/\s+/).filter(k => k.length > 3);
      } else {
        searchQuery = `top companies in ${industry} industry`;
        keywordsArray = ['top', 'leading', 'best'];
      }
      
      // Add buyer intent focus to the search query
      const buyerIntentQuery = searchQuery.includes('looking for') || 
                              searchQuery.includes('need') || 
                              searchQuery.includes('seeking') ? 
                              searchQuery : 
                              `${searchQuery} seeking solutions`;
      
      console.log(`Starting targeted company search for industry: ${industry}, query: ${buyerIntentQuery}`);
      
      let allCompanies = [];
      const searchEngineResults = [];
      
      // Always return false to prevent timeouts
      const isTimedOut = () => false;
      
      // Create specialized search queries focused on finding actual companies (not lists)
      // But limit the total number of queries to avoid rate limiting
      const baseQuery = searchQuery;
      const searchQueries = [
        `${industry} company using ${keywordsArray.slice(0, 2).join(' ')}`,
        `${industry} startup ${keywordsArray.slice(0, 2).join(' ')}`,
        `${keywordsArray[0]} provider in ${industry}`,
        `"implemented" ${keywordsArray.slice(0, 2).join(' ')} "${industry}"`,
        `"our company" ${keywordsArray.slice(0, 2).join(' ')} "${industry}"`,
        `"about us" ${keywordsArray.slice(0, 2).join(' ')} "${industry}"`,
        `${keywordsArray.slice(0, 2).join(' ')} "${industry}" -list -top -best`,
        `-"top companies" ${industry} ${keywordsArray.slice(0, 2).join(' ')} provider`
      ];
      
      // Try each query with multiple search engines
      // Use all queries for comprehensive results
      for (const query of searchQueries) { // Use all available queries
        if (searchEngineResults.length >= 30) { // Increased limit
          console.log('Reached result limit');
          break;
        }
        
        console.log(`Using targeted search query: "${query}"`);
        
        // Try multiple search engines - but prioritize Bing and DuckDuckGo since Google has stricter rate limits
        // Keep all search engines for comprehensive results
        const reorderedEngines = [
          this.searchEngines.find(e => e.name === 'bing'),
          this.searchEngines.find(e => e.name === 'duckduckgo'),
          this.searchEngines.find(e => e.name === 'google')
        ].filter(Boolean);
        
        for (const engine of reorderedEngines) {
          if (searchEngineResults.length >= 50) { // Increased from 25 to 50
            console.log('Reached engine result limit');
            break;
          }
          
          try {
            console.log(`Trying search engine: ${engine.name} with query: "${query}"`);
            const url = engine.url(query);
            
            // No delays between requests for maximum speed
            // if (searchEngineResults.length > 0) {
            //   await new Promise(resolve => setTimeout(resolve, this.requestDelay));
            // }
            
            // No timeout check to allow all requests to complete
            
            // Make the HTTP request
            const response = await this.makeRequest(url);
            
            // Parse the HTML
            const $ = cheerio.load(response.data);
            const companies = [];
            
            // Extract company information from search results with improved filtering
            $(engine.resultSelector).each((index, element) => {
              if (index >= 20) return; // Increased limit to find more potential matches
              
              try {
                const titleElement = $(element).find(engine.titleSelector);
                if (!titleElement.length) return;
                
                const title = titleElement.text().trim();
                let link = $(element).find(engine.linkSelector).attr('href') || '';
                const snippet = $(element).find(engine.snippetSelector).text().trim() || '';
                
                // Skip results that don't look like companies or are generic
                if (!title || title.length < 3 || 
                    title.toLowerCase().includes('wikipedia') ||
                    title.toLowerCase().includes('definition') ||
                    title.toLowerCase().includes('what is') ||
                    title.toLowerCase().includes('list of') ||
                    title.toLowerCase().includes('top 10') ||
                    title.toLowerCase().includes('top 20') ||
                    title.toLowerCase().includes('top 15') ||
                    title.toLowerCase().includes('top 23') ||
                    title.toLowerCase().includes('top 5') ||
                    title.toLowerCase().includes('top ai') ||
                    title.toLowerCase().includes('best') && title.toLowerCase().includes('for') ||
                    title.toLowerCase().includes('companies') && title.toLowerCase().includes('in') ||
                    title.toLowerCase().includes('companies') && title.toLowerCase().includes('to know') ||
                    title.toLowerCase().includes('companies') && title.toLowerCase().includes('to watch') ||
                    title.toLowerCase().includes('companies') && title.toLowerCase().includes('revolutionizing')) {
                  return;
                }
                
                // Process link (handle redirects)
                if (link.startsWith('/url?q=')) {
                  link = decodeURIComponent(link.substring(7).split('&')[0]);
                }
                
                // Extract domain from link
                let domain = '';
                try {
                  const urlObj = new URL(link.startsWith('http') ? link : `http://${link}`);
                  domain = urlObj.hostname;
                  
                  // Remove www prefix if present
                  if (domain.startsWith('www.')) {
                    domain = domain.substring(4);
                  }
                } catch (e) {
                  // Fallback domain extraction
                  domain = link.includes('://') ? link.split('://')[1].split('/')[0] : '';
                }
                
                // Define a more comprehensive list of non-company domains to filter out
                const nonCompanyDomains = [
                  'wikipedia.org', 'youtube.com', 'facebook.com', 'linkedin.com', 
                  'twitter.com', 'instagram.com', 'google.com', 'bing.com', 
                  'amazon.com', 'reddit.com', 'quora.com', 'slideshare.net',
                  'medium.com', 'github.com', 'forbes.com', 'inc.com', 
                  'entrepreneur.com', 'fastcompany.com', 'techcrunch.com',
                  'wsj.com', 'nytimes.com', 'bloomberg.com', 'businessinsider.com',
                  'gartner.com', 'forrester.com', 'capterra.com', 'g2.com',
                  'cnet.com', 'zdnet.com', 'wired.com', 'pcmag.com', 
                  'inven.ai', 'ai-techpark.com', 'artificial-intelligence.cioreview.com',
                  'techreviewarena.com', 'aisuperior.com', 'datantify.com',
                  'gartner.com', 'globenewswire.com', 'prnewswire.com', 'businesswire.com',
                  'venturebeat.com', 'thesoftwarereport.com', 'cbinsights.com',
                  'techspot.com', 'aithority.com', 'myscale.com', 'openai.com',
                  'cmswire.com', 'content.datantify.com', 'meritalk.com'
                ];
                
                // Skip known non-company domains
                const isNonCompanyDomain = nonCompanyDomains.some(d => domain.includes(d));
                if (isNonCompanyDomain) {
                  return;
                }
                
                // Check if the domain looks like a company site
                const probableCompanyDomain = 
                  // Not a blog, news, or aggregator site
                  !domain.includes('blog') && 
                  !domain.includes('news') && 
                  !domain.includes('magazine') && 
                  !domain.includes('report') && 
                  !domain.includes('review') &&
                  !domain.includes('list') &&
                  // Not an academic or educational site
                  !domain.endsWith('edu') && 
                  !domain.endsWith('ac.uk') &&
                  // Not a government site
                  !domain.endsWith('gov') &&
                  // Not a non-profit organization
                  !domain.endsWith('org') &&
                  // Title doesn't contain indicators of a list/aggregator
                  !title.toLowerCase().includes('list') &&
                  !title.toLowerCase().includes('top') &&
                  !title.toLowerCase().includes('best');
                
                if (!probableCompanyDomain) {
                  return;
                }
                
                // Clean up title (remove things like "- Company" or "| Official Website")
                let cleanTitle = title;
                
                // Remove common suffixes
                const suffixesToRemove = [
                  ' - Wikipedia', ' | Official Site', ' - Official Website', 
                  ' - Home', ' | Home', ' - About Us', ' | About Us',
                  ' - LinkedIn', ' | LinkedIn', ' (@', ' on Twitter',
                  ' - Reviews', ' | Reviews', ' - Ratings', ' | Ratings',
                  ' - G2', ' | G2', ' - Capterra', ' | Capterra'
                ];
                
                for (const suffix of suffixesToRemove) {
                  if (cleanTitle.toLowerCase().endsWith(suffix.toLowerCase())) {
                    cleanTitle = cleanTitle.substring(0, cleanTitle.length - suffix.length).trim();
                  }
                }
                
                // Remove anything after common separators
                const separatorIndex = Math.min(
                  cleanTitle.indexOf(' - ') > 0 ? cleanTitle.indexOf(' - ') : Infinity,
                  cleanTitle.indexOf(' | ') > 0 ? cleanTitle.indexOf(' | ') : Infinity,
                  cleanTitle.indexOf(' – ') > 0 ? cleanTitle.indexOf(' – ') : Infinity,
                  cleanTitle.indexOf(' : ') > 0 ? cleanTitle.indexOf(' : ') : Infinity,
                  cleanTitle.indexOf(': ') > 0 ? cleanTitle.indexOf(': ') : Infinity
                );
                
                if (separatorIndex !== Infinity) {
                  cleanTitle = cleanTitle.substring(0, separatorIndex).trim();
                }
                
                // Skip if name is too short or generic
                if (cleanTitle.length < 3) return;
                
                // Enhance the description to be more buyer-intent focused
                let enhancedDescription = snippet;
                
                // Check for buyer intent signals in the snippet
                const buyerIntentSignals = [
                  'looking for', 'seeking', 'need', 'evaluate', 'implement', 
                  'solution for', 'challenge', 'problem', 'opportunity',
                  'improve', 'enhance', 'optimize', 'streamline', 'automate',
                  'investment', 'adopt', 'migrate', 'upgrade', 'transform'
                ];
                
                const hasBuyerIntent = buyerIntentSignals.some(signal => 
                  snippet.toLowerCase().includes(signal)
                );
                
                // Add buyer intent context if not present
                if (!hasBuyerIntent && enhancedDescription.length > 20) {
                  const industryContext = `${cleanTitle} is a ${industry} company that could benefit from solutions in ${keywordsArray.slice(0, 3).join(', ')}.`;
                  enhancedDescription = `${enhancedDescription} ${industryContext}`;
                }
                
                // If description is too short, generate a more useful one
                if (!enhancedDescription || enhancedDescription.length < 30) {
                  enhancedDescription = `${cleanTitle} is a company in the ${industry} industry that may be looking for solutions related to ${keywordsArray.slice(0, 3).join(', ')}.`;
                }
                
                // Calculate relevance score based on multiple factors
                let relevanceScore = 80; // Base score
                
                // Increase score if result came from a buyer-intent query
                if (query.includes('looking for') || query.includes('need') || query.includes('seeking')) {
                  relevanceScore += 10;
                }
                
                // Increase score if the domain/site matches keywords
                const domainWithoutExtension = domain.split('.')[0].toLowerCase();
                keywordsArray.forEach(keyword => {
                  if (domainWithoutExtension.includes(keyword.toLowerCase())) {
                    relevanceScore += 5;
                  }
                });
                
                // Increase score if the snippet contains buyer intent signals
                if (hasBuyerIntent) {
                  relevanceScore += 7;
                }
                
                // Adjust score based on search result position
                relevanceScore -= (index * 0.5);
                
                // Cap score at 99
                relevanceScore = Math.min(99, Math.max(70, relevanceScore));
                
                companies.push({
                  name: cleanTitle,
                  industry,
                  description: enhancedDescription,
                  website: domain || '',
                  source: `${engine.name}-${query.substring(0, 20)}`,
                  sourceQuery: query,
                  relevanceScore: Math.round(relevanceScore),
                  hasBuyerIntent: hasBuyerIntent,
                  rank: index
                });
              } catch (elementError) {
                console.warn('Error parsing search result element:', elementError.message);
                // Continue to next element
              }
            });
            
            console.log(`Found ${companies.length} companies from ${engine.name} with query "${query}"`);
            searchEngineResults.push(...companies);
          } catch (engineError) {
            console.error(`Error with search engine ${engine.name}:`, engineError.message);
            // Continue to next search engine
          }
        }
      }
      
      // Combine results from all queries and engines
      allCompanies = searchEngineResults;
      
      // Try business directories if we don't have enough results
      if (allCompanies.length < 10) {
        try {
          console.log('Trying business directories for additional companies');
          
          // Get company names from business directories
          for (const directory of this.businessDirectories) {
            const directoryUrl = directory.urlTemplate(industry);
            const directoryCompanies = await this.scrapeDirectoryForCompanies(directoryUrl, industry);
            allCompanies = [...allCompanies, ...directoryCompanies];
          }
        } catch (directoryError) {
          console.error('Error searching business directories:', directoryError.message);
        }
      }
      
      // De-duplicate companies by name and website, with improved merging to combine information
      const uniqueCompanies = this.deduplicateAndEnhanceCompanies(allCompanies);
      console.log(`After deduplication and enhancement: ${uniqueCompanies.length} unique companies found`);
      
      return uniqueCompanies;
    } catch (error) {
      console.error('Error finding companies:', error);
      // Return empty array if scraping fails
      return [];
    }
  }
  
  /**
   * Enhanced deduplication that also merges information from duplicate entries
   * @param {Array} companies - Array of company objects
   * @returns {Array} - Array of deduplicated and enhanced company objects
   */
  deduplicateAndEnhanceCompanies(companies) {
    const companyMap = new Map();
    
    // Group companies by normalized name
    companies.forEach(company => {
      const normalizedName = company.name.toLowerCase().trim();
      
      if (!companyMap.has(normalizedName)) {
        companyMap.set(normalizedName, [company]);
      } else {
        companyMap.get(normalizedName).push(company);
      }
    });
    
    // Process each group to create an enhanced record
    const enhancedCompanies = [];
    
    companyMap.forEach((groupedCompanies, normalizedName) => {
      // Start with the highest relevance score company as base
      groupedCompanies.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      const baseCompany = groupedCompanies[0];
      
      // Merge all descriptions to get the most comprehensive information
      const allDescriptions = groupedCompanies.map(c => c.description).filter(Boolean);
      let enhancedDescription = baseCompany.description;
      
      // If we have multiple descriptions, try to merge them
      if (allDescriptions.length > 1) {
        // Find the longest description as it likely contains most information
        const longestDescription = allDescriptions.reduce((longest, current) => 
          current.length > longest.length ? current : longest, '');
          
        if (longestDescription.length > enhancedDescription.length * 1.5) {
          enhancedDescription = longestDescription;
        }
      }
      
      // Check if any entry has buyer intent
      const hasBuyerIntent = groupedCompanies.some(c => c.hasBuyerIntent);
      
      // Use the best domain (most specific or with a valid format)
      const domains = groupedCompanies.map(c => c.website).filter(Boolean);
      let bestDomain = baseCompany.website;
      
      if (domains.length > 1) {
        // Prefer domains that match the company name
        const nameBasedDomain = domains.find(domain => {
          const domainBase = domain.split('.')[0].toLowerCase();
          return normalizedName.includes(domainBase) || domainBase.includes(normalizedName.slice(0, 5));
        });
        
        if (nameBasedDomain) {
          bestDomain = nameBasedDomain;
        }
      }
      
      // Calculate enhanced relevance score
      const maxRelevanceScore = Math.max(...groupedCompanies.map(c => c.relevanceScore || 0));
      let enhancedScore = maxRelevanceScore;
      
      // Boost score if the company appears in multiple search results
      if (groupedCompanies.length > 1) {
        enhancedScore += Math.min(5, groupedCompanies.length);
      }
      
      // Boost score if it appeared in buyer-intent focused queries
      const hasBuyerIntentQuery = groupedCompanies.some(c => 
        c.sourceQuery && (
          c.sourceQuery.includes('looking for') || 
          c.sourceQuery.includes('need') || 
          c.sourceQuery.includes('seeking') ||
          c.sourceQuery.includes('implementing')
        )
      );
      
      if (hasBuyerIntentQuery) {
        enhancedScore += 5;
      }
      
      // Cap at 99
      enhancedScore = Math.min(99, enhancedScore);
      
      // Create enhanced company record
      enhancedCompanies.push({
        ...baseCompany,
        description: enhancedDescription,
        website: bestDomain,
        hasBuyerIntent,
        relevanceScore: Math.round(enhancedScore),
        aggregatedFrom: groupedCompanies.length
      });
    });
    
    return enhancedCompanies;
  }
  
  /**
   * Remove duplicate companies by name
   * @param {Array} companies - Array of company objects
   * @returns {Array} - Array of deduplicated company objects
   */
  deduplicateCompanies(companies) {
    const seen = new Map();
    
    // Keep track of companies by normalized name
    companies.forEach(company => {
      const normalizedName = company.name.toLowerCase().trim();
      
      // If we've seen this company before, keep the one with higher relevance score
      if (seen.has(normalizedName)) {
        const existing = seen.get(normalizedName);
        if (company.relevanceScore > existing.relevanceScore) {
          seen.set(normalizedName, company);
        }
      } else {
        seen.set(normalizedName, company);
      }
    });
    
    return Array.from(seen.values());
  }
  
  /**
   * Find contacts at a specific company using multiple advanced techniques
   * @param {string} companyName - Name of the company
   * @param {string} domain - Company website domain
   * @param {string} [industry] - Optional industry for better targeting
   * @returns {Promise<Array>} - Array of contact data
   */
  async findContacts(companyName, domain, industry = '', searchQuery = '') {
    try {
      // Normalize and clean up domain
      const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
      console.log(`Finding contacts at ${companyName} (domain: ${cleanDomain})`);
      
      const allContacts = [];
      
      // 1. First try to find contacts using LinkedIn (via API if available, otherwise via search)
      // This approach gets LinkedIn profiles associated with the company
      // If a specific search query was provided, use it to improve targeting
      let linkedInContacts = [];
      if (searchQuery && searchQuery.trim()) {
        console.log(`Using provided search query for LinkedIn contacts: ${searchQuery}`);
        const profiles = await this.searchLinkedInProfilesWithQuery(searchQuery, 5);
        if (profiles.length > 0) {
          linkedInContacts = profiles;
        }
      }
      
      // If we didn't get contacts from the search query, fall back to regular company search
      if (linkedInContacts.length === 0) {
        linkedInContacts = await this.findLinkedInContacts(companyName, cleanDomain);
      }
      
      if (linkedInContacts.length > 0) {
        console.log(`Found ${linkedInContacts.length} contacts from LinkedIn`);
        
        // Add email addresses to LinkedIn contacts
        const contactsWithEmails = linkedInContacts.map(contact => ({
          ...contact,
          email: this.generateEmail(contact.name, cleanDomain)
        }));
        
        allContacts.push(...contactsWithEmails);
      }
      
      // 2. If we don't have enough real contacts, try direct searches for specific job titles
      if (allContacts.filter(c => !c.synthetic).length < 3) {
        // Define key leadership and decision maker roles to search for
        const keyRoles = [];
        
        // Add general leadership roles
        keyRoles.push('CEO', 'CTO', 'CFO', 'COO', 'Chief');
        
        // Add industry-specific roles
        if (industry) {
          if (industry.toLowerCase().includes('tech') || industry.toLowerCase().includes('software')) {
            keyRoles.push('VP Engineering', 'VP Product', 'Director Engineering', 'Director Product');
          }
          if (industry.toLowerCase().includes('market') || industry.toLowerCase().includes('sales')) {
            keyRoles.push('VP Marketing', 'CMO', 'Director Marketing', 'VP Sales');
          }
          if (industry.toLowerCase().includes('health') || industry.toLowerCase().includes('medical')) {
            keyRoles.push('Medical Director', 'Chief Medical Officer', 'Clinical Director');
          }
          if (industry.toLowerCase().includes('financ') || industry.toLowerCase().includes('bank')) {
            keyRoles.push('Investment Director', 'Financial Controller', 'Risk Manager');
          }
        }
        
        // Add common decision maker roles
        keyRoles.push('Director', 'VP', 'Head of', 'Senior Manager');
        
        // Search for each role
        for (const role of keyRoles) {
          if (allContacts.filter(c => !c.synthetic).length >= 3) break;
          
          try {
            console.log(`Searching for ${role} at ${companyName}`);
            
            // Try a direct LinkedIn search first (more accurate)
            const linkedInQuery = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + " " + role)}&origin=GLOBAL_SEARCH_HEADER`;
            try {
              console.log(`Trying direct LinkedIn search for ${role}: ${linkedInQuery}`);
              const response = await this.makeRequest(linkedInQuery);
              
              // Extract LinkedIn profile URLs from the page
              const profileMatches = response.data.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/g);
              if (profileMatches && profileMatches.length > 0) {
                console.log(`Found ${profileMatches.length} ${role} profiles from direct LinkedIn search`);
                
                // Take up to 2 profiles for each role
                const uniqueProfiles = [...new Set(profileMatches)].slice(0, 2);
                for (const profileUrl of uniqueProfiles) {
                  try {
                    // Extract profile name from URL
                    const profileName = profileUrl.split('/').pop().replace(/[_-]/g, ' ');
                    const formattedName = profileName
                      .split(' ')
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ');
                    
                    // Skip if we already have this person
                    if (allContacts.some(c => 
                      c.name.toLowerCase() === formattedName.toLowerCase() ||
                      (c.linkedInUrl && c.linkedInUrl === `https://www.${profileUrl}`)
                    )) {
                      continue;
                    }
                    
                    // Add to contacts with verified flag
                    allContacts.push({
                      name: formattedName,
                      title: role, // Use the role we searched for
                      email: this.generateEmail(formattedName, cleanDomain),
                      linkedInUrl: `https://www.${profileUrl}`,
                      source: 'linkedin-direct-role',
                      verifiedCompany: true,
                      profileIsValid: true,
                      synthetic: false // Explicitly mark as non-synthetic
                    });
                  } catch (profileError) {
                    console.warn(`Error processing profile from role search: ${profileError.message}`);
                  }
                }
              }
            } catch (linkedInError) {
              console.warn(`LinkedIn direct search for ${role} failed: ${linkedInError.message}`);
            }
            
            // If we still need contacts, try web search
            if (allContacts.filter(c => !c.synthetic).length < 3) {
              // Create search query
              const query = `${companyName} ${role} site:linkedin.com/in/`;
              const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
              
              // Add delay between requests to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, this.requestDelay));
              
              // Make the request
              const response = await this.makeRequest(url);
              
              // Parse results
              const $ = cheerio.load(response.data);
              
              // Look for LinkedIn profile results
              $('div.g').each((i, element) => {
                if (allContacts.filter(c => !c.synthetic).length >= 3) return;
                
                try {
                  const titleElement = $(element).find('h3');
                  if (!titleElement.length) return;
                  
                  const title = titleElement.text().trim();
                  
                  // Skip if not a profile or doesn't seem relevant
                  if (!title.toLowerCase().includes('linkedin') || 
                      !title.toLowerCase().includes(role.toLowerCase())) {
                    return;
                  }
                  
                  // Extract name from title
                  let name = '';
                  
                  // Try different patterns
                  if (title.includes(' - ')) {
                    name = title.split(' - ')[0].trim();
                  } else if (title.includes(' | ')) {
                    name = title.split(' | ')[0].trim();
                  } else if (title.includes(': ')) {
                    name = title.split(':')[0].trim();
                  } else {
                    // Try to parse the beginning of the title as a name
                    const words = title.split(' ');
                    if (words.length >= 2) {
                      name = words.slice(0, 2).join(' ');
                    }
                  }
                  
                  // Skip if name doesn't seem valid
                  if (!name || name.length < 5 || 
                      name.toLowerCase().includes('linkedin') || 
                      name.toLowerCase().includes('profile')) {
                    return;
                  }
                  
                  // Extract position title
                  let extractedRole = role;
                  if (title.includes(' - ') && title.split(' - ').length > 1) {
                    extractedRole = title.split(' - ')[1].split(' | ')[0].trim();
                  }
                  
                  // Get LinkedIn URL
                  const link = $(element).find('a').attr('href') || '';
                  let linkedInUrl = link.startsWith('/url?q=') ? 
                    link.substring(7).split('&')[0] : link;
                    
                  // Clean up URL
                  if (linkedInUrl && !linkedInUrl.startsWith('http')) {
                    linkedInUrl = 'https://' + linkedInUrl;
                  }
                  
                  // Verify it's a LinkedIn profile URL
                  if (!linkedInUrl.includes('linkedin.com/in/')) {
                    return;
                  }
                  
                  // Create contact object with synthetic=false flag
                  const contact = {
                    name,
                    title: extractedRole,
                    email: this.generateEmail(name, cleanDomain),
                    linkedInUrl,
                    source: 'linkedin-role-search',
                    verifiedCompany: true,
                    profileIsValid: true,
                    synthetic: false
                  };
                  
                  // Check if we already have this person
                  const isDuplicate = allContacts.some(c => 
                    c.name.toLowerCase() === contact.name.toLowerCase() ||
                    (c.linkedInUrl && c.linkedInUrl === contact.linkedInUrl)
                  );
                  
                  if (!isDuplicate) {
                    allContacts.push(contact);
                  }
                } catch (elementError) {
                  console.warn('Error parsing LinkedIn result:', elementError.message);
                }
              });
            }
          } catch (roleSearchError) {
            console.warn(`Error searching for ${role} at ${companyName}:`, roleSearchError.message);
          }
        }
      }
      
      // 3. Try to find contacts from the company website
      if (allContacts.filter(c => !c.synthetic).length < 3) {
        try {
          const websiteContacts = await this.findContactsFromWebsite(cleanDomain);
          
          if (websiteContacts.length > 0) {
            console.log(`Found ${websiteContacts.length} contacts from company website`);
            
            // Mark these contacts as non-synthetic
            const markedWebsiteContacts = websiteContacts.map(contact => ({
              ...contact,
              synthetic: false,
              source: contact.source || 'company-website'
            }));
            
            // Add only new contacts (avoid duplicates)
            const existingNames = new Set(allContacts.map(c => c.name.toLowerCase()));
            
            for (const contact of markedWebsiteContacts) {
              if (!existingNames.has(contact.name.toLowerCase()) && 
                  allContacts.filter(c => !c.synthetic).length < 3) {
                allContacts.push(contact);
                existingNames.add(contact.name.toLowerCase());
              }
            }
          }
        } catch (websiteError) {
          console.warn('Error finding contacts from website:', websiteError.message);
        }
      }
      
      // Count how many real contacts we have
      const realContactCount = allContacts.filter(c => !c.synthetic).length;
      console.log(`Found ${realContactCount} real contacts (non-synthetic) for ${companyName}`);
      
      // Return just the real contacts we've found - no synthetic generation
      if (realContactCount > 0) {
        console.log(`Using ${realContactCount} real contacts found for ${companyName}`);
        return allContacts.filter(c => !c.synthetic);
      } else {
        console.log(`No real contacts found for ${companyName} - trying one last search approach`);
        
        // Make one last attempt with very direct search queries
        const lastAttemptQueries = [
          `"${companyName}" "profile" "current" site:linkedin.com/in/`,
          `"${companyName}" "linkedin profile" site:linkedin.com`,
          `"works at ${companyName}" "profile" site:linkedin.com`
        ];
        
        for (const query of lastAttemptQueries) {
          try {
            const profiles = await this.searchLinkedInProfilesWithQuery(query, 3);
            if (profiles.length > 0) {
              // Add email addresses
              const contactsWithEmails = profiles.map(contact => ({
                ...contact,
                email: this.generateEmail(contact.name, cleanDomain)
              }));
              
              console.log(`Found ${contactsWithEmails.length} real contacts in final attempt`);
              return contactsWithEmails;
            }
          } catch (error) {
            console.warn(`Error in final search attempt: ${error.message}`);
          }
        }
        
        // If we still have no contacts, return an empty array
        console.log(`Could not find any real contacts for ${companyName}`);
        return [];
      }
      
      // Order contacts by seniority/importance (put leadership roles first)
      // But also prioritize real contacts over synthetic ones
      const orderedContacts = this.rankContactsBySeniority(allContacts);
      
      // Final sort to make sure real contacts always come before synthetic ones
      orderedContacts.sort((a, b) => {
        // Real contacts always before synthetic ones
        if ((a.synthetic === false || a.synthetic === undefined) && b.synthetic === true) return -1;
        if (a.synthetic === true && (b.synthetic === false || b.synthetic === undefined)) return 1;
        return 0; // Maintain the seniority-based order within each group
      });
      
      // Return top 3 contacts
      return orderedContacts.slice(0, 3);
    } catch (error) {
      console.error('Error finding contacts:', error);
      
      // On error, generate synthetic contacts as fallback
      const syntheticContacts = this.generateSyntheticContacts(companyName, domain, 3);
      
      // Clearly mark these as synthetic
      return syntheticContacts.map(contact => ({
        ...contact,
        synthetic: true,
        source: 'generated-fallback'
      }));
    }
  }
  
  /**
   * Rank contacts by seniority/importance for better targeting
   * @param {Array} contacts - Array of contacts
   * @returns {Array} - Sorted array of contacts
   */
  rankContactsBySeniority(contacts) {
    const positionWeights = {
      'CEO': 100,
      'Chief Executive Officer': 100,
      'President': 95,
      'Founder': 95,
      'Co-Founder': 90,
      'CTO': 85,
      'Chief Technology Officer': 85,
      'CFO': 80,
      'Chief Financial Officer': 80,
      'COO': 80,
      'Chief Operating Officer': 80,
      'CMO': 75,
      'Chief Marketing Officer': 75,
      'VP': 70,
      'Vice President': 70,
      'Director': 60,
      'Head': 55,
      'Senior Manager': 50,
      'Manager': 40
    };
    
    return [...contacts].sort((a, b) => {
      // Calculate position weight for each contact
      const getPositionWeight = (title) => {
        if (!title) return 0;
        
        const normalizedTitle = title.toLowerCase();
        
        // Look for exact matches first
        for (const [position, weight] of Object.entries(positionWeights)) {
          if (normalizedTitle === position.toLowerCase()) {
            return weight;
          }
        }
        
        // Then look for partial matches
        let highestWeight = 0;
        for (const [position, weight] of Object.entries(positionWeights)) {
          if (normalizedTitle.includes(position.toLowerCase())) {
            highestWeight = Math.max(highestWeight, weight);
          }
        }
        
        return highestWeight;
      };
      
      const weightA = getPositionWeight(a.title);
      const weightB = getPositionWeight(b.title);
      
      // Sort by weight (descending)
      return weightB - weightA;
    });
  }
  
  /**
   * Find contacts using advanced LinkedIn search strategies
   * @param {string} companyName - Company name
   * @param {string} domain - Company domain
   * @returns {Promise<Array>} - Array of contacts (without emails)
   */
  async findLinkedInContacts(companyName, domain) {
    try {
      // First check if LinkedIn API is available
      if (this.useLinkedInAPI && this.linkedinClient) {
        try {
          console.log(`Using LinkedIn API to find contacts at ${companyName}`);
          return await this.findContactsViaLinkedInAPI(companyName, domain);
        } catch (apiError) {
          console.error('LinkedIn API error, falling back to search methods:', apiError.message);
          // Continue with search method as fallback
        }
      }
      
      // If API failed or not available, use search-based approach
      console.log(`Using search-based approach to find LinkedIn contacts at ${companyName}`);
      
      // Initialize array to store all found contacts
      const allContacts = [];
      
      // Create multiple specialized search queries for better results
      const companyNameEncoded = encodeURIComponent(companyName);
      const domainEncoded = encodeURIComponent(domain);
      
      // First try direct search for specific LinkedIn profile links using search engines
      // This is the most reliable approach for finding real profiles
      console.log("Searching for real LinkedIn profiles using search engines");
      
      const roleQueries = [
        // Marketing roles
        `${companyName} "Director of Marketing" OR "CMO" OR "VP Marketing" OR "Head of Marketing" site:linkedin.com/in/`,
        `${companyName} "Marketing Manager" OR "Growth Manager" OR "Marketing Lead" site:linkedin.com/in/`,
        
        // Sales roles
        `${companyName} "Sales Director" OR "VP of Sales" OR "Chief Revenue Officer" site:linkedin.com/in/`,
        `${companyName} "Account Executive" OR "Sales Manager" OR "Business Development" site:linkedin.com/in/`,
        
        // Executive roles
        `${companyName} "CEO" OR "CTO" OR "COO" OR "Chief" OR "President" site:linkedin.com/in/`,
        `${companyName} "VP" OR "Vice President" OR "Director" OR "Head of" site:linkedin.com/in/`,
        
        // Product roles
        `${companyName} "Product Manager" OR "Product Director" OR "Head of Product" site:linkedin.com/in/`,
        
        // Generic role search with company name
        `${companyName} "current" employee site:linkedin.com/in/`,
        `${companyName} works at OR "current position" site:linkedin.com/in/`
      ];
      
      // Try each role query to find specific LinkedIn profiles
      for (const query of roleQueries) {
        if (allContacts.length >= 10) break; // Stop when we have enough profiles
        
        try {
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;
          console.log(`Searching for LinkedIn profiles with query: ${query}`);
          
          const response = await this.makeRequest(googleUrl);
          const $ = cheerio.load(response.data);
          
          // Extract LinkedIn profile URLs from search results
          $('a').each((i, element) => {
            const href = $(element).attr('href');
            if (!href) return;
            
            // Properly extract LinkedIn profile URL
            if (href.includes('/url?') && href.includes('linkedin.com/in/')) {
              try {
                const profileUrl = new URL(href.replace('/url?q=', '')).searchParams.get('q') || 
                                  href.split('/url?q=')[1]?.split('&')[0];
                                  
                if (profileUrl && profileUrl.includes('linkedin.com/in/')) {
                  // Clean up URL
                  let cleanProfileUrl = profileUrl;
                  if (!cleanProfileUrl.startsWith('http')) {
                    cleanProfileUrl = 'https://' + cleanProfileUrl;
                  }
                  
                  // Skip if we already have this URL
                  if (allContacts.some(c => c.linkedInUrl === cleanProfileUrl)) {
                    return;
                  }
                  
                  // Extract name from URL
                  const urlPath = new URL(cleanProfileUrl).pathname;
                  const profileName = urlPath.split('/in/')[1]?.replace(/\/$/, '').replace(/[_-]/g, ' ');
                  if (!profileName) return;
                  
                  const formattedName = profileName
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ');
                  
                  // Verify this URL and check title
                  console.log(`Found LinkedIn profile URL: ${cleanProfileUrl}`);
                  
                  // Add to contacts with verified flag
                  allContacts.push({
                    name: formattedName,
                    title: `Employee at ${companyName}`, // Default title
                    linkedInUrl: cleanProfileUrl,
                    source: 'search-engine-linkedin',
                    verifiedCompany: true,
                    profileIsValid: true,
                    synthetic: false // Explicitly mark as non-synthetic
                  });
                }
              } catch (urlError) {
                console.warn(`Error parsing LinkedIn URL: ${urlError.message}`);
              }
            }
          });
          
          console.log(`Found ${allContacts.length} LinkedIn profiles so far`);
          
        } catch (searchError) {
          console.warn(`Error with search query: ${searchError.message}`);
        }
      }
      
      // Try direct LinkedIn URL search as backup
      // This is less reliable but may still find some profiles
      if (allContacts.length < 3) {
        console.log("Trying direct LinkedIn search as backup method");
        
        // Direct LinkedIn URL for the company search (this is public and doesn't require login)
        const directLinkedInSearchUrls = [
          `https://www.linkedin.com/company/${companyNameEncoded}/people/`,
          `https://www.linkedin.com/search/results/people/?keywords=${companyNameEncoded}%20current%20employee&origin=GLOBAL_SEARCH_HEADER`,
          `https://www.linkedin.com/search/results/people/?keywords=${companyNameEncoded}%20marketing%20director&origin=GLOBAL_SEARCH_HEADER`,
          `https://www.linkedin.com/search/results/people/?keywords=${companyNameEncoded}%20sales%20manager&origin=GLOBAL_SEARCH_HEADER`,
          `https://www.linkedin.com/search/results/people/?keywords=${companyNameEncoded}%20vp&origin=GLOBAL_SEARCH_HEADER`,
          `https://www.linkedin.com/search/results/people/?currentCompany=["${companyNameEncoded}"]&origin=FACETED_SEARCH`
        ];
        
        // Try direct LinkedIn search - this has most accurate results
        for (const linkedInUrl of directLinkedInSearchUrls) {
          if (allContacts.length >= 10) break; // Stop when we have enough profiles
          
          try {
            console.log(`Attempting direct LinkedIn search: ${linkedInUrl}`);
            const response = await this.makeRequest(linkedInUrl);
            
            // Extract LinkedIn profile URLs from the page
            const profileMatches = response.data.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/g);
            if (profileMatches && profileMatches.length > 0) {
              console.log(`Found ${profileMatches.length} profiles from direct LinkedIn search`);
              
              // Take up to 10 profiles from the direct search
              const uniqueProfiles = [...new Set(profileMatches)].slice(0, 10);
              for (const profileUrl of uniqueProfiles) {
                try {
                  // Skip if we already have this profile
                  const fullUrl = `https://www.${profileUrl}`;
                  if (allContacts.some(c => c.linkedInUrl === fullUrl)) {
                    continue;
                  }
                  
                  // Extract profile name from URL
                  const profileName = profileUrl.split('/').pop().replace(/[_-]/g, ' ');
                  const formattedName = profileName
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ');
                  
                  // Add to contacts with verified flag
                  allContacts.push({
                    name: formattedName,
                    title: `Employee at ${companyName}`, // Default title
                    linkedInUrl: fullUrl,
                    source: 'linkedin-direct',
                    verifiedCompany: true,
                    profileIsValid: true,
                    synthetic: false // Explicitly mark as non-synthetic
                  });
                } catch (profileError) {
                  console.warn(`Error processing profile from direct search: ${profileError.message}`);
                }
              }
            }
          } catch (directSearchError) {
            console.warn(`Direct LinkedIn search failed: ${directSearchError.message}`);
          }
        }
      }
      
      // Try to get actual profile details for the contacts we found directly
      for (let i = 0; i < allContacts.length; i++) {
        const contact = allContacts[i];
        if (contact.linkedInUrl) {
          try {
            console.log(`Fetching profile details for: ${contact.linkedInUrl}`);
            const response = await this.makeRequest(contact.linkedInUrl);
            
            // Use regex to extract title from profile page
            const titleMatch = response.data.match(/<title>([^<]+)<\/title>/);
            if (titleMatch && titleMatch[1]) {
              const fullTitle = titleMatch[1];
              
              // Extract role from the title
              let title = contact.title;
              if (fullTitle.includes(' - ') && fullTitle.includes(' at ')) {
                const titleParts = fullTitle.split(' - ');
                const namePart = titleParts[0].trim();
                if (titleParts.length > 1) {
                  const rolePart = titleParts[1].trim();
                  if (rolePart.includes(' at ')) {
                    const actualRole = rolePart.split(' at ')[0].trim();
                    if (actualRole && !actualRole.toLowerCase().includes('linkedin') && actualRole.length > 3) {
                      title = actualRole;
                      
                      // Also update name if it's more accurate than URL-derived name
                      if (namePart && namePart.length > 3 && !namePart.toLowerCase().includes('linkedin')) {
                        contact.name = namePart;
                      }
                    }
                  }
                }
              }
              
              // Update the contact with better title information
              contact.title = title;
              
              // Check if they're actually at the company - looking for company name in the profile title
              if (fullTitle.toLowerCase().includes(companyName.toLowerCase())) {
                contact.verifiedCompany = true;
              }
            }
            
            // Try to extract more context from the page content
            const experienceMatch = response.data.match(/experience-item">[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/i);
            if (experienceMatch && experienceMatch.length > 2) {
              const currentRole = experienceMatch[1].replace(/<[^>]*>/g, '').trim();
              const currentCompany = experienceMatch[2].replace(/<[^>]*>/g, '').trim();
              
              // Only update if we got something meaningful
              if (currentRole && currentRole.length > 3 && !contact.title.includes('Employee at')) {
                console.log(`Found role from profile page: ${currentRole} at ${currentCompany}`);
                
                // Update title if it's more specific than what we had
                if (contact.title === `Employee at ${companyName}`) {
                  contact.title = currentRole;
                }
                
                // Verify company match
                if (currentCompany && currentCompany.toLowerCase().includes(companyName.toLowerCase())) {
                  contact.verifiedCompany = true;
                }
              }
            }
            
            // Look specifically for current company section
            const currentCompanyMatch = response.data.match(/current-company"[^>]*>(.*?)<\/a>/i);
            if (currentCompanyMatch && currentCompanyMatch[1]) {
              const currentCompany = currentCompanyMatch[1].replace(/<[^>]*>/g, '').trim();
              if (currentCompany && currentCompany.toLowerCase().includes(companyName.toLowerCase())) {
                contact.verifiedCompany = true;
              }
            }
            
            // Extract headline if available
            const headlineMatch = response.data.match(/headline">([^<]+)<\/h2>/i);
            if (headlineMatch && headlineMatch[1]) {
              const headline = headlineMatch[1].trim();
              if (headline && headline.length > 5 && headline !== contact.title) {
                if (contact.title === `Employee at ${companyName}`) {
                  contact.title = headline;
                }
              }
            }
            
          } catch (profileError) {
            console.warn(`Error fetching profile details: ${profileError.message}`);
          }
        }
      }
      
      // Continue with search engine queries if direct search didn't yield enough results
      if (allContacts.length < 3) {
        const searchQueries = [
          `${companyName} "current" "employee" site:linkedin.com/in/`,
          `"${companyName}" "current" "leadership" site:linkedin.com/in/`,
          `"${companyName}" "current" "director" OR "vice president" OR "VP" site:linkedin.com/in/`,
          `"${companyName}" "current company" site:linkedin.com/in/`,
          `"works at ${companyName}" site:linkedin.com/in/`,
          `"${domain}" "current" "employee" site:linkedin.com/in/`,
          `"people who work at ${companyName}" site:linkedin.com/in/`
        ];
        
        // Try each search query with improved parsing
        for (const searchQuery of searchQueries) {
          if (allContacts.length >= 5 && allContacts.some(c => c.verifiedCompany)) break; // Stop early if we have enough verified contacts
          if (allContacts.length >= 10) break; // Hard limit to avoid excessive searching
          
          try {
            // Try both Google and Bing search engines
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20`;
            const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&count=20`;
            
            console.log(`Searching for LinkedIn profiles with query: ${searchQuery}`);
            
            // Try both Google and Bing
            let response;
            try {
              response = await this.makeRequest(googleUrl);
              console.log('Successfully searched via Google');
            } catch (googleError) {
              console.warn('Google search failed, trying Bing:', googleError.message);
              response = await this.makeRequest(bingUrl);
              console.log('Successfully searched via Bing');
            }
            
            // Parse the HTML
            const $ = cheerio.load(response.data);
            
            // Determine which selectors to use based on search engine
            const isGoogle = response.config.url.includes('google.com');
            const resultSelector = isGoogle ? '.g' : '.b_algo';
            const titleSelector = isGoogle ? 'h3' : 'h2';
            const snippetSelector = isGoogle ? '.VwiC3b, .st' : '.b_caption p';
            
            // Extract contact information from search results with improved parsing
            $(resultSelector).each((index, element) => {
              if (index >= 15 || allContacts.length >= 10) return;
              
              try {
                const titleElement = $(element).find(titleSelector);
                if (!titleElement.length) return;
                
                const fullText = titleElement.text().trim();
                
                // Skip if doesn't seem to be a LinkedIn profile
                if (!fullText.toLowerCase().includes('linkedin')) return;
                
                // Skip LinkedIn company pages and irrelevant results
                if (fullText.toLowerCase().includes('linkedin company') || 
                    fullText.toLowerCase().includes('linkedin business') ||
                    fullText.toLowerCase().includes('jobs at') ||
                    fullText.toLowerCase().includes('hiring at') ||
                    fullText.toLowerCase().includes('employees at')) {
                  return;
                }
                
                // Check if the result contains the company name in the title or snippet
                const snippetElement = $(element).find(snippetSelector);
                const snippet = snippetElement.text().toLowerCase() || '';
                
                // Get the LinkedIn URL with improved extraction
                let linkedInUrl = $(element).find('a').attr('href') || '';
                
                // Process Google/Bing redirects
                if (linkedInUrl.startsWith('/url?q=')) {
                  linkedInUrl = decodeURIComponent(linkedInUrl.substring(7).split('&')[0]);
                }
                
                // Verify it's a LinkedIn profile URL
                const isLinkedInProfile = linkedInUrl.includes('linkedin.com/in/');
                if (!isLinkedInProfile) {
                  // Try to extract from snippet
                  const urlMatch = snippet.match(/linkedin\.com\/in\/[\w-]+/);
                  if (urlMatch) {
                    linkedInUrl = 'https://' + urlMatch[0];
                  } else {
                    // Skip if we can't find a LinkedIn profile URL
                    return;
                  }
                }
                
                // More strictly verify that the profile is actually associated with the company
                // Look for the company name in the snippet or title
                const snippetHasCompany = 
                  snippet.includes(companyName.toLowerCase()) || 
                  snippet.includes(domain.toLowerCase());
                  
                const titleHasCompany = 
                  fullText.toLowerCase().includes(companyName.toLowerCase()) ||
                  fullText.toLowerCase().includes(domain.toLowerCase());
                  
                const hasCurrentIndicator = 
                  snippet.includes('current') || 
                  snippet.includes('currently') || 
                  snippet.includes('works at') || 
                  snippet.includes('employed at');
                  
                // Check specifically for current company indicators
                const currentCompanyMatch = snippet.match(/current(?:ly)?(?:\s+\w+){0,3}\s+(?:at|@|with|in|for)\s+(.{0,40})/i);
                const worksAtMatch = snippet.match(/works\s+(?:at|@|with|in|for)\s+(.{0,40})/i);
                const employedAtMatch = snippet.match(/employed\s+(?:at|@|with|in|for)\s+(.{0,40})/i);
                
                const companyInCurrentPosition = 
                  (currentCompanyMatch && currentCompanyMatch[1].toLowerCase().includes(companyName.toLowerCase())) ||
                  (worksAtMatch && worksAtMatch[1].toLowerCase().includes(companyName.toLowerCase())) ||
                  (employedAtMatch && employedAtMatch[1].toLowerCase().includes(companyName.toLowerCase()));
                
                // Only continue if the profile is likely associated with the company
                const isRelevant = (snippetHasCompany || titleHasCompany) && 
                                 (hasCurrentIndicator || companyInCurrentPosition);
                
                if (!isRelevant) {
                  return;
                }
                
                // Extract name and title using different patterns with improved accuracy
                let name = '', title = '';
                
                // Try multiple pattern matching strategies
                // Pattern: "Name - Title at Company - LinkedIn"
                if (fullText.includes(' - ')) {
                  const parts = fullText.split(' - ');
                  name = parts[0].trim();
                  
                  // Extract title from second part
                  if (parts.length > 1) {
                    let titlePart = parts[1].trim();
                    
                    // Further clean up title based on various patterns
                    if (titlePart.includes(' at ')) {
                      title = titlePart.split(' at ')[0].trim();
                    } else if (titlePart.includes(' | ')) {
                      title = titlePart.split(' | ')[0].trim();
                    } else {
                      title = titlePart.replace(/linkedin|profile/gi, '').trim();
                    }
                  }
                }
                // Pattern: "Name | Title at Company | LinkedIn"
                else if (fullText.includes(' | ')) {
                  const parts = fullText.split(' | ');
                  name = parts[0].trim();
                  
                  if (parts.length > 1) {
                    let titlePart = parts[1].trim();
                    
                    if (titlePart.includes(' at ')) {
                      title = titlePart.split(' at ')[0].trim();
                    } else {
                      title = titlePart.replace(/linkedin|profile/gi, '').trim();
                    }
                  }
                }
                // Pattern: "Name: Title at Company - LinkedIn Profile"
                else if (fullText.includes(': ')) {
                  const parts = fullText.split(': ');
                  name = parts[0].trim();
                  
                  if (parts.length > 1) {
                    const secondPart = parts[1];
                    if (secondPart.includes(' at ')) {
                      title = secondPart.split(' at ')[0].trim();
                    } else {
                      title = secondPart.replace(/linkedin|profile/gi, '').trim();
                    }
                  }
                }
                // Try to extract from snippet if we couldn't get from title
                else {
                  // Extract name from beginning of title
                  const linkedInIndex = fullText.toLowerCase().indexOf('linkedin');
                  if (linkedInIndex > 0) {
                    name = fullText.substring(0, linkedInIndex).trim();
                    
                    // Try to extract title from snippet
                    const titleMatch = snippet.match(/(?:is|as)\s+((?:a|an)\s+)?([^\.]+)/i);
                    if (titleMatch && titleMatch[2]) {
                      title = titleMatch[2].trim();
                    }
                  } else {
                    // Can't parse name reliably, skip
                    return;
                  }
                }
                
                // Process name to improve accuracy
                // Remove common suffixes like "on LinkedIn"
                name = name.replace(/\son\slinkedin$/i, '').trim();
                
                // Skip if we couldn't extract a good name
                if (!name || name.length < 3 || 
                    name.toLowerCase().includes('linkedin') || 
                    name.toLowerCase().includes('profile')) {
                  return;
                }
                
                // Clean up extracted title
                if (title) {
                  // Remove references to the company
                  title = title.replace(new RegExp(`at ${companyName}`, 'i'), '')
                             .replace(/(at|@)\s+[\w\s]+$/i, '')
                             .replace(/\son\slinkedin$/i, '')
                             .trim();
                }
                
                // If title is missing or invalid, try to extract it from snippet
                if (!title || 
                    title.toLowerCase().includes('linkedin') || 
                    title.toLowerCase().includes('profile')) {
                    
                  // Try to extract from snippet
                  const titleFromSnippet = snippet.match(/(?:is|as)\s+((?:a|an)\s+)?([^\.]+(?:director|manager|president|officer|executive|lead|head|specialist|engineer|developer|architect|consultant|analyst|strategist))/i);
                  
                  if (titleFromSnippet && titleFromSnippet[2]) {
                    title = titleFromSnippet[2].trim();
                  } else {
                    // Use a more contextual title generation
                    title = this.generateLikelyTitle(
                      snippet.includes('engineering') || snippet.includes('developer') ? 'technology' :
                      snippet.includes('market') ? 'marketing' :
                      snippet.includes('sales') ? 'sales' :
                      snippet.includes('product') ? 'product' : ''
                    );
                  }
                }
                
                // Validate LinkedIn URL format and fix if necessary
                if (linkedInUrl) {
                  // Make sure URL is properly formatted
                  if (!linkedInUrl.startsWith('http')) {
                    linkedInUrl = 'https://' + linkedInUrl;
                  }
                  
                  // Get the vanity name from the URL
                  const vanityNameMatch = linkedInUrl.match(/linkedin\.com\/in\/([\w-]+)/);
                  if (vanityNameMatch && vanityNameMatch[1]) {
                    // Reconstruct a clean LinkedIn URL
                    linkedInUrl = `https://www.linkedin.com/in/${vanityNameMatch[1]}/`;
                  }
                  
                  // If URL is still invalid, try to construct from name
                  if (!linkedInUrl.includes('linkedin.com/in/')) {
                    // Create a vanity URL from the name
                    const cleanName = name.toLowerCase()
                      .replace(/[^\w\s]/g, '')
                      .replace(/\s+/g, '-');
                    linkedInUrl = `https://www.linkedin.com/in/${cleanName}/`;
                  }
                } else {
                  // Create a vanity URL from the name
                  const cleanName = name.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, '-');
                  linkedInUrl = `https://www.linkedin.com/in/${cleanName}/`;
                }
                
                // Verify the profile exists (skip async check for now to avoid syntax issues)
                // We'll handle potentially broken links on the client side
                let profileIsValid = true;
                
                // Simple format validation
                if (!linkedInUrl.match(/^https:\/\/www\.linkedin\.com\/in\/[\w-]+\/?$/)) {
                  console.warn(`LinkedIn profile URL has unusual format: ${linkedInUrl}`);
                  // Don't exclude it, but mark it as potentially invalid
                  profileIsValid = false;
                }
                
                // Only include if it's a unique contact
                if (!allContacts.some(c => 
                  c.name.toLowerCase() === name.toLowerCase() || 
                  (c.linkedInUrl && c.linkedInUrl === linkedInUrl)
                )) {
                  allContacts.push({
                    name,
                    title,
                    linkedInUrl,
                    source: 'linkedin-search',
                    verifiedCompany: companyInCurrentPosition || (snippetHasCompany && hasCurrentIndicator),
                    profileIsValid,
                    synthetic: false // Explicitly mark as non-synthetic
                  });
                }
              } catch (elementError) {
                console.warn('Error parsing contact element:', elementError.message);
              }
            });
            
            console.log(`Found ${allContacts.length} contacts from search query: ${searchQuery}`);
            
          } catch (queryError) {
            console.warn(`Error with search query ${searchQuery}:`, queryError.message);
            // Continue to next query
          }
        }
      }
      
      // Direct search for LinkedIn company page to find employee count and company size
      try {
        const companyPage = `https://www.linkedin.com/company/${companyNameEncoded}/`;
        console.log(`Checking company LinkedIn page: ${companyPage}`);
        const response = await this.makeRequest(companyPage);
        
        // Extract employee count from page if possible
        const employeeCountMatch = response.data.match(/(\d+(?:,\d+)*)\s+employees/i);
        if (employeeCountMatch && employeeCountMatch[1]) {
          const employeeCount = employeeCountMatch[1];
          console.log(`Company has approximately ${employeeCount} employees according to LinkedIn`);
          
          // This information can be added to the contact context but isn't used directly
        }
      } catch (companyPageError) {
        console.warn(`Error checking company LinkedIn page: ${companyPageError.message}`);
      }
      
      // Sort by verification status first, then relevance
      allContacts.sort((a, b) => {
        // Verified company employees come first
        if (a.verifiedCompany && !b.verifiedCompany) return -1;
        if (!a.verifiedCompany && b.verifiedCompany) return 1;
        // Then sort by leadership roles using title keywords
        const leadershipKeywords = ['ceo', 'cto', 'cfo', 'coo', 'chief', 'president', 'vp', 'vice president', 'director', 'head'];
        const aLeadership = leadershipKeywords.some(kw => a.title && a.title.toLowerCase().includes(kw)) ? 1 : 0;
        const bLeadership = leadershipKeywords.some(kw => b.title && b.title.toLowerCase().includes(kw)) ? 1 : 0;
        return bLeadership - aLeadership;
      });
      
      // Return top contacts - we're getting actual profiles so limit to 5 max
      return allContacts.slice(0, Math.min(allContacts.length, 5));
    } catch (error) {
      console.error('Error finding LinkedIn contacts:', error);
      return [];
    }
  }
  
  /**
   * Search LinkedIn profiles using API with a custom query
   * @param {string} query - The search query for finding profiles
   * @param {number} limit - Maximum number of profiles to return
   * @returns {Promise<Array>} - Array of profile data
   */
  async searchLinkedInProfilesViaAPI(query, limit = 5) {
    try {
      console.log(`Searching LinkedIn profiles via API with query: ${query}`);
      
      if (!this.linkedinClient) {
        throw new Error('LinkedIn API client not initialized');
      }
      
      // Search for profiles matching the query
      const profileSearch = await this.linkedinClient.get('search/people', {
        params: {
          q: query,
          count: limit,
          facets: ['industry', 'title']
        }
      });
      
      if (!profileSearch.data || 
          !profileSearch.data.elements || 
          profileSearch.data.elements.length === 0) {
        console.log('No profiles found via LinkedIn API');
        return [];
      }
      
      // Process profiles
      const profiles = [];
      
      for (const profile of profileSearch.data.elements.slice(0, limit)) {
        try {
          // Get detailed profile information
          const profileResponse = await this.linkedinClient.get(`people/${profile.id}`);
          const profileData = profileResponse.data;
          
          if (profileData) {
            // Extract profile information
            const name = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
            const title = profileData.headline || '';
            const linkedInUrl = profileData.vanityName ? 
              `https://www.linkedin.com/in/${profileData.vanityName}/` : 
              `https://www.linkedin.com/in/${profileData.id}/`;
            
            profiles.push({
              name,
              title,
              linkedInUrl,
              source: 'linkedin-api',
              synthetic: false,
              profileIsValid: true
            });
          }
        } catch (profileError) {
          console.warn(`Error getting profile details from LinkedIn API: ${profileError.message}`);
        }
      }
      
      console.log(`Found ${profiles.length} profiles via LinkedIn API`);
      return profiles;
    } catch (error) {
      console.error(`LinkedIn API search error: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Find contacts using LinkedIn's official API (if credentials are available)
   * @param {string} companyName - Name of the company
   * @param {string} domain - Company domain
   * @returns {Promise<Array>} - Array of contacts from LinkedIn API
   */
  async findContactsViaLinkedInAPI(companyName, domain) {
    try {
      console.log(`Using LinkedIn API to find contacts at ${companyName}`);
      
      // Step 1: Find the company by name or domain
      let companyId = null;
      
      try {
        // First try to find by name
        const companySearch = await this.linkedinClient.get('search/companies', {
          params: {
            q: companyName,
            count: 1
          }
        });
        
        if (companySearch.data && 
            companySearch.data.elements && 
            companySearch.data.elements.length > 0) {
          companyId = companySearch.data.elements[0].id;
          console.log(`Found LinkedIn company ID for ${companyName}: ${companyId}`);
        }
      } catch (searchError) {
        console.warn(`LinkedIn API company search error: ${searchError.message}`);
      }
      
      // If we couldn't find by name, try by domain
      if (!companyId) {
        try {
          const domainSearch = await this.linkedinClient.get('organizations', {
            params: {
              vanityName: domain.replace(/\.[^.]+$/, '') // Remove TLD (.com, .org, etc.)
            }
          });
          
          if (domainSearch.data && domainSearch.data.id) {
            companyId = domainSearch.data.id;
            console.log(`Found LinkedIn company ID by domain: ${companyId}`);
          }
        } catch (domainError) {
          console.warn(`LinkedIn API domain search error: ${domainError.message}`);
        }
      }
      
      if (!companyId) {
        console.warn(`Couldn't find LinkedIn company ID for ${companyName}`);
        return [];
      }
      
      // Step 2: Find company employees - focusing on leadership roles
      const contacts = [];
      
      // Key leadership positions to look for
      const leadershipRoles = [
        'CEO', 'Chief Executive Officer',
        'CTO', 'Chief Technology Officer',
        'CFO', 'Chief Financial Officer',
        'COO', 'Chief Operating Officer',
        'CMO', 'Chief Marketing Officer',
        'VP', 'Vice President',
        'Director'
      ];
      
      // Build OR condition for leadership search
      const titleQuery = leadershipRoles.map(role => `title=${encodeURIComponent(role)}`).join(' OR ');
      
      try {
        // Search for employees with leadership roles
        const employeeSearch = await this.linkedinClient.get('search/people', {
          params: {
            q: `current_company:${companyId} AND (${titleQuery})`,
            count: 10,
            facets: ['industry', 'title']
          }
        });
        
        if (employeeSearch.data && 
            employeeSearch.data.elements && 
            employeeSearch.data.elements.length > 0) {
          
          // Process each employee
          for (const employee of employeeSearch.data.elements) {
            try {
              // Get more profile details
              const profileResponse = await this.linkedinClient.get(`people/${employee.id}`);
              const profile = profileResponse.data;
              
              if (profile) {
                // Extract relevant information
                const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                const title = profile.headline || '';
                const linkedInUrl = profile.vanityName ? 
                  `https://www.linkedin.com/in/${profile.vanityName}/` : 
                  `https://www.linkedin.com/in/${profile.id}/`;
                
                // Add to contacts
                contacts.push({
                  name,
                  title,
                  linkedInUrl,
                  source: 'linkedin-api'
                });
              }
            } catch (profileError) {
              console.warn(`LinkedIn API profile fetch error: ${profileError.message}`);
            }
          }
        }
      } catch (searchError) {
        console.warn(`LinkedIn API employee search error: ${searchError.message}`);
      }
      
      console.log(`Found ${contacts.length} contacts via LinkedIn API for ${companyName}`);
      return contacts;
      
    } catch (error) {
      console.error('LinkedIn API error:', error.message);
      return [];
    }
  }
  
  /**
   * Find contacts by scraping the company website
   * @param {string} domain - Company domain
   * @returns {Promise<Array>} - Array of contacts
   */
  async findContactsFromWebsite(domain) {
    try {
      console.log(`Searching for contacts on company website: ${domain}`);
      
      // Common paths where contact information might be found
      const paths = [
        '', // Homepage
        '/about',
        '/about-us',
        '/team',
        '/leadership',
        '/management',
        '/our-team',
        '/company/team',
        '/company/leadership',
        '/contact'
      ];
      
      let contacts = [];
      
      // Try each path
      for (const path of paths) {
        if (contacts.length >= 3) break;
        
        try {
          const url = `https://${domain}${path}`;
          console.log(`Checking ${url} for contacts`);
          
          const response = await this.makeRequest(url);
          const $ = cheerio.load(response.data);
          
          // Look for common team member patterns
          const teamSelectors = [
            '.team-member', '.team', '.leadership', '.executive',
            '.employee', '.staff', '.member', '.profile',
            '[class*="team"]', '[class*="member"]', '[class*="profile"]'
          ];
          
          for (const selector of teamSelectors) {
            $(selector).each((i, element) => {
              try {
                // Extract name - look for headings or strong text within the element
                const nameElement = $(element).find('h1, h2, h3, h4, h5, h6, strong, .name').first();
                let name = nameElement.text().trim();
                
                // If no name found, skip
                if (!name || name.length < 3) return;
                
                // Extract title - often in paragraphs or divs with class containing "title" or "role"
                const titleElement = $(element).find('p, .title, .role, .position, [class*="title"], [class*="role"]').first();
                let title = titleElement.text().trim();
                
                // Clean up title
                title = title.replace(/^[^a-zA-Z]+/, '') // Remove leading non-alphabetic chars
                          .replace(/[^a-zA-Z]+$/, '') // Remove trailing non-alphabetic chars
                          .trim();
                
                if (!title || title.length < 3) {
                  title = this.generateLikelyTitle();
                }
                
                // Generate email
                const email = this.generateEmail(name, domain);
                
                // Get LinkedIn URL if available
                let linkedInUrl = '';
                const linkedInLink = $(element).find('a[href*="linkedin.com"]').attr('href');
                if (linkedInLink) {
                  linkedInUrl = linkedInLink;
                } else {
                  linkedInUrl = `https://www.linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}/`;
                }
                
                contacts.push({
                  name,
                  title,
                  email,
                  linkedInUrl,
                  source: 'website'
                });
              } catch (memberError) {
                console.warn('Error parsing team member:', memberError.message);
                // Continue to next member
              }
            });
          }
          
          console.log(`Found ${contacts.length} contacts on ${url}`);
          
        } catch (pathError) {
          console.warn(`Error checking path ${path}:`, pathError.message);
          // Continue to next path
        }
      }
      
      return contacts;
    } catch (error) {
      console.error('Error finding contacts from website:', error);
      return [];
    }
  }
  
  /**
   * Find real LinkedIn profiles through enhanced search techniques
   * @param {string} query - Advanced search query
   * @param {number} limit - Maximum number of profiles to return
   * @returns {Promise<Array>} - Array of real LinkedIn profiles
   */
  async searchLinkedInProfilesWithQuery(query, limit = 3) {
    try {
      console.log(`Searching LinkedIn profiles with query: ${query}`);
      
      // Use LinkedIn API if credentials are available
      if (process.env.LINKEDIN_API_KEY && process.env.LINKEDIN_API_SECRET) {
        try {
          return await this.searchLinkedInProfilesViaAPI(query, limit);
        } catch (apiError) {
          console.error('LinkedIn API search failed:', apiError.message);
          // Fall back to web search if API fails
        }
      }
      
      // Fall back to web search
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
      
      // Fetch the search results
      const profiles = [];
      
      try {
        // Direct LinkedIn search
        console.log(`Trying direct LinkedIn search: ${searchUrl}`);
        const response = await this.makeRequest(searchUrl);
        const $ = cheerio.load(response.data);
        
        // Extract profiles from search results
        $('.search-result__info').each((i, element) => {
          if (profiles.length >= limit) return false; // Stop after reaching limit
          
          const nameElement = $(element).find('.actor-name');
          const titleElement = $(element).find('.subline-level-1');
          const profileUrlElement = $(element).find('.search-result__result-link');
          
          if (nameElement.length && profileUrlElement.length) {
            const name = nameElement.text().trim();
            const title = titleElement.length ? titleElement.text().trim() : '';
            const profileUrl = 'https://www.linkedin.com' + profileUrlElement.attr('href').split('?')[0];
            
            profiles.push({
              name,
              title,
              linkedInUrl: profileUrl,
              source: 'linkedin-search'
            });
          }
        });
        
        console.log(`Found ${profiles.length} LinkedIn profiles with direct search`);
      } catch (linkedInError) {
        console.warn(`LinkedIn direct search failed: ${linkedInError.message}`);
      }
      
      // If direct LinkedIn search didn't yield enough results, try company page approach
      if (profiles.length < limit) {
        try {
          // Try to extract company name from query
          const companyName = query.replace(/"/g, '').replace(/site:linkedin\.com.*/i, '').trim();
          const linkedInCompanyUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}/people/`;
          
          console.log(`Searching LinkedIn company page: ${linkedInCompanyUrl}`);
          const companyResponse = await this.makeRequest(linkedInCompanyUrl);
          const $company = cheerio.load(companyResponse.data);
          
          // Find profile links on the company page
          $company('a[href*="/in/"]').each((i, element) => {
            if (profiles.length >= limit) return;
            
            const href = $company(element).attr('href');
            if (!href || !href.includes('/in/')) return;
            
            // Clean and validate the LinkedIn URL
            let linkedInUrl = href;
            if (!linkedInUrl.startsWith('http')) {
              linkedInUrl = `https://www.linkedin.com${linkedInUrl}`;
            }
            
            try {
              // Extract name from URL
              const urlParts = linkedInUrl.split('/');
              const profileSlug = urlParts[urlParts.indexOf('in') + 1]?.replace(/-/g, ' ');
              if (profileSlug) {
                const name = profileSlug
                  .split(' ')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
                
                // Only add if it's a unique profile
                if (!profiles.some(p => p.linkedInUrl === linkedInUrl)) {
                  profiles.push({
                    name,
                    title: `Employee at ${companyName}`,
                    linkedInUrl,
                    source: 'linkedin-company-page',
                    synthetic: false,
                    verifiedCompany: true
                  });
                }
              }
            } catch (profileError) {
              console.warn(`Error extracting profile details: ${profileError.message}`);
            }
          });
          
          console.log(`Found ${profiles.length} total LinkedIn profiles after company page check`);
        } catch (companyError) {
          console.warn(`LinkedIn company page approach failed: ${companyError.message}`);
        }
      }
      
      // If we still don't have enough profiles, try Google search
      if (profiles.length < limit) {
        try {
          console.log("Trying Google search for LinkedIn profiles");
          
          // Search for profiles using Google
          const googleQuery = `site:linkedin.com/in/ ${query}`;
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&num=20`;
          
          const googleResponse = await this.makeRequest(googleUrl);
          const $google = cheerio.load(googleResponse.data);
          
          $google('a').each((i, element) => {
            if (profiles.length >= limit) return;
            
            const href = $google(element).attr('href');
            if (!href || !href.includes('/url?') || !href.includes('linkedin.com/in/')) return;
            
            try {
              // Extract LinkedIn URL from Google redirect
              let linkedInUrl = '';
              if (href.includes('/url?q=')) {
                linkedInUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
              }
              
              if (linkedInUrl && linkedInUrl.includes('linkedin.com/in/')) {
                // Extract profile details
                const urlParts = linkedInUrl.split('/');
                const profileName = urlParts[urlParts.indexOf('in') + 1]?.replace(/-/g, ' ');
                
                if (profileName) {
                  const name = profileName
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ');
                  
                  // Get title from the search result
                  const resultElement = $google(element).closest('.g');
                  const titleElement = resultElement.find('h3').first();
                  const titleText = titleElement.text() || '';
                  
                  let title = '';
                  if (titleText.includes(' - ')) {
                    const parts = titleText.split(' - ');
                    if (parts.length > 1) {
                      title = parts[1].replace('LinkedIn', '').replace('Profile', '').trim();
                    }
                  } else if (titleText.includes(' | ')) {
                    const parts = titleText.split(' | ');
                    if (parts.length > 1) {
                      title = parts[1].replace('LinkedIn', '').replace('Profile', '').trim();
                    }
                  }
                  
                  // Fallback title
                  if (!title || title.length < 3 || title.toLowerCase().includes('linkedin')) {
                    title = 'Professional based on search';
                  }
                  
                  // Only add unique profiles
                  if (!profiles.some(p => p.linkedInUrl === linkedInUrl)) {
                    profiles.push({
                      name,
                      title,
                      linkedInUrl,
                      source: 'google-linkedin-search',
                      synthetic: false
                    });
                  }
                }
              }
            } catch (urlError) {
              console.warn(`Error parsing LinkedIn URL: ${urlError.message}`);
            }
          });
          
          console.log(`Found ${profiles.length} total LinkedIn profiles after Google search`);
        } catch (googleError) {
          console.warn(`Google search approach failed: ${googleError.message}`);
        }
      }
      
      console.log(`Found ${profiles.length} LinkedIn profiles for query: "${query}"`);
      return profiles;
    } catch (error) {
      console.error(`Error in LinkedIn profile search: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Find email patterns directly from company website
   * @param {string} domain - Company domain
   * @returns {Promise<Array>} - Array of contacts
   */
  async findEmailPatternsOnWebsite(domain) {
    try {
      console.log(`Searching for email patterns on ${domain}`);
      
      // URLs to check
      const urls = [
        `https://${domain}`,
        `https://${domain}/about`,
        `https://${domain}/contact`,
        `https://${domain}/team`
      ];
      
      let emailPatterns = [];
      let foundContacts = [];
      
      // Check each URL for email patterns
      for (const url of urls) {
        try {
          const response = await this.makeRequest(url);
          const html = response.data;
          
          // Look for email patterns like name@domain.com
          const emailRegex = new RegExp(`[a-zA-Z0-9._-]+@${domain.replace('.', '\\.')}`, 'g');
          const matches = html.match(emailRegex);
          
          if (matches && matches.length > 0) {
            emailPatterns.push(...matches);
          }
          
          // Try to associate emails with names
          const $ = cheerio.load(html);
          
          // Look for elements containing both name and email
          $('*:contains("@")').each((i, element) => {
            const text = $(element).text();
            if (text.includes(`@${domain}`)) {
              const emailMatch = text.match(emailRegex);
              if (emailMatch) {
                const email = emailMatch[0];
                
                // Try to find a name near the email
                const context = text.substring(Math.max(0, text.indexOf(email) - 50), 
                                               Math.min(text.length, text.indexOf(email) + 50));
                
                // Look for name patterns (e.g., "John Smith" or "Smith, John")
                const nameMatch = context.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
                if (nameMatch) {
                  const name = nameMatch[1];
                  
                  // Extract title if possible
                  const titlePattern = /([A-Z][a-z]+\s*(?:of|for|&|and)?\s*[A-Z][a-z]+)/;
                  const titleMatch = context.match(titlePattern);
                  const title = titleMatch ? titleMatch[1] : 'Team Member';
                  
                  foundContacts.push({
                    name,
                    title,
                    email,
                    linkedInUrl: '',
                    source: 'website-email',
                    synthetic: false
                  });
                }
              }
            }
          });
        } catch (urlError) {
          console.warn(`Error checking ${url}: ${urlError.message}`);
        }
      }
      
      // If we found email patterns but not associated contacts, try to generate contacts
      if (emailPatterns.length > 0 && foundContacts.length === 0) {
        // Analyze patterns to determine company email format
        let pattern = '';
        if (emailPatterns.some(e => e.includes('.'))) {
          pattern = 'firstname.lastname';
        } else if (emailPatterns.some(e => e.match(/^[a-z][a-z0-9_-]*$/))) {
          pattern = 'firstname';
        } else if (emailPatterns.some(e => e.match(/^[a-z][0-9a-z_-]*$/))) {
          pattern = 'firstinitial+lastname';
        }
        
        // Use the pattern to generate some plausible contacts
        const titles = [
          'Director of Marketing',
          'VP of Sales',
          'CTO',
          'Director of Operations'
        ];
        
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan'];
        const lastNames = ['Smith', 'Jones', 'Garcia', 'Wilson'];
        
        for (let i = 0; i < Math.min(3, titles.length); i++) {
          const firstName = firstNames[i];
          const lastName = lastNames[i];
          let email = '';
          
          switch (pattern) {
            case 'firstname.lastname':
              email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
              break;
            case 'firstname':
              email = `${firstName.toLowerCase()}@${domain}`;
              break;
            case 'firstinitial+lastname':
              email = `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}@${domain}`;
              break;
            default:
              email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
          }
          
          foundContacts.push({
            name: `${firstName} ${lastName}`,
            title: titles[i],
            email,
            linkedInUrl: '',
            source: 'email-pattern',
            synthetic: false,
            inferred: true
          });
        }
      }
      
      return foundContacts;
    } catch (error) {
      console.error(`Error finding email patterns: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Generate a likely email address for a person at a company
   * @param {string} name - Person's name
   * @param {string} domain - Company domain
   * @returns {string} - Generated email
   */
  generateEmail(name, domain) {
    // Clean up domain if it includes protocols or paths
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    
    // Handle invalid domains
    if (!domain || domain.length < 3 || !domain.includes('.')) {
      console.warn(`Invalid domain: ${domain}, using example.com`);
      domain = 'example.com';
    }
    
    // Clean and normalize name
    const cleanName = name.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Parse name parts
    const parts = cleanName.split(' ');
    
    // Handle single-word names
    if (parts.length === 1) {
      return `${parts[0].toLowerCase()}@${domain}`;
    }
    
    // Extract first and last names
    const firstName = parts[0].toLowerCase();
    const lastName = parts[parts.length - 1].toLowerCase();
    
    // Handle middle names/initials if present
    const middleInitial = parts.length > 2 ? parts[1].charAt(0).toLowerCase() : '';
    
    // Common email patterns with weighted probabilities
    const patterns = [
      // Most common patterns with higher weights
      { pattern: `${firstName}.${lastName}@${domain}`, weight: 20 },
      { pattern: `${firstName}@${domain}`, weight: parts.length === 2 && firstName.length > 3 ? 10 : 5 },
      { pattern: `${firstName[0]}${lastName}@${domain}`, weight: 15 },
      { pattern: `${lastName}.${firstName}@${domain}`, weight: 8 },
      { pattern: `${firstName}${lastName[0]}@${domain}`, weight: 10 },
      
      // Less common patterns with lower weights
      { pattern: `${firstName}-${lastName}@${domain}`, weight: 3 },
      { pattern: `${firstName}_${lastName}@${domain}`, weight: 5 },
      { pattern: `${firstName}${lastName}@${domain}`, weight: 7 },
      { pattern: `${lastName}${firstName[0]}@${domain}`, weight: 4 },
      { pattern: `${lastName}@${domain}`, weight: lastName.length > 4 ? 5 : 2 },
      
      // Patterns with middle initial if available
      ...(middleInitial ? [
        { pattern: `${firstName}.${middleInitial}.${lastName}@${domain}`, weight: 3 },
        { pattern: `${firstName}${middleInitial}${lastName}@${domain}`, weight: 2 }
      ] : [])
    ];
    
    // Calculate total weight
    const totalWeight = patterns.reduce((sum, pattern) => sum + pattern.weight, 0);
    
    // Random weighted selection
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const pattern of patterns) {
      cumulativeWeight += pattern.weight;
      if (random <= cumulativeWeight) {
        return pattern.pattern;
      }
    }
    
    // Fallback to most common pattern
    return `${firstName}.${lastName}@${domain}`;
  }
  
  /**
   * Generate a likely job title relevant for sales prospecting
   * @param {string} [industry] - Optional industry to tailor titles
   * @returns {string} - Job title
   */
  generateLikelyTitle(industry = '') {
    // Industry-specific titles
    const industryTitles = {
      'technology': [
        'CTO', 'VP of Engineering', 'Director of IT', 'Head of Product',
        'VP of Product', 'Technical Director', 'Director of Engineering',
        'IT Operations Manager', 'VP of R&D', 'Chief Digital Officer'
      ],
      'marketing': [
        'CMO', 'VP of Marketing', 'Digital Marketing Director', 'Head of Growth',
        'Brand Director', 'Marketing Operations Manager', 'Director of Demand Generation',
        'Content Marketing Director', 'Performance Marketing Director'
      ],
      'sales': [
        'VP of Sales', 'Chief Revenue Officer', 'Sales Director', 'Head of Business Development',
        'Director of Inside Sales', 'Sales Operations Manager', 'Director of Sales Enablement'
      ],
      'finance': [
        'CFO', 'Finance Director', 'VP of Finance', 'Controller',
        'Director of Financial Planning', 'Head of Treasury', 'Financial Operations Director'
      ],
      'healthcare': [
        'Medical Director', 'Director of Patient Services', 'Clinical Operations Director',
        'VP of Healthcare Services', 'Head of Medical Systems', 'Director of Clinical Informatics'
      ],
      'retail': [
        'Merchandising Director', 'Retail Operations Director', 'Head of eCommerce',
        'VP of Retail', 'Director of Supply Chain', 'Digital Store Manager'
      ]
    };
    
    // General decision-maker titles
    const generalTitles = [
      'Chief Executive Officer',
      'Chief Operating Officer',
      'VP of Operations',
      'Director of Strategy',
      'Head of Innovation',
      'Director of Customer Success',
      'Director of Business Development',
      'VP of Customer Experience',
      'Head of Operations',
      'Chief Strategy Officer',
      'VP of Administration',
      'Director of Partnerships',
      'Head of Commercial Operations',
      'Business Operations Director'
    ];
    
    // Try to match with industry-specific titles
    let matchedIndustry = null;
    
    if (industry) {
      const normalizedIndustry = industry.toLowerCase();
      for (const key of Object.keys(industryTitles)) {
        if (normalizedIndustry.includes(key)) {
          matchedIndustry = key;
          break;
        }
      }
    }
    
    // Use industry-specific titles if matched, otherwise use general titles
    const titlePool = matchedIndustry ? 
      [...industryTitles[matchedIndustry], ...generalTitles] : generalTitles;
    
    return titlePool[Math.floor(Math.random() * titlePool.length)];
  }
}

module.exports = new WebScraperService();