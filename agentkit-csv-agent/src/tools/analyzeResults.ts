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

export const analyzeResults = createTool({
  name: "analyze-results",
  description: "Analyzes query results and generates a natural language answer focused on WCAG 2.1 AA compliance and Title II accessibility requirements.",
  inputSchema: z.object({
    userQuestion: z.string().describe("The original question asked by the user"),
    queryResults: z.array(z.any()).describe("The results from the SQL query"),
    sqlQuery: z.string().describe("The SQL query that was executed"),
  }),
  handler: async ({ userQuestion, queryResults, sqlQuery }) => {
    
    console.log(`[Analysis Tool] Analyzing ${queryResults.length} results for question: "${userQuestion}"`);
    
    // Prepare a summary of the results for the AI
    const resultSummary = prepareResultSummary(queryResults);
    
    const prompt = `You are an accessibility compliance analyst specializing in WCAG 2.1 AA standards and Title II of the ADA. A user asked the following question about digital content accessibility:

**User Question:** "${userQuestion}"

**SQL Query Executed:**
\`\`\`sql
${sqlQuery}
\`\`\`

**Query Results Summary:**
- Total rows returned: ${queryResults.length}
${resultSummary}

**Context:**
This data relates to Title II WCAG 2.1 AA compliance requirements for educational institutions, colleges, universities, and educational technology companies. Key accessibility considerations include:
- Captions for multimedia content (Success Criterion 1.2.2)
- Audio descriptions for video content (Success Criterion 1.2.5)
- Caption accuracy standards (typically 99% for live, 99%+ for pre-recorded)
- Time-based media accessibility requirements
- Content ownership and responsibility for compliance
- April 24, 2026 compliance deadline for digital content

**Your Task:**
Provide an executive-level summary suitable for university presidents, compliance officers, or department heads. Focus on compliance status, remediation needs, and strategic positioning.

**CRITICAL - Language Requirements:**
- NEVER use: significant, concern, violates, raises, crucial, critical, essential, must, should, important, serious, issue, problem, gap, lack, absence, missing
- ONLY use neutral descriptive terms: shows, indicates, contains, has, does not have, includes, excludes, totals, counts as, found, returned
- Use executive language: compliance status, remediation areas, strategic positioning, accessibility metrics, content inventory
- When describing non-compliance, use POSITIVE framing: "positioned for enhancement", "opportunities for alignment", "areas identified for improvement", "content ready for remediation"
- Provide SPECIFIC NUMBERS and PERCENTAGES for both compliant and non-compliant content
- State facts as observations about institutional readiness
- Do not suggest actions or make recommendations
- Frame compliance gaps as actionable inventory rather than problems

**IMPORTANT - Understanding the Query Context:**
- The user asked a SPECIFIC question: "${userQuestion}"
- The ${queryResults.length} results are FILTERED based on this question
- These are NOT all entries in the database - they are ONLY the entries matching the user's criteria
- Your summary should describe THESE SPECIFIC ${queryResults.length} entries, not a general inventory

**Format for Executive Summary:**
1. Opening statement with total count and what was queried
2. **USE THE EXACT NUMBERS PROVIDED IN THE COMPLIANCE METRICS ABOVE** - do not calculate or estimate different numbers
3. Breakdown with SPECIFIC NUMBERS for compliant vs. non-compliant using the exact counts and percentages provided
4. **ALWAYS include WCAG 2.1 AA compliance details** - state which success criteria apply and provide specific counts/percentages
5. For non-compliant content, frame positively: "X entries represent opportunities for alignment with [Success Criterion]"
6. Include the April 24, 2026 deadline context when relevant
7. Keep to 4-5 sentences for comprehensive executive readability

**WCAG 2.1 AA Success Criteria to Reference:**
- Success Criterion 1.2.2 (Captions - Prerecorded): Captions are provided for all prerecorded audio content
- Success Criterion 1.2.4 (Captions - Live): Captions are provided for all live audio content
- Success Criterion 1.2.5 (Audio Description - Prerecorded): Audio description is provided for all prerecorded video content
- Caption accuracy: Industry standard is 99% for prerecorded content

**Examples with Positive Framing:**
- If user asked "show me machine captions" and got 12,170 results with mixed accuracy:
  → "The query returned 12,170 entries with machine-generated captions. Analysis shows 8,500 entries (69.8%) have accuracy ratings above 95% and align with WCAG 2.1 AA Success Criterion 1.2.2 for caption quality. The remaining 3,670 entries (30.2%) with accuracy ratings below 95% represent opportunities for enhancement to meet the industry standard of 99% accuracy for prerecorded content. These entries are positioned for quality improvement ahead of the April 24, 2026 compliance deadline."
  
- If user asked "show me entries without captions" and got 5,000 results:
  → "The query returned 5,000 entries without captions. These entries represent opportunities for alignment with WCAG 2.1 AA Success Criterion 1.2.2, which addresses captions for prerecorded audio content in multimedia. This inventory of 5,000 entries is positioned for captioning implementation to support institutional readiness for the April 24, 2026 compliance deadline."
  
- If user asked "show me all entries" and got 20,000 results:
  → "The content inventory includes 20,000 multimedia entries. Of these, 12,000 entries (60%) have captions and align with WCAG 2.1 AA Success Criterion 1.2.2. The remaining 8,000 entries (40%) without captions represent opportunities for enhancement and are positioned for captioning implementation. This inventory provides a clear baseline for strategic planning ahead of the April 24, 2026 compliance deadline."

**Answer:**`;

    try {
      const response = await openaiAxios.post('/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an executive compliance analyst for educational institutions. Provide factual, professional summaries suitable for university presidents and compliance officers. Focus on content inventory metrics, compliance status, and institutional readiness. Never use words like: significant, concern, violates, raises, crucial, critical, essential, must, should, important, serious, issue, problem, gap, lack, absence, missing. Use executive language like: content inventory, compliance metrics, accessibility status, remediation areas, institutional readiness, strategic positioning. State observations about what the data shows without judgment or recommendations.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const answer = response.data.choices[0].message.content?.trim();
      
      if (!answer) {
        throw new Error("AI failed to generate an answer.");
      }

      console.log(`[Analysis Tool] ✓ Generated answer: ${answer.substring(0, 100)}...`);
      return { answer };

    } catch (error) {
      console.error("[Analysis Tool] Error generating answer:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("[Analysis Tool] API Response:", error.response.data);
      }
      throw error;
    }
  },
});

/**
 * Prepare a summary of query results for the AI with ACTUAL compliance metrics
 */
function prepareResultSummary(results: any[]): string {
  if (results.length === 0) {
    return "- No results found";
  }

  const summary: string[] = [];
  const columns = Object.keys(results[0]);
  
  // Add column information
  summary.push(`- Columns: ${columns.join(', ')}`);
  
  // Calculate ACTUAL compliance metrics across ALL results
  const hasCaptions = (row: any) => {
    const captionFields = [
      row.captions_language,
      row.CAPTIONS_LANGUAGE,
      row.caption_language
    ];
    return captionFields.some(field => 
      field && field !== null && field !== '-' && String(field).trim() !== '' && String(field).toLowerCase() !== 'none'
    );
  };
  
  const getAccuracy = (row: any) => {
    const accuracyField = row.captions_accuracy || row.CAPTIONS_ACCURACY || row.caption_accuracy || '0';
    return parseFloat(String(accuracyField).replace('%', ''));
  };
  
  const isMachine = (row: any) => {
    const creationMode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
    return String(creationMode).toLowerCase() === 'machine';
  };
  
  const isHuman = (row: any) => {
    const creationMode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
    return String(creationMode).toLowerCase() === 'human' || String(creationMode).toLowerCase() === 'upload';
  };
  
  // Calculate actual counts
  const withCaptions = results.filter(hasCaptions).length;
  const noCaptions = results.length - withCaptions;
  const machineAccurate = results.filter(row => hasCaptions(row) && isMachine(row) && getAccuracy(row) >= 95).length;
  const machinePoor = results.filter(row => hasCaptions(row) && isMachine(row) && getAccuracy(row) < 95).length;
  const humanAccurate = results.filter(row => hasCaptions(row) && isHuman(row) && getAccuracy(row) >= 95).length;
  const humanPoor = results.filter(row => hasCaptions(row) && isHuman(row) && getAccuracy(row) < 95).length;
  
  const totalCompliant = machineAccurate + humanAccurate;
  const totalNonCompliant = machinePoor + humanPoor + noCaptions;
  
  // Add compliance metrics
  summary.push(`\n**ACTUAL Compliance Metrics (calculated from ALL ${results.length} results):**`);
  summary.push(`- Total entries: ${results.length}`);
  summary.push(`- Entries with captions: ${withCaptions}`);
  summary.push(`- Entries without captions: ${noCaptions}`);
  summary.push(`- Machine captions (≥95% accuracy): ${machineAccurate}`);
  summary.push(`- Machine captions (<95% accuracy): ${machinePoor}`);
  summary.push(`- Human captions (≥95% accuracy): ${humanAccurate}`);
  summary.push(`- Human captions (<95% accuracy): ${humanPoor}`);
  summary.push(`- **TOTAL COMPLIANT (≥95% accuracy): ${totalCompliant} (${(totalCompliant / results.length * 100).toFixed(2)}%)**`);
  summary.push(`- **TOTAL NON-COMPLIANT (<95% or no captions): ${totalNonCompliant} (${(totalNonCompliant / results.length * 100).toFixed(2)}%)**`);
  
  summary.push(`\n**CRITICAL: Use these EXACT numbers in your summary. Do NOT estimate or calculate different numbers.**`);
  
  return summary.join('\n');
}
