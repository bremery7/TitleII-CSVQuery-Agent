/*import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

const dbConnectionSchema = z.any().describe("The active DuckDB connection object");

export const queryDb = createTool({
  name: "query-db",
  description: "Run a SQL query against the database",
  inputSchema: z.object({
    sql: z.string().describe("The SQL query to run"),
    connection: dbConnectionSchema,
  }),
  handler: async ({ sql, connection }) => {
    console.log(`[Query Tool] Running SQL: ${sql}`);
    
    return new Promise((resolve, reject) => {
      connection.all(sql, (err, rows) => {
        if (err) {
          console.error(`[Query Tool] Query error:`, err);
          reject(err);
        } else {
          console.log(`[Query Tool] ✓ Query returned ${rows.length} rows`);
          
          // Convert BigInt values to strings or numbers
          const convertedRows = rows.map(row => {
            const newRow: any = {};
            for (const [key, value] of Object.entries(row)) {
              if (typeof value === 'bigint') {
                newRow[key] = value.toString(); // Convert BigInt to string
              } else {
                newRow[key] = value;
              }
            }
            return newRow;
          });
          
          resolve({ rows: convertedRows });
        }
      });
    });
  },
});*/

import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

const dbConnectionSchema = z.any().describe("The active DuckDB connection object");

export const queryDb = createTool({
  name: "query-db",
  description: "Run a SQL query against the database",
  inputSchema: z.object({
    sql: z.string().describe("The SQL query to run"),
    connection: dbConnectionSchema,
  }),
  handler: async ({ sql, connection }) => {
    console.log(`[Query Tool] Running SQL: ${sql}`);
    
    return new Promise((resolve, reject) => {
      connection.all(sql, (err, rows) => {
        if (err) {
          console.error(`[Query Tool] Query error:`, err);
          reject(err);
        } else {
          console.log(`[Query Tool] ✓ Query returned ${rows.length} rows`);
          
          // Convert all non-serializable values
          const convertedRows = rows.map(row => {
            const newRow: any = {};
            for (const [key, value] of Object.entries(row)) {
              if (value === null || value === undefined) {
                newRow[key] = value;
              } else if (typeof value === 'bigint') {
                newRow[key] = value.toString();
              } else if (typeof value === 'object') {
                // Handle objects (Date, Error, etc.)
                if (value instanceof Date) {
                  newRow[key] = value.toISOString();
                } else if (value instanceof Error || (value as any).exception_type) {
                  // Handle DuckDB exceptions
                  newRow[key] = String(value);
                } else {
                  try {
                    newRow[key] = JSON.stringify(value);
                  } catch {
                    newRow[key] = String(value);
                  }
                }
              } else {
                newRow[key] = value;
              }
            }
            return newRow;
          });
          
          resolve({ rows: convertedRows });
        }
      });
    });
  },
});