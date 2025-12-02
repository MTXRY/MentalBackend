# Mental Backend

A Node.js backend API built with Express.js.

## Features

- Express.js web framework
- CORS enabled
- Request logging with Morgan
- Environment variable configuration
- Error handling middleware
- Health check endpoint
- RESTful API structure

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Example Routes
- `GET /api/example` - Get example data
- `GET /api/example/:id` - Get example data by ID
- `POST /api/example` - Create example data

### API Info
- `GET /api` - Get API information

## Project Structure

```
MentalBackend/
├── server.js              # Main server file
├── routes/                # Route definitions
│   ├── index.js          # Main router
│   └── example.js        # Example routes
├── controllers/           # Controller logic (to be added)
├── middleware/            # Custom middleware (to be added)
├── config/                # Configuration files (to be added)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Development

The project uses `nodemon` for development, which automatically restarts the server when files change.

## License

ISC

