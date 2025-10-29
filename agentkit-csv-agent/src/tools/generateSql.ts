import dotenv from "dotenv";
dotenv.config();

import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import axios from "axios";
import https from "https";

// Create HTTPS agent with SSL verification disabled (for network issues)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Create axios instance configured for OpenAI
const openaiAxios = axios.create({
  baseURL: 'https://api.openai.com/v1',
  httpsAgent: httpsAgent,
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

export const generateSql = createTool({
  name: "generate-sql",
  description: "Converts a natural language query into a DuckDB SQL SELECT statement.",
  inputSchema: z.object({
    naturalLanguageQuery: z.string().describe("The user's query in natural language"),
    tableName: z.string().describe("The name of the database table to query"),
    columnSchema: z.array(z.string()).describe("A list of available column names"),
  }),
  handler: async ({ naturalLanguageQuery, tableName, columnSchema }) => {
    
    const columnList = columnSchema.join(', ');
    console.log(`[SQL Gen Tool] Using table ${tableName} with columns: ${columnList}`);
    
    const prompt = `You are an expert SQL query generator for a DuckDB database.
Your task is to convert the user's natural language request into a single, valid SQL SELECT statement.

- **Table Name:** "${tableName}"
- **Available Columns:** [${columnList}]
- **Strict Rules:**
  1. Only use the columns listed above.
  2. Use a WHERE clause based on the natural language request.
  3. Do not use markdown code blocks. Only output the SQL string.
  4. For ALL string comparisons, use LOWER() to make searches case-insensitive:
     - Instead of: column LIKE '%value%'
     - Use: LOWER(column) LIKE LOWER('%value%')
  5. For date/timestamp comparisons, use CAST to ensure type compatibility:
     - For "less than 1 year ago": CAST(created_at AS DATE) > CURRENT_DATE - INTERVAL '1 year'
     - For "more than 5 years ago": CAST(created_at AS DATE) < CURRENT_DATE - INTERVAL '5 years'
  6. For columns like captions_accuracy that might be stored as text but represent numbers:
     - Use: captions_accuracy IS NOT NULL AND captions_accuracy != '-' AND CAST(REPLACE(captions_accuracy, '%', '') AS DOUBLE) < 100
     - This handles both "100" and "100%" formats and filters out NULL values and '-' placeholders
     - Always check IS NOT NULL AND != '-' first when comparing numeric text columns
     - IMPORTANT: "more than X% accurate" means accuracy > X (higher is better)
     - IMPORTANT: "less than X% accurate" means accuracy < X (lower is worse)
  7. For string values in LIKE, use single quotes (').
  8. Column names are case-sensitive, use them exactly as provided.
  9. Do NOT include semicolons at the end.
  10. Return ONLY valid, executable SQL with no explanations.

**IMPORTANT - Caption Type Classification:**
- When user asks for "human captions" or "manual captions":
  → Filter by: LOWER(captions_creation_mode) IN ('human', 'upload')
- When user asks for "machine captions" or "automatic captions" or "auto-generated captions":
  → Filter by: LOWER(captions_creation_mode) = 'machine'
- The captions_creation_mode field determines if captions are human or machine, NOT captions_usage_type

**IMPORTANT - Percentage Calculations:**
- When user asks "what percentage" or "what percent", use aggregate functions with CASE statements
- Example pattern: SELECT (COUNT(CASE WHEN condition THEN 1 END) * 100.0 / COUNT(*)) AS percentage FROM table
- Always multiply by 100.0 (not 100) to get proper decimal division
- For "percentage with captions": COUNT(CASE WHEN captions_language IS NOT NULL AND captions_language != '-' THEN 1 END)
- For "percentage without captions": COUNT(CASE WHEN captions_language IS NULL OR captions_language = '-' THEN 1 END)

Examples:
- "entries from last year" → SELECT * FROM table WHERE CAST(created_at AS DATE) > CURRENT_DATE - INTERVAL '1 year'
- "captions MORE than 98% accurate" → SELECT * FROM table WHERE captions_accuracy IS NOT NULL AND captions_accuracy != '-' AND CAST(REPLACE(captions_accuracy, '%', '') AS DOUBLE) > 98
- "captions LESS than 95% accurate" → SELECT * FROM table WHERE captions_accuracy IS NOT NULL AND captions_accuracy != '-' AND CAST(REPLACE(captions_accuracy, '%', '') AS DOUBLE) < 95
- "entries with accuracy below 50 percent" → SELECT * FROM table WHERE captions_accuracy IS NOT NULL AND captions_accuracy != '-' AND CAST(REPLACE(captions_accuracy, '%', '') AS DOUBLE) < 50
- "captions accuracy is 100" → SELECT * FROM table WHERE (captions_accuracy = '100' OR captions_accuracy = '100%')
- "human captions less than 99%" → SELECT * FROM table WHERE LOWER(captions_creation_mode) IN ('human', 'upload') AND captions_accuracy IS NOT NULL AND captions_accuracy != '-' AND CAST(REPLACE(captions_accuracy, '%', '') AS DOUBLE) < 99
- "machine captions" → SELECT * FROM table WHERE LOWER(captions_creation_mode) = 'machine'
- "entries without captions" → SELECT * FROM table WHERE (captions_language IS NULL OR captions_language = '-' OR captions_language = '')
- "what percentage have captions" → SELECT (COUNT(CASE WHEN captions_language IS NOT NULL AND captions_language != '-' THEN 1 END) * 100.0 / COUNT(*)) AS percentage_with_captions FROM table
- "what percent do not have audio description" → SELECT (COUNT(CASE WHEN has_audio_description IS NULL OR has_audio_description = 'false' THEN 1 END) * 100.0 / COUNT(*)) AS percentage_without_ad FROM table

Natural Language Request: "${naturalLanguageQuery}"

Respond with ONLY the SQL query, nothing else. No markdown, no explanations.`;

    try {
      // Use axios to call OpenAI API
      const response = await openaiAxios.post('/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      });

      let generatedSql = response.data.choices[0].message.content?.trim();
      
      if (!generatedSql) {
        throw new Error("LLM failed to generate a SQL query.");
      }

      // Clean up the SQL
      generatedSql = generatedSql
        .replace(/```sql\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^sql\n/i, '')
        .replace(/;$/, '')
        .trim();

      console.log(`[SQL Gen Tool] ✓ Generated SQL: ${generatedSql}`);
      return { generatedSql };

    } catch (error) {
      console.error("[SQL Gen Tool] Error generating SQL:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("[SQL Gen Tool] API Response:", error.response.data);
      }
      throw error;
    }
  },
});