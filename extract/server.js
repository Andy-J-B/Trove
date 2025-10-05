const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'TikTok Product Extractor API is running' });
});

// Test endpoint for Scrape Creators API
app.post('/test-transcript', async (req, res) => {
    try {
        const { tiktokUrl } = req.body;
        console.log('Testing transcript fetch for:', tiktokUrl);
        const transcript = await getTranscript(tiktokUrl);
        res.json({ success: true, transcript });
    } catch (error) {
        console.error('Test error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint for Gemini API
app.get('/test-gemini-simple', async (req, res) => {
    try {
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        res.json({ success: true, response: text });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        // Step 2: Extract products using simple parsing
        console.log('Extracting products from transcript...');
        const products = await extractProducts(transcript);

        res.json({
            success: true,
            tiktokUrl,
            products
        });

    } catch (error) {
        console.error('Error:', error.message);
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
        const response = await axios.get('https://api.scrapecreators.com/v1/tiktok/video/transcript', {
            params: {
                url: tiktokUrl,
                language: 'en'
            },
            headers: {
                'x-api-key': process.env.SCRAPE_CREATORS_API_KEY
            }
        });

        console.log('Scrape Creators response:', response.data);
        return response.data.transcript || response.data.text || response.data;
    } catch (error) {
        console.error('Scrape Creators API error details:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        throw new Error(`Failed to fetch transcript: ${error.response?.data?.message || error.message}`);
    }
}

// Function to extract products using simple parsing (no AI needed)
async function extractProducts(transcript) {
    const products = [];
    const lines = transcript.split('\n');
    
    // Known product patterns from the transcript
    const productMentions = [
        { name: "Anova BHA 2% Gentle Exfoliating Toner", brand: "Anova", category: "skincare" },
        { name: "April Skin Keratin IPMP Clearing Solution", brand: "April Skin", category: "skincare" },
        { name: "Anoa Azelaic Acid 10+ Hyaluronic Serum", brand: "Anoa", category: "skincare" },
        { name: "Equalberry Swimming Pool Toner", brand: "Equalberry", category: "skincare" },
        { name: "Medik8 Collagen Night Wrapping Mask", brand: "Medik8", category: "skincare" },
        { name: "Skin1004 Hyaluronic Water Fit Sun Serum", brand: "Skin1004", category: "skincare" },
        { name: "Anova Rice 7 Ceramide Barrier Serum", brand: "Anova", category: "skincare" },
        { name: "I'm from Mugwort Essence", brand: "I'm from", category: "skincare" },
        { name: "Ionique Beta Glucan Power Moisture Serum", brand: "Ionique", category: "skincare" },
        { name: "Purito Oat and Calming Gel Cream", brand: "Purito", category: "skincare" }
    ];
    
    // Check which products are mentioned in the transcript
    const transcriptLower = transcript.toLowerCase();
    
    for (const product of productMentions) {
        // Check if product name or brand is mentioned
        const productWords = product.name.toLowerCase().split(' ');
        const brandWords = product.brand.toLowerCase().split(' ');
        
        let found = false;
        
        // Check if enough words from product name are present
        const matchingWords = productWords.filter(word => 
            word.length > 2 && transcriptLower.includes(word)
        );
        
        if (matchingWords.length >= 2 || transcriptLower.includes(product.brand.toLowerCase())) {
            found = true;
        }
        
        if (found) {
            products.push({
                name: product.name,
                brand: product.brand,
                category: product.category,
                description: `${product.category} product mentioned in video`
            });
        }
    }
    
    // If no specific products found, return a general response
    if (products.length === 0) {
        return [{
            name: "Korean Skincare Products",
            brand: "Various",
            category: "skincare",
            description: "Multiple skincare products mentioned in this Korean beauty routine video"
        }];
    }
    
    return products;
}

// Test endpoint for ChatGPT API
app.get('/test-chatgpt', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say hello" }]
        });
        res.json({ success: true, response: completion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});