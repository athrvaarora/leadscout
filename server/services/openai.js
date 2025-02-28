const { OpenAI } = require('openai');

// Initialize OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Service for OpenAI API interactions
 * Provides methods for generating content using various OpenAI models
 */
class OpenAIService {
  constructor() {
    this.client = openai;
    console.log('OpenAI service initialized');
  }

  /**
   * Generate a text completion using OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {string} model - The model to use (default: gpt-3.5-turbo)
   * @param {number} maxTokens - Maximum tokens to generate
   * @param {number} temperature - Randomness of output (0-1)
   * @returns {Promise<string>} - Generated content
   */
  async generateCompletion(prompt, model = 'gpt-3.5-turbo', maxTokens = 800, temperature = 0.7) {
    try {
      console.log(`Generating completion using model: ${model}`);
      
      // No timeout for OpenAI requests
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "You are a helpful assistant specializing in business analysis and sales prospecting." },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      });
      
      if (response && response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      }
      
      throw new Error('No completion generated');
    } catch (error) {
      console.error('OpenAI completion error:', error.message);
      throw error;
    }
  }

  /**
   * Generate a JSON-structured completion using OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {string} model - The model to use (default: gpt-3.5-turbo)
   * @param {number} maxTokens - Maximum tokens to generate
   * @param {number} temperature - Randomness of output (0-1)
   * @returns {Promise<Object>} - Generated content as JSON
   */
  async generateJSONCompletion(prompt, model = 'gpt-3.5-turbo', maxTokens = 800, temperature = 0.5) {
    try {
      console.log(`Generating JSON completion using model: ${model}`);
      
      // No timeout for OpenAI JSON requests
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "You are a helpful assistant that responds with JSON objects. Always format your response as valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: temperature
      });
      
      if (response && response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        return JSON.parse(content);
      }
      
      throw new Error('No JSON completion generated');
    } catch (error) {
      console.error('OpenAI JSON completion error:', error.message);
      throw error;
    }
  }
  
  /**
   * Identify target industries for a product
   * @param {string} productName - Name of the product
   * @param {string} productDescription - Description of the product
   * @param {string} providedIndustry - Industry provided by the user (optional)
   * @param {boolean} useEnhancedPrompt - Whether to use enhanced prompt engineering
   * @returns {Promise<string[]>} - Array of target industries
   */
  async identifyTargetIndustries(productName, productDescription, providedIndustry = '', useEnhancedPrompt = true) {
    try {
      console.log(`Identifying target industries for: ${productName}`);
      
      const basePrompt = `
Please analyze this product and identify the 5-7 best target industries for it.

Product Name: ${productName}
Product Description: ${productDescription}
${providedIndustry ? `User-provided Industry: ${providedIndustry}` : ''}

Based on the product description, list the 5-7 target industries that would be most likely to purchase this product. If the user provided an industry, consider it but don't be limited by it if the product seems more suited to other industries.`;

      const enhancedPrompt = `
You are a senior B2B sales and market research expert with 15+ years of experience in identifying ideal target markets for products. Your task is to analyze this product and identify the 5-7 most promising target industries.

Product Name: ${productName}
Product Description: ${productDescription}
${providedIndustry ? `Initial Industry Suggestion: ${providedIndustry}` : ''}

ANALYSIS INSTRUCTIONS:
1. First, extract the key features and benefits of this product
2. Identify specific pain points that this product addresses
3. Consider company size, decision-making structure, and budget required
4. Determine industries with the highest need for these benefits
5. Prioritize industries with shorter sales cycles and easier entry
6. Factor in the technical complexity required for implementation
7. Consider if the product is a physical item or software/service

Based on your comprehensive analysis, list the 5-7 target industries that would be most likely to purchase this product. If an initial industry was suggested, evaluate it objectively but don't be limited by it.`;

      const formatInstructions = `
FORMAT: Respond with valid JSON containing an array of strings with industry names.
Example format: 
{
  "industries": ["Industry 1", "Industry 2", "Industry 3", "Industry 4", "Industry 5"]
}

Choose specific industries rather than broad categories. Make sure the industries are commercially viable markets. Use proper capitalization.
`;

      const prompt = (useEnhancedPrompt ? enhancedPrompt : basePrompt) + formatInstructions;
      
      const completion = await this.generateJSONCompletion(prompt, 'gpt-3.5-turbo', 600, 0.3);
      
      // Log the raw response to better debug issues
      console.log('Raw OpenAI response:', JSON.stringify(completion));
      
      // Check if we got a valid array of industries
      if (completion && completion.industries && Array.isArray(completion.industries)) {
        if (completion.industries.length >= 3) {
          return completion.industries;
        }
      } else if (completion && Array.isArray(completion)) {
        if (completion.length >= 3) {
          return completion;
        }
      }
      
      // If we reach here, try to extract an array from the response
      if (completion && typeof completion === 'object') {
        // Look for any property that contains an array
        for (const key in completion) {
          if (Array.isArray(completion[key]) && completion[key].length >= 3) {
            console.log(`Found array in property: ${key}`);
            return completion[key];
          }
        }
      }
      
      throw new Error('Invalid industry list format returned');
    } catch (error) {
      console.error('Industry identification error:', error.message);
      throw error;
    }
  }
  
  /**
   * Find relevant companies that might be interested in a product
   * @param {string} productName - Name of the product
   * @param {string} productDescription - Description of the product
   * @param {string[]} targetIndustries - Target industries for the product
   * @returns {Promise<Object[]>} - Array of company objects
   */
  async findRelevantCompanies(productName, productDescription, targetIndustries) {
    try {
      console.log(`Finding relevant companies for: ${productName}`);
      
      // First, analyze the product to understand its key features and benefits with an enhanced prompt
      const analysisPrompt = `
You are a senior market analyst specializing in B2B customer discovery with expertise in identifying ideal customer profiles and target markets.

TASK: Analyze this product to create a comprehensive profile of its ideal customer base.

Product Name: ${productName}
Product Description: ${productDescription}
Target Industries: ${targetIndustries.join(', ')}

DETAILED ANALYSIS REQUIRED:
1. Key Problems and Pain Points:
   - Identify the 5-7 most significant problems this product solves
   - Rate each problem on urgency (1-10) and pervasiveness (1-10)
   - Note which problems are unique to specific industries

2. Value Proposition and Benefits:
   - List the 5-7 most compelling benefits this product provides
   - Indicate which benefits have the strongest ROI or measurable outcomes
   - Describe how these benefits address the identified problems

3. Ideal Customer Profile:
   - Company size range (revenue, employee count)
   - Decision-making structure and key stakeholders
   - Technology adoption profile (early adopter, mainstream, conservative)
   - Budget considerations and purchasing patterns
   - Geographic considerations (if any)

4. Search Intelligence:
   - High-value search keywords for finding companies with these needs
   - Industry-specific terminology that indicates buying intent
   - Technical terms that would appear on company websites
   - Titles of decision-makers most likely to purchase

FORMAT: Provide your analysis as a valid JSON object with these keys:
{
  "problems": ["problem 1", "problem 2", ...],
  "benefits": ["benefit 1", "benefit 2", ...],
  "companyProfile": "detailed description of ideal company profile",
  "searchKeywords": ["keyword 1", "keyword 2", ...],
  "decisionMakers": ["title 1", "title 2", ...],
  "buyingSignals": ["signal 1", "signal 2", ...]
}
`;
      
      const analysis = await this.generateJSONCompletion(analysisPrompt, 'gpt-3.5-turbo', 800, 0.3);
      console.log('Product analysis:', JSON.stringify(analysis));
      
      // Use the analysis to create a more targeted company search with the enhanced prompt
      const companyPrompt = `
You are an expert B2B sales lead researcher with access to a global company database. Your task is to identify the most promising target companies for this product.

PRODUCT DETAILS:
Product Name: ${productName}
Product Description: ${productDescription}
Target Industries: ${targetIndustries.join(', ')}

CUSTOMER PROFILE ANALYSIS:
Problems the product solves: ${analysis?.problems?.join(', ') || 'Efficiency, automation, personalization'}
Benefits it provides: ${analysis?.benefits?.join(', ') || 'Time savings, better results, improved workflow'}
Ideal company profile: ${analysis?.companyProfile || 'Medium to large companies with dedicated teams'}
Decision makers: ${analysis?.decisionMakers?.join(', ') || 'CTO, Director of Operations, VP of Technology'}
Buying signals: ${analysis?.buyingSignals?.join(', ') || 'Looking for solutions, evaluating options, scaling operations'}

CRITICAL REQUIREMENTS - YOU MUST:
1. ONLY list actual registered business entities, not generic service categories or descriptive phrases
2. Verify that each company has a legitimate web presence and corporate structure
3. Exclude any result that is not a specific company name (e.g., "AI in Healthcare" is NOT a company)
4. Focus on established enterprises, scale-ups, and recognized startups with actual market presence

PROPER COMPANY EXAMPLES:
✓ "Microsoft Corporation" - Real company with specific name
✓ "Salesforce, Inc." - Real company with specific name
✓ "Zendesk" - Real company with specific name

INVALID NON-COMPANY EXAMPLES (DO NOT INCLUDE THESE TYPES):
✗ "Artificial Intelligence Solutions" - Generic service category
✗ "Machine Learning Services" - Generic service category 
✗ "AI in Finance" - Topic/category, not a company
✗ "Free AI Tools" - Generic product category
✗ "Why AI Projects Fail" - Content topic, not a company

For each company, provide:
1. Company name (verified real companies only)
2. Industry they operate in (most relevant from the target industries)
3. A detailed description of what they do and specifically why they would need this product
4. Their website domain (e.g., "company.com")
5. A data-driven relevance score from 70-95 indicating likelihood of product fit
6. At least one specific reason why this product addresses their particular needs

FORMAT: Respond with valid JSON containing an array of company objects like:
{
  "companies": [
    {
      "name": "Company Name",
      "industry": "Industry",
      "description": "Detailed description of what they do and specific reasons why they need this product",
      "website": "company.com",
      "relevanceScore": 85,
      "fitReason": "Specific reason why this product is a good fit"
    },
    ...
  ]
}

I NEED REAL COMPANIES ONLY - not descriptions, guides, topics, or generic services. Verify each entity is an actual business before including it.
DIVERSIFY your results across different industries, company sizes, and regions. 
Each company must have a registered business name and legitimate web presence.
`;
      
      const completion = await this.generateJSONCompletion(companyPrompt, 'gpt-3.5-turbo', 800, 0.7);
      
      // Log the raw response to better debug issues
      console.log('Raw OpenAI companies response:', JSON.stringify(completion));
      
      // Check if we got a valid array of companies
      if (completion && completion.companies && Array.isArray(completion.companies)) {
        return completion.companies;
      } else if (completion && Array.isArray(completion)) {
        return completion;
      }
      
      // If we reach here, try to extract companies array from the response
      if (completion && typeof completion === 'object') {
        // Look for any property that contains an array
        for (const key in completion) {
          if (Array.isArray(completion[key]) && completion[key].length > 0) {
            console.log(`Found companies array in property: ${key}`);
            return completion[key];
          }
        }
      }
      
      throw new Error('Invalid company list format returned');
    } catch (error) {
      console.error('Company discovery error:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate product-focused email templates for contacting a prospect
   * @param {string} userCompany - The user's company name
   * @param {string} prospectCompany - The prospect company name
   * @param {Object} contact - Contact information (name, title, etc.)
   * @param {string} productName - Product name
   * @param {string} productDescription - Product description
   * @returns {Promise<string[]>} - Array of email templates
   */
  async generateEmailTemplates(userCompany, prospectCompany, contact, productName = '', productDescription = '') {
    try {
      console.log(`Generating product-focused email templates for: ${contact?.name || 'unknown contact'} at ${prospectCompany}`);
      
      // Extract product info from params or use defaults
      const product = productName || 'our solution';
      const description = productDescription || 'helps businesses improve efficiency and achieve better results';
      
      // First, get insight into how our product can benefit this company with an enhanced prompt
      const insightPrompt = `
You are a senior sales strategist specializing in B2B outreach and account-based marketing. Your expertise is in analyzing prospect companies and crafting personalized value propositions that resonate with specific decision-makers.

PROSPECT INFORMATION:
Company: ${prospectCompany}
Contact Person: ${contact?.name || 'Unknown'}
Title/Role: ${contact?.title || 'Unknown'}

YOUR PRODUCT:
Name: ${product}
Description: ${description}

COMPREHENSIVE ANALYSIS TASK:
1. Research the prospect company's likely pain points and challenges based on their industry and the contact's role
2. Identify which specific aspects of your product directly address these challenges
3. Analyze the typical decision-making priorities for someone in this contact's position
4. Determine ROI metrics that would be most compelling to this specific contact
5. Create a personalized value narrative tailored to this prospect's situation

Provide a detailed analysis covering:

1. Personalized Benefits:
   - 3 specific, measurable benefits this company could achieve with your product
   - Connect each benefit directly to their likely business outcomes
   - Quantify potential impact when possible (%, time saved, cost reduction)

2. Probable Pain Points:
   - 3 specific challenges this company likely faces that your product addresses
   - Why these pain points are particularly relevant to this company
   - How these challenges impact their business performance

3. Relevant Features to Highlight:
   - 3 product features that would be most valuable to this specific prospect
   - Why each feature matters to this particular contact/role
   - How these features differentiate from alternatives they might consider

4. Strategic Value Proposition:
   - A compelling, concise value statement tailored specifically to this prospect
   - Addresses their unique situation and priorities
   - Focuses on outcomes rather than just product capabilities

FORMAT: Provide your analysis as a valid JSON object with these keys:
{
  "benefits": ["detailed benefit 1 with metrics", "detailed benefit 2 with metrics", "detailed benefit 3 with metrics"],
  "painPoints": ["specific pain point 1", "specific pain point 2", "specific pain point 3"],
  "relevantFeatures": ["key feature 1 and why it matters", "key feature 2 and why it matters", "key feature 3 and why it matters"],
  "valueProposition": "tailored value proposition for this specific prospect",
  "decisionFactors": ["key decision factor 1", "key decision factor 2", "key decision factor 3"]
}
`;
      
      const insight = await this.generateJSONCompletion(insightPrompt, 'gpt-3.5-turbo', 800, 0.3);
      console.log('Product-prospect fit analysis:', JSON.stringify(insight));
      
      // Now create personalized, product-focused email templates with enhanced prompt
      const emailPrompt = `
You are an expert B2B sales copywriter with 10+ years of experience crafting high-converting cold emails. You specialize in writing personalized, benefit-focused sales emails that achieve 30%+ response rates. Your emails are known for being concise, compelling, and focused on prospect-specific value.

TASK: Create 2 distinct, highly personalized cold email templates for this specific prospect.

SENDER INFORMATION:
Your Company: ${userCompany}
Your Product: ${product}
Product Description: ${description}

PROSPECT INFORMATION:
Company: ${prospectCompany}
Contact Name: ${contact?.name || 'Unknown'}
Title: ${contact?.title || 'Unknown'}

RESEARCH-BACKED INSIGHTS:
Key Benefits for This Prospect:
${insight?.benefits?.join('\n') || '- Improved efficiency\n- Better results\n- Cost savings'}

Specific Pain Points They Likely Face:
${insight?.painPoints?.join('\n') || '- Resource constraints\n- Manual processes\n- Lack of insights'}

Most Relevant Features For Them:
${insight?.relevantFeatures?.join('\n') || '- Automation capabilities\n- Advanced analytics\n- Seamless integration'}

Tailored Value Proposition:
${insight?.valueProposition || 'Helping companies like yours achieve better results with less effort'}

Key Decision Factors:
${insight?.decisionFactors?.join('\n') || '- ROI/cost justification\n- Implementation timeline\n- Resource requirements'}

EMAIL WRITING GUIDELINES:
1. SUBJECT LINES: Create compelling, specific subject lines (under 50 characters) that indicate value
2. PERSONALIZATION: Reference their industry, role, or specific challenges in first paragraph
3. VALUE FOCUS: Emphasize outcomes and results over features and specifications
4. SOCIAL PROOF: Include subtle indicators of credibility without seeming boastful
5. BREVITY: Keep body text under 150 words (4-6 concise sentences)
6. CALL TO ACTION: End with clear, low-pressure next step (15-minute exploratory call)
7. TONE: Professional but conversational, confident but not aggressive

FORMAT REQUIREMENTS:
- Begin each template with "Subject:" line
- Use "[Contact's Name]" as name placeholder
- End with signature placeholder: "[Your Name], [Your Position], ${userCompany}"
- Create two distinctly different approaches:
  * TEMPLATE 1: Focus on SPECIFIC benefits and measurable results
  * TEMPLATE 2: Focus on SPECIFIC pain points and how your product solves them

IMPORTANT: Make the emails sound like they were written by a thoughtful human, not an AI. Avoid generic language, corporate jargon, and overly formal phrasing.

Return only the formatted email templates, with no additional text before or after.
`;
      
      const completion = await this.generateCompletion(emailPrompt, 'gpt-3.5-turbo', 800, 0.7);
      console.log('Email completion received, length:', completion?.length || 0);
      
      // Split the completion into separate templates
      if (completion) {
        // First try to extract templates based on "Subject:" marker
        const subjectMatches = [...completion.matchAll(/Subject:/gi)];
        
        if (subjectMatches.length >= 2) {
          const templates = [];
          
          // Extract the templates based on the positions of "Subject:" markers
          for (let i = 0; i < subjectMatches.length && i < 2; i++) {
            const start = subjectMatches[i].index;
            const end = (i < subjectMatches.length - 1) ? subjectMatches[i+1].index : completion.length;
            templates.push(completion.substring(start, end).trim());
          }
          
          if (templates.length >= 2) {
            return templates;
          }
        }
        
        // Fallback: Try splitting by Template headings
        const templateMatches = [...completion.matchAll(/template \d+:|template \d+/gi)];
        if (templateMatches.length >= 2) {
          const templates = [];
          
          // Extract templates based on Template headings
          for (let i = 0; i < templateMatches.length && i < 2; i++) {
            const startIdx = templateMatches[i].index;
            let content = '';
            
            // Find the first occurrence of "Subject:" after this template marker
            const subjectMatch = completion.substring(startIdx).match(/Subject:/i);
            if (subjectMatch) {
              const subjectIdx = startIdx + subjectMatch.index;
              const endIdx = (i < templateMatches.length - 1) ? templateMatches[i+1].index : completion.length;
              content = completion.substring(subjectIdx, endIdx).trim();
            }
            
            if (content && content.toLowerCase().includes('subject:')) {
              templates.push(content);
            }
          }
          
          if (templates.length >= 2) {
            return templates;
          }
        }
        
        // Fallback: split by large gaps of whitespace
        const alternateTemplates = completion.split(/\n\s*\n\s*\n/);
        const validTemplates = alternateTemplates
          .filter(t => t.toLowerCase().includes('subject:') && t.length > 50)
          .map(t => t.trim());
          
        if (validTemplates.length >= 2) {
          return validTemplates.slice(0, 2);
        }
        
        // Last resort: return the whole thing as one template and generate a simple second one
        console.log('Using last resort email template generation');
        return [
          completion.trim(),
          `Subject: Quick question about ${prospectCompany}'s needs\n\nHello ${contact?.name?.split(' ')[0] || 'there'},\n\nI noticed you're the ${contact?.title || 'leader'} at ${prospectCompany} and wanted to reach out about how ${userCompany} has been helping companies like yours improve their results.\n\nWould you be open to a brief 15-minute call next week to discuss if our solution might be valuable for your team?\n\nBest regards,\n[Your Name]\n${userCompany}`
        ];
      }
      
      throw new Error('No email templates generated');
    } catch (error) {
      console.error('Email template generation error:', error.message);
      throw error;
    }
  }
}

module.exports = new OpenAIService();