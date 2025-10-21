import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import fs from "fs";
import path from "path";

const dbConnectionSchema = z.any().describe("The active DuckDB connection object");
const dbInstanceSchema = z.any().describe("The active DuckDB database instance");

export const loadCsvFolder = createTool({
  name: "load-csv-folder",
  description: "Load all CSV files from the data folder into DuckDB tables",
  inputSchema: z.object({
    folderPath: z.string().optional().describe("Path to folder containing CSV files"),
    connection: dbConnectionSchema,
    db: dbInstanceSchema
  }),
  handler: async ({ folderPath, connection, db }) => {
    const actualPath = folderPath || "./data";
    const resolvedPath = path.resolve(actualPath);
    console.log(`\n[Load CSV Tool] Loading CSVs from: ${resolvedPath}`);
    
    if (!fs.existsSync(actualPath) || !fs.statSync(actualPath).isDirectory()) {
      throw new Error(`Directory not found: ${actualPath}`);
    }

    const files = fs.readdirSync(actualPath).filter(f => f.endsWith(".csv"));
    console.log(`[Load CSV Tool] Found ${files.length} CSV files:`, files);
    
    const loadedTables = [];
    
    for (const file of files) {
      const filePath = path.resolve(path.join(actualPath, file));
      // Sanitize table name: remove .csv extension and replace invalid characters with underscores
      let tableName = path.basename(file, ".csv");
      tableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
      
      // Use forward slashes for DuckDB
      const duckdbPath = filePath.replace(/\\/g, '/');

      await new Promise<void>((resolve, reject) => {
        connection.run(
          `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${duckdbPath}')`,
          err => (err ? reject(err) : resolve())
        );
      });
      
      loadedTables.push(tableName);
      console.log(`[Load CSV Tool] ✓ Loaded table: ${tableName}`);
    }
    
    return { 
      success: true,
      message: `Successfully loaded ${loadedTables.length} tables: ${loadedTables.join(", ")}`,
      tables: loadedTables 
    };
  },
});