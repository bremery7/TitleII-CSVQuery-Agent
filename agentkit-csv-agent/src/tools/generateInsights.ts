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

function prepareResultSummary(results: any[]): string {
  if (results.length === 0) return "No results found.";
  
  const sampleSize = Math.min(3, results.length);
  const sample = results.slice(0, sampleSize);
  
  return `Sample of ${sampleSize} out of ${results.length} results:\n${JSON.stringify(sample, null, 2)}`;
}

export const generateInsights = createTool({
  name: "generate-insights",
  description: "Generates AI insights that directly answer the user's specific question based on query results.",
  inputSchema: z.object({
    userQuestion: z.string().describe("The original question asked by the user"),
    queryResults: z.array(z.any()).describe("The results from the SQL query"),
    sqlQuery: z.string().describe("The SQL query that was executed"),
  }),
  handler: async ({ userQuestion, queryResults, sqlQuery }) => {
    
    console.log(`[Insights Tool] Generating insights for ${queryResults.length} results`);
    
    const resultSummary = prepareResultSummary(queryResults);
    
    const prompt = `You are an AI assistant helping users understand their accessibility data. A user asked a specific question about their content.

**User's Question:**
"${userQuestion}"

**SQL Query Executed:**
\`\`\`sql
${sqlQuery}
\`\`\`

**Query Results Summary:**
- Total rows returned: ${queryResults.length}
${resultSummary}

**Your Task:**
Provide a direct, conversational answer to the user's specific question based on the query results. Focus on answering what they asked.

**Guidelines:**
1. Answer the user's question directly and conversationally
2. Use specific numbers and facts from the results
3. If they asked about a specific entity, owner, or category, mention it
4. If they asked for a count or list, provide it clearly
5. Keep the answer focused on what they asked, not general compliance
6. Use neutral, factual language
7. Keep to 2-3 sentences
8. Do not use words like: significant, concern, violates, raises, crucial, critical, essential, must, should, important, serious, issue, problem

**Examples:**
- Question: "Show me entries from University X" → "Found 45 entries from University X. These entries include 30 with captions and 15 without captions."
- Question: "How many entries have human captions?" → "The query returned 58 entries with human captions. Of these, 52 have accuracy ratings above 95%."
- Question: "Show me entries with low accuracy" → "Found 12 entries with caption accuracy below 95%. These entries include 8 with machine-generated captions and 4 with human captions."

**Answer:**`;

    try {
      const response = await openaiAxios.post('/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant that answers questions about accessibility data. Provide direct, conversational answers to user questions. Focus on what they asked, not on general compliance advice. Use neutral, factual language.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const insights = response.data.choices[0].message.content?.trim();
      
      if (!insights) {
        throw new Error("AI failed to generate insights.");
      }

      console.log(`[Insights Tool] ✓ Generated insights: ${insights.substring(0, 100)}...`);
      return { insights };

    } catch (error) {
      console.error("[Insights Tool] Error generating insights:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("[Insights Tool] API Response:", error.response.data);
      }
      throw error;
    }
  },
});
