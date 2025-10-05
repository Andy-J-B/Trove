# TikTok Product Extractor API

A lean MVP API that extracts product information from TikTok videos by getting transcripts and analyzing them with AI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
   - `SCRAPE_CREATORS_API_KEY`: Your Scrape Creators API key
   - `GEMINI_API_KEY`: Your Google Gemini API key

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### POST /extract-products

Extract products from a TikTok video URL.

**Request:**
```json
{
  "tiktokUrl": "https://www.tiktok.com/@username/video/1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "tiktokUrl": "https://www.tiktok.com/@username/video/1234567890",
  "transcript": "Video transcript text...",
  "products": [
    {
      "name": "Product Name",
      "description": "Brief description",
      "category": "beauty",
      "details": "Specific details mentioned"
    }
  ]
}
```

### GET /health

Health check endpoint.

## Usage Example

```bash
curl -X POST http://localhost:3000/extract-products \
  -H "Content-Type: application/json" \
  -d '{"tiktokUrl": "https://www.tiktok.com/@username/video/1234567890"}'
```