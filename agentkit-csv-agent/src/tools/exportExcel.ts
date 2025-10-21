import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export const exportExcel = createTool({
  name: "export-excel",
  description: "Export query results to an Excel file",
  inputSchema: z.object({
    data: z.array(z.record(z.unknown())).describe("Array of objects to export"),
    filename: z.string().optional().default("results.xlsx"),
  }),
  handler: async ({ data, filename }) => {
    try {
      console.log(`\n[Export Tool] Received ${data.length} rows to export`);
      
      // Create temp directory if it doesn't exist
      const tempDir = path.resolve('./temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`[Export Tool] Created temp directory: ${tempDir}`);
      }
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const outputFile = filename || "results.xlsx";
      const fullPath = path.join(tempDir, outputFile);
      
      console.log(`[Export Tool] Attempting to write to: ${fullPath}`);
      
      XLSX.writeFile(wb, fullPath);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`[Export Tool] File created successfully: ${fullPath}`);
        console.log(`[Export Tool] File size: ${stats.size} bytes`);
        return { 
          success: true, 
          file: fullPath,
          rows: data.length 
        };
      } else {
        throw new Error("File was not created");
      }
    } catch (error) {
      console.error(`[Export Tool] Error:`, error);
      throw error;
    }
  },
});