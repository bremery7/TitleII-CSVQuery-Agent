# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Using Docker (Recommended)

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd agentkit-csv-agent
   cp .env.example .env
   ```

2. **Add your OpenAI API key to `.env`**
   ```
   OPENAI_API_KEY=sk-your-key-here
   JWT_SECRET=any-random-string-at-least-32-characters-long
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Access the API**
   - Server: http://localhost:3001
   - Health check: http://localhost:3001/api/health

### Using Node.js

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd agentkit-csv-agent
   npm install
   cp .env.example .env
   ```

2. **Add your OpenAI API key to `.env`**

3. **Start the server**
   ```bash
   npm start
   ```

## 📝 First Query

1. **Upload a CSV file**
   ```bash
   curl -X POST http://localhost:3001/api/upload \
     -F "csvFile=@your-file.csv"
   ```

2. **Query your data**
   ```bash
   curl -X POST http://localhost:3001/api/query \
     -H "Content-Type: application/json" \
     -d '{"query": "Show me all records"}'
   ```

3. **Export results**
   ```bash
   curl -X POST http://localhost:3001/api/export \
     -H "Content-Type: application/json" \
     -d '{"sql": "SELECT * FROM your_table"}' \
     --output results.xlsx
   ```

## 🎯 Example Use Cases

- **Analytics**: "What are the top 10 items by views?"
- **Filtering**: "Show me all records where plays > 100"
- **Aggregation**: "What's the average plays per item?"
- **Time-based**: "Find all entries from last month"

## 🔧 Troubleshooting

**Server won't start?**
- Check that port 3001 is available
- Verify your OpenAI API key is valid
- Make sure Node.js 18+ is installed

**Can't upload files?**
- Ensure the `data/` directory exists
- Check file is a valid CSV
- Verify file size is under 500MB

**Queries failing?**
- Check that CSV files are loaded: `GET /api/files`
- Verify database info: `GET /api/database-info`
- Look at server logs for detailed errors

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the API endpoints section
- Learn about security considerations
- Explore advanced query examples
