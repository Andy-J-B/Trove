# TikTok Product Extractor API

A lean MVP API that extracts products from TikTok videos by getting transcripts and using OpenAI to identify mentioned products.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your API keys:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SCRAPE_CREATORS_API_KEY`: Your Scrape Creators API key
- `PORT`: Server port (default: 3000)

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Extract Products
```
POST /extract-products
Content-Type: application/json

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
      "category": "Category",
      "description": "Product description",
      "mentioned_context": "How it was mentioned"
    }
  ]
}
```

## Usage Example

```bash
curl -X POST http://localhost:3000/extract-products \
  -H "Content-Type: application/json" \
  -d '{"tiktokUrl": "https://www.tiktok.com/@username/video/1234567890"}'
```