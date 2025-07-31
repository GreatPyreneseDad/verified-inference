# Verified Inference Backend

Backend API service for the Verified Inference System.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database
- Claude API key from Anthropic

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `DATABASE_URL`: PostgreSQL connection string
   - `CLAUDE_API_KEY`: Your Claude API key
   - `JWT_SECRET`: A secure random string (min 32 chars)

3. Set up the database:
   ```bash
   # Connect to PostgreSQL and run:
   psql -U postgres -d verified_inference < ../database/schema.sql
   ```

## Development

Run the development server:
```bash
npm run dev
```

## Production

Build and run:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

### Queries
- `POST /api/queries` - Create new query with inferences (authenticated)
- `GET /api/queries` - Get user's queries (authenticated)
- `GET /api/queries/:id` - Get specific query with inferences (authenticated)

### Inferences
- `PATCH /api/inferences/:id/verify` - Verify an inference (authenticated)
- `GET /api/inferences/unverified` - Get unverified inferences
- `GET /api/inferences/stats` - Get verification statistics

### Health Check
- `GET /api/health` - Service health status

## Testing

Run tests:
```bash
npm test
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 3000) | No |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DATABASE_SSL` | Enable SSL for database | No |
| `CLAUDE_API_KEY` | Anthropic Claude API key | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `JWT_EXPIRES_IN` | JWT expiration (default: 7d) | No |
| `CORS_ORIGIN` | CORS origin URL | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |
| `LOG_LEVEL` | Logging level | No |