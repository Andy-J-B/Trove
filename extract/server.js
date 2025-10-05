const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'TikTok Product Extractor API is running' });
});

// Test endpoint to debug Scrape Creators API
app.post('/test-transcript', async (req, res) => {
  try {
    const { tiktokUrl } = req.body;
    
    if (!tiktokUrl) {
      return res.status(400).json({ error: 'TikTok URL is required' });
    }

    console.log('Testing transcript fetch for:', tiktokUrl);
    const transcript = await getTranscript(tiktokUrl);
    
    res.json({
      success: true,
      tiktokUrl,
      transcript,
      transcriptLength: transcript?.length || 0
    });
    
  } catch (error) {
    console.error('Test transcript error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      message: error.message 
    });
  }
});

// Main endpoint to extract products from TikTok video
app.post('/extract-products', async (req, res) => {
  try {
    const { tiktokUrl } = req.body;

    if (!tiktokUrl) {
      return res.status(400).json({ error: 'TikTok URL is required' });
    }

    // Step 1: Get transcript from Scrape Creators API
    console.log('Fetching transcript for:', tiktokUrl);
    const transcript = await getTranscript(tiktokUrl);

    if (!transcript) {
      return res.status(404).json({ error: 'Could not extract transcript from video' });
    }

    // Step 2: Extract products using OpenAI
    console.log('Extracting products from transcript...');
    const products = await extractProducts(transcript);

    res.json({
      success: true,
      tiktokUrl,
      transcript,
      products
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Function to get transcript from Scrape Creators API
async function getTranscript(tiktokUrl) {
  try {
    console.log('Making request to Scrape Creators API...');
    console.log('URL:', tiktokUrl);
    console.log('API Key present:', !!process.env.SCRAPE_CREATORS_API_KEY);
    
    const response = await axios.get('https://api.scrapecreators.com/v1/tiktok/video/transcript', {
      params: {
        url: tiktokUrl,
        language: 'en'
      },
      headers: {
        'x-api-key': process.env.SCRAPE_CREATORS_API_KEY
      }
    });

    console.log('API Response status:', response.status);
    console.log('API Response data:', JSON.stringify(response.data, null, 2));

    // The API returns transcript data with timestamps
    const transcriptData = response.data;
    
    // Extract just the text from the transcript segments
    if (transcriptData && Array.isArray(transcriptData)) {
      return transcriptData.map(segment => segment.text || segment.content).join(' ');
    }
    
    // Fallback if the response format is different
    return transcriptData.transcript || transcriptData.text || JSON.stringify(transcriptData);
    
  } catch (error) {
    console.error('Detailed error info:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request Config:', {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      headers: error.config?.headers
    });
    
    throw new Error(`Scrape Creators API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data) || error.message}`);
  }
}

// Function to extract products using OpenAI
async function extractProducts(transcript) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a product extraction expert. Analyze the given transcript from a TikTok video and extract all products mentioned. 
          
          Return a JSON array of products with the following structure:
          [
            {
              "name": "Product name",
              "category": "Product category",
              "description": "Brief description based on context",
              "mentioned_context": "How it was mentioned in the video"
            }
          ]
          
          Only include actual products (physical items, services, brands, apps, etc.) that are clearly mentioned or discussed. 
          Do not include generic terms or concepts unless they refer to specific products.`
        },
        {
          role: "user",
          content: `Extract products from this TikTok transcript: "${transcript}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, return the raw content
      console.warn('Could not parse OpenAI response as JSON:', content);
      return [{ 
        name: "Raw Response", 
        category: "Unknown", 
        description: content,
        mentioned_context: "OpenAI response could not be parsed as JSON"
      }];
    }
  } catch (error) {
    console.error('Error extracting products with OpenAI:', error);
    throw new Error('Failed to extract products using OpenAI');
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});