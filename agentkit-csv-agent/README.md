# AgentKit CSV Agent

A powerful AI-powered CSV data analysis tool that allows you to query multiple CSV files using natural language. Built with Express, DuckDB, and OpenAI.

## Features

- 📊 **Multi-CSV Support** - Upload and query multiple CSV files simultaneously
- 🤖 **Natural Language Queries** - Ask questions in plain English
- 🔄 **Automatic UNION Queries** - Automatically combines results from multiple tables
- 📥 **Excel Export** - Export query results to Excel format
- 🔒 **SQL Validation** - Built-in SQL injection protection
- 🚀 **Fast Performance** - Powered by DuckDB for lightning-fast analytics

## Prerequisites

- Node.js 18+ or Docker
- OpenAI API key

## Installation

### Option 1: Local Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agentkit-csv-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   JWT_SECRET=your-random-secret-string-at-least-32-chars
   PORT=3001
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The server will start at `http://localhost:3001`

### Option 2: Docker Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agentkit-csv-agent
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key

3. **Build and run with Docker**
   ```bash
   docker build -t agentkit-csv-agent .
   docker run -p 3001:3001 --env-file .env -v $(pwd)/data:/app/data agentkit-csv-agent
   ```

   Or use Docker Compose:
   ```bash
   docker-compose up
   ```

## Usage

### API Endpoints

#### Health Check
```bash
GET /api/health
```

#### Upload CSV File
```bash
POST /api/upload
Content-Type: multipart/form-data

Body: csvFile (file)
```

#### List Files
```bash
GET /api/files
```

#### Delete Files
```bash
DELETE /api/files
Content-Type: application/json

Body: { "files": ["filename1.csv", "filename2.csv"] }
```

#### Query Data
```bash
POST /api/query
Content-Type: application/json

Body: { "query": "Show me all records where plays > 12" }
```

#### Export Results
```bash
POST /api/export
Content-Type: application/json

Body: { "sql": "SELECT * FROM table_name" }
```

### Example Queries

- "Show me all records where plays > 12"
- "What are the top 10 items by views?"
- "Find all entries from 2024"
- "Count total records"
- "Show me the average plays per item"

## Project Structure

```
agentkit-csv-agent/
├── server.ts              # Main Express server
├── src/
│   ├── middleware/
│   │   └── auth.ts        # Authentication middleware
│   ├── tools/
│   │   ├── generateSql.ts # AI SQL generation
│   │   ├── queryDb.ts     # Database query execution
│   │   ├── loadCsvFolder.ts # CSV loading logic
│   │   └── exportExcel.ts # Excel export functionality
│   └── utils/
│       └── sqlSanitizer.ts # SQL security validation
├── data/                  # CSV files directory
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

## Development

### Running in Development Mode

```bash
npx ts-node server.ts
```

### TypeScript Compilation

```bash
npx tsc
```

## Security Notes

- Authentication is currently disabled for testing purposes
- In production, enable JWT authentication by restoring the `authenticateToken` middleware
- SQL queries are validated and sanitized to prevent SQL injection
- Rate limiting is enabled (100 requests per 15 minutes)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment | development |

## Troubleshooting

### "No token provided" Error
Authentication is currently disabled for testing. If you see this error, restart the server after the latest changes.

### "EBUSY: resource busy or locked" Error
This occurs when trying to upload a file that's already loaded in DuckDB. The server now automatically drops tables before overwriting files.

### "Parser Error" in SQL
Make sure your CSV filenames don't contain special characters. The system automatically sanitizes table names by replacing special characters with underscores.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
