// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

// Then all other imports
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import path from 'path';
import fs from 'fs';
import duckdb from 'duckdb';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { queryDb } from "./src/tools/queryDb.ts";
import { generateSql } from "./src/tools/generateSql.ts";
import { loadCsvFolder } from "./src/tools/loadCsvFolder.ts";
import { exportExcel } from "./src/tools/exportExcel.ts";
import { analyzeResults } from "./src/tools/analyzeResults.ts";
// import { generateInsights } from "./src/tools/generateInsights.ts"; // No longer used - AI Insights removed
import { authenticateToken, requireAdmin } from "./src/middleware/auth.ts";
import type { AuthRequest } from "./src/middleware/auth.ts";
import { validateAndSanitizeSql, logSuspiciousQuery } from "./src/utils/sqlSanitizer.ts";

const app = express();
const port = process.env.PORT || 3001; // Changed to 3001
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 

// --- Security Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Body parsing - increased limits for large CSV files
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// --- 0. Shared Resources (Initialize once) ---
let db: duckdb.Database;
let connection: duckdb.Connection;
let allTableNames: string[] = [];
let columnNames: string[] = [];

// Setup multer for file uploads
const dataFolderPath = path.resolve("./data");
const upload = multer({ 
  dest: dataFolderPath,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB limit for large CSV files
    fieldSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// --- Initialization Function ---
async function initializeAgent() {
    try {
        const dbPath = path.resolve("entries.duckdb");
        console.log(`[API Server] Initializing database at: ${dbPath}`);
        db = new duckdb.Database(dbPath);
        connection = db.connect();

        console.log("=== STEP 1: Loading CSVs on startup ===");
        
        if (!fs.existsSync(dataFolderPath)) {
            console.warn("[API Server] 'data' folder not found. Creating it...");
            fs.mkdirSync(dataFolderPath, { recursive: true });
        } else {
            const loadResult = await loadCsvFolder.handler({ 
                folderPath: "./data", 
                connection: connection, 
                db: db 
            });
            allTableNames = loadResult.tables;
            console.log(`[API Server] Loaded tables: ${allTableNames.join(', ')}`);
            console.log(`[API Server] Total tables loaded: ${allTableNames.length}`);
            
            if (allTableNames.length > 0) {
              const firstTable = loadResult.tables[0];
              const schemaResult = await queryDb.handler({ 
                  sql: `PRAGMA table_info('${firstTable}')`, 
                  connection: connection 
              });
              columnNames = schemaResult.rows.map((row: any) => row.name); 
              console.log(`[API Server] Columns loaded: ${columnNames.join(', ')}`);
            }
        }
        
        console.log("=== Initialization Complete ===");
        
    } catch (error) {
        console.error("\n*** CRITICAL INITIALIZATION FAILURE ***\n", error);
        process.exit(1);
    }
}

// --- Helper function to reload tables ---
async function reloadTables() {
    try {
        console.log("[API Server] Reloading tables after file upload...");
        allTableNames = [];
        columnNames = [];
        
        const loadResult = await loadCsvFolder.handler({ 
            folderPath: "./data", 
            connection: connection, 
            db: db 
        });
        allTableNames = loadResult.tables;
        console.log(`[API Server] Reloaded tables: ${allTableNames.join(', ')}`);
        
        if (allTableNames.length > 0) {
            const firstTable = loadResult.tables[0];
            const schemaResult = await queryDb.handler({ 
                sql: `PRAGMA table_info('${firstTable}')`, 
                connection: connection 
            });
            columnNames = schemaResult.rows.map((row: any) => row.name);
            console.log(`[API Server] Reloaded columns: ${columnNames.join(', ')}`);
        }
    } catch (error) {
        console.error("[API Server] Error reloading tables:", error);
    }
}

// --- API Routes (JSON only, no HTML) ---

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        tables: allTableNames.length
    });
});

// GET /api/database-info - Return database metadata
app.get('/api/database-info', async (req, res) => {
    try {
        let totalRows = 0;
        
        // Get row count for all tables
        if (allTableNames.length > 0) {
            for (const tableName of allTableNames) {
                try {
                    const countResult = await queryDb.handler({
                        sql: `SELECT COUNT(*) as count FROM "${tableName}"`,
                        connection: connection
                    });
                    if (countResult.rows && countResult.rows.length > 0) {
                        totalRows += countResult.rows[0].count;
                    }
                } catch (err) {
                    console.warn(`[GET /api/database-info] Could not count rows for ${tableName}:`, err);
                }
            }
        }
        
        res.json({
            tables: allTableNames || [],
            columns: columnNames || [],
            rowCount: totalRows
        });
    } catch (error) {
        console.error('[GET /api/database-info] Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch database info',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/files - List all uploaded CSV files
app.get('/api/files', (req, res) => {
    try {
        if (!fs.existsSync(dataFolderPath)) {
            return res.json({ files: [] });
        }
        
        const files = fs.readdirSync(dataFolderPath)
            .filter(f => f.endsWith('.csv'))
            .map(filename => {
                const filePath = path.join(dataFolderPath, filename);
                const stats = fs.statSync(filePath);
                return {
                    name: filename,
                    size: stats.size,
                    uploadedAt: stats.mtime.toISOString()
                };
            });
        
        res.json({ files });
    } catch (error) {
        console.error("[GET /api/files] Error:", error);
        res.status(500).json({ error: "Failed to list files" });
    }
});

// DELETE /api/files - Delete CSV files (authentication temporarily disabled for testing)
app.delete('/api/files', async (req, res) => {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    try {
        const dataDir = path.resolve('./data');
        
        let deletedCount = 0;
        const errors: string[] = [];

        for (const filename of files) {
            let fileDeleted = false;
            let tableDropped = false;
            
            try {
                // Remove .csv extension if present to get table name
                let tableName = filename.replace('.csv', '');
                // Sanitize table name (same logic as upload)
                tableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const filePath = path.join(dataDir, filename);
                
                console.log(`[DELETE /api/files] Attempting to delete file: ${filename}, table: ${tableName}`);
                console.log(`[DELETE /api/files] File path: ${filePath}`);
                console.log(`[DELETE /api/files] Current allTableNames:`, allTableNames);
                
                // IMPORTANT: Drop the table from DuckDB FIRST to release the file lock
                try {
                    await new Promise<void>((resolve, reject) => {
                        connection.run(`DROP TABLE IF EXISTS "${tableName}"`, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    tableDropped = true;
                    console.log(`[DELETE /api/files] ✓ Dropped table: ${tableName}`);
                } catch (dbErr) {
                    console.error(`[DELETE /api/files] ✗ Could not drop table ${tableName}:`, dbErr);
                }
                
                // Now delete the physical file (after table is dropped and file is unlocked)
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        fileDeleted = true;
                        console.log(`[DELETE /api/files] ✓ Deleted file: ${filename}`);
                    } else {
                        console.warn(`[DELETE /api/files] ⚠ File not found: ${filePath}`);
                    }
                } catch (fileErr) {
                    console.error(`[DELETE /api/files] ✗ Error deleting file ${filename}:`, fileErr);
                }
                
                // Remove from allTableNames array
                const index = allTableNames.indexOf(tableName);
                if (index > -1) {
                    allTableNames.splice(index, 1);
                    console.log(`[DELETE /api/files] ✓ Removed ${tableName} from allTableNames`);
                } else {
                    console.warn(`[DELETE /api/files] ⚠ Table ${tableName} not found in allTableNames`);
                }
                
                // Count as success if either file or table was deleted
                if (fileDeleted || tableDropped) {
                    deletedCount++;
                } else {
                    errors.push(filename);
                }
                
            } catch (err) {
                console.error(`[DELETE /api/files] ✗ Unexpected error deleting ${filename}:`, err);
                errors.push(filename);
            }
        }

        if (errors.length > 0) {
            res.json({ 
                success: false, 
                error: `Failed to delete: ${errors.join(', ')}`,
                deletedCount 
            });
        } else {
            res.json({ 
                success: true, 
                deletedCount,
                message: `Successfully deleted ${deletedCount} file(s)` 
            });
        }
        
    } catch (error) {
        console.error('[DELETE /api/files] Delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete files'
        });
    }
});

// Upload CSV file (authentication temporarily disabled for testing)
app.post('/api/upload', async (req, res) => {
    upload.single('csvFile')(req, res, async (err) => {
        if (err) {
            console.error("[POST /api/upload] Multer error:", err);
            return res.status(400).json({ 
                success: false,
                error: "File upload error",
                message: err.message 
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: "No file uploaded" 
                });
            }

            console.log(`[POST /api/upload] File uploaded: ${req.file.originalname}`);
            
            const finalPath = path.join(dataFolderPath, req.file.originalname);
            
            // Check if file already exists and handle it
            if (fs.existsSync(finalPath)) {
                console.log(`[POST /api/upload] File already exists, will overwrite: ${finalPath}`);
                
                // Drop the table first to release the file lock
                let tableName = req.file.originalname.replace('.csv', '');
                tableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
                
                try {
                    await new Promise<void>((resolve, reject) => {
                        connection.run(`DROP TABLE IF EXISTS "${tableName}"`, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    console.log(`[POST /api/upload] Dropped existing table: ${tableName}`);
                } catch (dbErr) {
                    console.warn(`[POST /api/upload] Could not drop table ${tableName}:`, dbErr);
                }
                
                // Now try to delete the file
                try {
                    fs.unlinkSync(finalPath);
                    console.log(`[POST /api/upload] Deleted existing file: ${finalPath}`);
                } catch (fileErr) {
                    console.warn(`[POST /api/upload] Could not delete existing file:`, fileErr);
                }
            }
            
            fs.renameSync(req.file.path, finalPath);
            
            console.log(`[POST /api/upload] File saved to: ${finalPath}`);
            
            await reloadTables();
            
            res.json({ 
                success: true, 
                message: "File uploaded successfully",
                filename: req.file.originalname
            });
        } catch (error) {
            console.error("[POST /api/upload] Upload failed:", error);
            res.status(500).json({ 
                success: false,
                error: "Upload failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    });
});

// Delete files (authentication temporarily disabled for testing)
app.post('/api/delete-files', async (req, res) => {
    try {
        const { files } = req.body;
        
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: "Invalid files list" });
        }
        
        console.log(`[POST /api/delete-files] Deleting files: ${files.join(', ')}`);
        
        for (const file of files) {
            const filePath = path.join(dataFolderPath, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[POST /api/delete-files] Deleted: ${file}`);
            }
        }
        
        await reloadTables();
        
        res.json({ 
            success: true, 
            message: `Deleted ${files.length} file(s)` 
        });
    } catch (error) {
        console.error("[POST /api/delete-files] Error:", error);
        res.status(500).json({ error: "Failed to delete files" });
    }
});

// Query endpoint - RETURNS JSON (authentication temporarily disabled for testing)
app.post('/api/query', async (req, res) => {
    const naturalQuery = req.body.query;
    const conversation: string[] = [];
    
    conversation.push(`USER: ${naturalQuery}`);

    if (!allTableNames || allTableNames.length === 0) {
        conversation.push("AGENT: ERROR: No database tables were initialized.");
        return res.json({ 
            success: false,
            error: "No tables loaded",
            conversation 
        });
    }

    try {
        conversation.push("AGENT: Generating SQL from query...");
        
        const firstTable = allTableNames[0];
        const sqlGenerationResult = await generateSql.handler({
            naturalLanguageQuery: naturalQuery,
            tableName: firstTable,
            columnSchema: columnNames,
        });
        let templateSql = sqlGenerationResult.generatedSql.replace(/;$/, '').trim();
        
        let finalSql = templateSql;

        if (allTableNames.length > 1) {
            console.log(`[POST /api/query] Multiple tables detected: ${allTableNames.join(', ')}`);
            
            conversation.push(`AGENT: Detected ${allTableNames.length} tables, building UNION query...`);
            
            const unionQueries: string[] = [];
            
            // Extract ORDER BY clause once (it will be applied after UNION)
            const orderMatch = templateSql.match(/ORDER\s+BY\s+(.+)$/i);
            const orderByClause = orderMatch ? orderMatch[1] : null;
            
            for (const tableName of allTableNames) {
                // Extract WHERE clause without ORDER BY
                const whereMatch = templateSql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY\s+.+)?$/is);
                const selectMatch = templateSql.match(/SELECT\s+(.+?)\s+FROM/is);
                
                if (whereMatch && selectMatch) {
                    const selectClause = selectMatch[1];
                    const whereClause = whereMatch[1].replace(/\s+ORDER\s+BY\s+.+$/i, '').trim();
                    const query = `SELECT ${selectClause} FROM "${tableName}" WHERE ${whereClause}`;
                    unionQueries.push(query);
                    console.log(`[DEBUG] Query for ${tableName}: ${query}`);
                } else {
                    // Fallback: replace table name in FROM clause and remove ORDER BY
                    let query = templateSql.replace(/FROM\s+["']?\w+["']?/i, `FROM "${tableName}"`);
                    query = query.replace(/\s+ORDER\s+BY\s+.+$/i, '').trim();
                    unionQueries.push(query);
                    console.log(`[DEBUG] Query for ${tableName} (fallback): ${query}`);
                }
            }
            
            // Build UNION query and add ORDER BY at the end
            finalSql = unionQueries.join(' UNION ALL ');
            if (orderByClause) {
                // Wrap in subquery to handle complex ORDER BY expressions
                finalSql = `SELECT * FROM (${finalSql}) AS union_result ORDER BY ${orderByClause}`;
            }
            console.log(`[POST /api/query] Final UNION query: ${finalSql}`);
            
            const shortSql = finalSql.length > 200 
                ? finalSql.substring(0, 200) + '... (UNION query across all tables)'
                : finalSql;
            
            conversation.push(`AGENT: Generated SQL: ${shortSql}`);
            conversation.push(`AGENT: Combining results from ${allTableNames.length} tables: ${allTableNames.join(', ')}`);
        } else {
            conversation.push(`AGENT: Generated SQL: ${templateSql}`);
        }

        // Validate SQL for security
        const validation = validateAndSanitizeSql(finalSql, allTableNames);
        if (!validation.valid) {
            console.error(`[POST /api/query] SQL validation failed: ${validation.error}`);
            logSuspiciousQuery(finalSql, req.user?.id);
            conversation.push(`AGENT: Security validation failed: ${validation.error}`);
            return res.status(400).json({
                success: false,
                error: `SQL validation failed: ${validation.error}`,
                conversation
            });
        }

        conversation.push("AGENT: Executing query...");
        
        const queryResult = await queryDb.handler({ 
            sql: validation.sanitizedSql || finalSql, 
            connection: connection 
        });
        
        const rows = queryResult.rows;
        conversation.push(`AGENT: Query successful! Found ${rows.length} results.`);
        
        if (rows.length > 0) {
            conversation.push(`AGENT: First result: ${JSON.stringify(rows[0], null, 2)}`);
        }
        
        // Generate executive summary (compliance-focused) - AI Insights removed
        let executiveSummary: string | null = null;
        
        try {
            if (rows.length > 0) {
                // Generate Executive Summary (compliance metrics)
                conversation.push("AGENT: Generating executive summary...");
                const analysisResult = await analyzeResults.handler({
                    userQuestion: naturalQuery,
                    queryResults: rows,
                    sqlQuery: finalSql
                });
                executiveSummary = analysisResult.answer;
                conversation.push(`AGENT: Executive summary generated successfully.`);
            }
        } catch (analysisError) {
            console.error("[POST /api/query] AI analysis failed:", analysisError);
            conversation.push(`AGENT: AI analysis failed, but query results are still available.`);
            // Don't fail the whole request if analysis fails
        }
        
        // Return JSON (not HTML)
        return res.json({
            success: true,
            conversation,
            results: rows,
            sql: finalSql,
            insights: null, // No longer generating insights
            executiveSummary: executiveSummary
        });

    } catch (error) {
        console.error("[POST /api/query] Orchestration failed:", error);
        conversation.push(`AGENT: *** ORCHESTRATION FAILED ***`);
        conversation.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        
        // Return JSON error
        return res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : String(error),
            conversation 
        });
    }
});

// Export endpoint (authentication temporarily disabled for testing)
app.post('/api/export', async (req, res) => {
    const { sql } = req.body;
    
    if (!sql) {
        return res.status(400).json({ error: "No SQL query provided" });
    }

    try {
        // Validate SQL for security
        const validation = validateAndSanitizeSql(sql, allTableNames);
        if (!validation.valid) {
            console.error(`[POST /api/export] SQL validation failed: ${validation.error}`);
            logSuspiciousQuery(sql, req.user?.id);
            return res.status(400).json({
                error: `SQL validation failed: ${validation.error}`
            });
        }

        console.log("[POST /api/export] Executing query for export...");
        
        const queryResult = await queryDb.handler({ 
            sql: validation.sanitizedSql || sql, 
            connection: connection 
        });
        
        const rows = queryResult.rows;
        console.log(`[POST /api/export] Exporting ${rows.length} rows`);
        
        if (rows.length === 0) {
            return res.status(400).json({ error: "No results to export" });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `query_results_${timestamp}.xlsx`;
        
        const exportResult = await exportExcel.handler({
            data: rows,
            filename: filename
        });
        
        console.log(`[POST /api/export] File created: ${exportResult.file}`);
        
        res.download(exportResult.file, filename, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Clean up file after download
            setTimeout(() => {
                if (fs.existsSync(exportResult.file)) {
                    fs.unlinkSync(exportResult.file);
                }
            }, 5000);
        });
        
    } catch (error) {
        console.error("[POST /api/export] Error:", error);
        res.status(500).json({ 
            error: "Export failed",
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// --- Server Startup ---
(async () => {
    await initializeAgent();
    app.listen(port, () => {
        console.log(`\n🚀 API Server running at http://localhost:${port}`);
        console.log(`📊 Health check: http://localhost:${port}/api/health`);
    });
})();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[API Server] Shutting down...');
    if (connection) connection.close();
    if (db) db.close();
    process.exit(0);
});