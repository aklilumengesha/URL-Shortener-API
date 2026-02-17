# URL Shortener

A fast and efficient URL shortener built with Fastify, featuring Redis caching, MongoDB storage, and comprehensive analytics.

## Features

- ⚡ Fast URL shortening with nanoid
- 🚀 Redis caching for lightning-fast redirects
- 📊 Comprehensive analytics (clicks, browsers, date trends)
- 🔒 Rate limiting and CORS support
- 🎨 Custom alias support
- 📝 Click history tracking
- 🔍 RESTful API with validation

## Tech Stack

- **Fastify** - Fast web framework
- **MongoDB** - Database
- **Redis** - Caching layer
- **Node.js** - Runtime

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for caching)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd url-shortener
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB and Redis (if using)
```bash
# MongoDB
mongod

# Redis (optional)
redis-server
```

5. Start the server
```bash
npm start
```

The server will start at `http://localhost:3000`

### Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Usage Examples

### Create a short URL
```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/url"}'
```

### Create with custom alias
```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customAlias": "mylink"}'
```

### Get analytics
```bash
curl http://localhost:3000/api/analytics/abc123
```

### Access short URL
```bash
curl -L http://localhost:3000/abc123
```

## API Documentation

### URL Endpoints

#### Create Short URL
```
POST /api/urls
Body: { "url": "https://example.com", "customAlias": "optional" }
Response: { "shortCode", "shortUrl", "originalUrl", "createdAt" }
```

#### Get URL Details
```
GET /api/urls/:code
Response: { "shortCode", "originalUrl", "clicks", "createdAt", "source" }
```

#### List All URLs
```
GET /api/urls?page=1&limit=10
Response: { "urls": [...], "pagination": {...} }
```

#### Delete URL
```
DELETE /api/urls/:code
Response: { "message", "code" }
```

#### Redirect
```
GET /:code
Response: 301 Redirect to original URL
```

### Analytics Endpoints

#### Overall Analytics
```
GET /api/analytics
Response: { "totalUrls", "totalClicks", "avgClicksPerUrl", "topUrls", "recentUrls" }
```

#### URL-Specific Analytics
```
GET /api/analytics/:code
Response: { "shortCode", "originalUrl", "totalClicks", "statistics", "topBrowsers", "clicksByDate", "recentClicks" }
```

## Project Structure

```
url-shortener/
├── src/
│   ├── routes/
│   │   ├── urls.js          # URL management endpoints
│   │   └── analytics.js     # Analytics endpoints
│   ├── plugins/
│   │   ├── mongodb.js       # MongoDB connection
│   │   └── redis.js         # Redis connection
│   ├── schemas/
│   │   └── url.schema.js    # Request validation schemas
│   └── app.js               # Fastify app configuration
├── server.js                # Entry point
├── .env.example             # Environment variables template
└── package.json
```

## Contributing

Contributions are welcome! This project was built incrementally with 60+ commits to demonstrate Fastify best practices.

## License

MIT
