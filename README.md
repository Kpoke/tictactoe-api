# Tic Tac Toe Backend API

A TypeScript-based backend API for the Tic Tac Toe game, using PostgreSQL with Knex.js for database management and Socket.io for real-time gameplay.

## Features

- **TypeScript**: Fully typed codebase for better maintainability
- **PostgreSQL**: Reliable relational database
- **Knex.js**: SQL query builder and migration tool
- **Socket.io**: Real-time multiplayer game support with authentication
- **JWT Authentication**: Secure token-based authentication
- **bcrypt**: Password hashing for security
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Zod-based schema validation
- **Structured Logging**: Winston logger with file output
- **API Documentation**: Swagger/OpenAPI documentation
- **Health Checks**: Database and server health monitoring
- **Security Headers**: Helmet.js for security
- **Error Handling**: Centralized error handling middleware
- **Testing**: Jest test framework setup
- **CI/CD**: GitHub Actions workflow

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and JWT secret.

4. Run database migrations:
   ```bash
   npm run migrate
   ```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Database Migrations

Create a new migration:
```bash
npm run migrate:make migration_name
```

Run migrations:
```bash
npm run migrate
```

Rollback last migration:
```bash
npm run migrate:rollback
```

## Environment Variables

- `PORT`: Server port (default: 8082)
- `NODE_ENV`: Environment (development/production/test)
- `DB_HOST`: PostgreSQL host (required)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_NAME`: Database name (required)
- `DB_USER`: Database user (required)
- `DB_PASSWORD`: Database password (required)
- `DB_SSL`: Use SSL connection (true/false)
- `DATABASE_URL`: Alternative connection string
- `JWT_SECRET`: JWT secret key (required, minimum 32 characters)
- `CORS_ORIGIN`: CORS origin (use specific origin in production, not `*`)
- `LOG_LEVEL`: Logging level (error/warn/info/debug, default: info)

## API Endpoints

### POST /api/signup
Create a new user account.

**Request Body:**
```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "username": "player1",
    "points": 0
  }
}
```

### POST /api/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "username": "player1",
    "points": 0
  }
}
```

### GET /api/leaderboard
Get top 100 players by points.

**Response:**
```json
{
  "leaders": [
    {
      "id": "uuid",
      "username": "player1",
      "points": 100
    }
  ]
}
```

## Socket.io Events

### Client → Server

- `setPlayers(username)`: Join waiting room for matchmaking
- `cancel`: Leave waiting room
- `play({ box, opponentId })`: Make a move
- `winner({ side, opponentId })`: Declare winner
- `updateuserpoints(token)`: Add points after winning

### Server → Client

- `matched(payload)`: Match found with opponent details
- `play({ box, timeObject })`: Opponent made a move
- `winner(side)`: Game ended, winner declared
- `updated`: Points updated successfully
- `an error`: Error occurred

## Project Structure

```
src/
├── api/              # API routes and controllers
├── database/         # Database connection and migrations
├── model/            # Data models
├── services/         # Business logic
├── types/            # TypeScript type definitions
├── utilities/        # Utility functions
└── server.ts        # Main server file
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication (required for socket connections)
- Input validation with Zod schemas
- SQL injection prevention (via Knex)
- CORS configuration (environment-based)
- Rate limiting (5 requests/15min for auth, 100/15min for API)
- Security headers (Helmet.js)
- Request size limits (10kb)
- Socket.io authentication middleware

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. This provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication examples

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

Generate coverage report:
```bash
npm test:coverage
```

## Health Check

The API provides health check endpoints:
- `GET /health`
- `GET /api/health`

Returns server status, database connectivity, and uptime information.

## Logging

Logs are written to:
- Console (all environments)
- `logs/error.log` (production, errors only)
- `logs/combined.log` (production, all logs)

Log levels can be controlled via `LOG_LEVEL` environment variable.

## License

ISC
