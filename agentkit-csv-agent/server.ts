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
import { deduplicateEntries } from "./src/utils/deduplicateEntries.ts";

const app = express();
const port = process.env.PORT || 3001; // Changed to 3001
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Query cache: Map<queryText, {sql, timestamp}>
const queryCache = new Map<string, { sql: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds 

// --- Security Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log('[CORS] Allowing origin:', frontendUrl);

app.use(cors({
  origin: frontendUrl,
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
        throw error;
    }
}

// --- Helper function to calculate aggregations for charts ---
function calculateAggregations(data: any[]) {
    if (!data || data.length === 0) {
        return null;
    }

    console.log(`[Aggregations] Starting calculation for ${data.length} rows...`);
    const startTime = Date.now();

    // Initialize counters
    let machineAccurate = 0, machinePoor = 0;
    let humanAccurate = 0, humanPoor = 0;
    let noCaptions = 0;
    let hasEADCount = 0, hasADCount = 0;
    let acc_80_85 = 0, acc_85_90 = 0, acc_90_95 = 0, acc_95_100 = 0;

    // Single pass through data
    for (const row of data) {
        // Check captions
        const captionFields = [
            row.captions_language, row.CAPTIONS_LANGUAGE, row.caption_language,
            row.captions_usage_type, row.CAPTIONS_USAGE_TYPE, row.caption_type
        ];
        const hasCaps = captionFields.some(field => 
            field && field !== null && field !== '-' &&
            String(field).trim() !== '' && String(field).toLowerCase() !== 'none'
        );

        if (hasCaps) {
            const accuracyField = row.captions_accuracy || row.CAPTIONS_ACCURACY || row.caption_accuracy || '0';
            const accuracy = parseFloat(String(accuracyField).replace('%', ''));
            const creationMode = String(row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '').toLowerCase();
            
            const isMach = creationMode === 'machine';
            const isHum = creationMode === 'human' || creationMode === 'upload';
            
            if (isMach) {
                if (accuracy >= 95) machineAccurate++;
                else machinePoor++;
            } else if (isHum) {
                if (accuracy >= 95) humanAccurate++;
                else humanPoor++;
            }

            // Accuracy distribution
            if (accuracy >= 80 && accuracy < 85) acc_80_85++;
            else if (accuracy >= 85 && accuracy < 90) acc_85_90++;
            else if (accuracy >= 90 && accuracy < 95) acc_90_95++;
            else if (accuracy >= 95) acc_95_100++;
        } else {
            noCaptions++;
        }

        // Check EAD
        const eadField = row.has_ead || row.HAS_EAD || row.is_ead || row.IS_EAD || row.ead || row.EAD;
        if (eadField === true || eadField === 'true' || eadField === 1 ||
            String(eadField).toLowerCase() === 'yes' || String(eadField).toLowerCase() === 'true') {
            hasEADCount++;
        }

        // Check AD
        const adField = row.has_audio_description_flavor || row.HAS_AUDIO_DESCRIPTION_FLAVOR || 
                       row.has_ad || row.HAS_AD || row.ad || row.AD;
        if (adField === true || adField === 'true' || adField === 1 ||
            String(adField).toLowerCase() === 'yes' || String(adField).toLowerCase() === 'true') {
            hasADCount++;
        }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Aggregations] Completed in ${elapsed}ms`);

    return {
        totalEntries: data.length,
        captionData: {
            machineAccurate,
            machinePoor,
            humanAccurate,
            humanPoor,
            noCaptions,
            withCaptions: data.length - noCaptions
        },
        audioDescData: {
            hasEAD: hasEADCount,
            noEAD: data.length - hasEADCount,
            hasAD: hasADCount,
            noAD: data.length - hasADCount
        },
        accuracyDistribution: [
            { range: '80-85%', count: acc_80_85 },
            { range: '85-90%', count: acc_85_90 },
            { range: '90-95%', count: acc_90_95 },
            { range: '95-100%', count: acc_95_100 }
        ]
    };
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
                        // Convert to number since BigInt is returned as string
                        const rowCount = Number(countResult.rows[0].count);
                        totalRows += rowCount;
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
        let templateSql: string;
        
        // Check cache first
        const cached = queryCache.get(naturalQuery);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            console.log(`[POST /api/query] Using cached SQL for query: "${naturalQuery}"`);
            conversation.push("AGENT: Using cached SQL (fast path)...");
            templateSql = cached.sql;
        } else {
            // Generate new SQL and cache it
            conversation.push("AGENT: Generating SQL from query...");
            
            const firstTable = allTableNames[0];
            const sqlGenerationResult = await generateSql.handler({
                naturalLanguageQuery: naturalQuery,
                tableName: firstTable,
                columnSchema: columnNames,
            });
            templateSql = sqlGenerationResult.generatedSql.replace(/;$/, '').trim();
            
            // Cache the generated SQL
            queryCache.set(naturalQuery, { sql: templateSql, timestamp: now });
            console.log(`[POST /api/query] Cached SQL for query: "${naturalQuery}"`);
        }
        
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
                    // Only log first few tables to avoid console spam
                    if (allTableNames.indexOf(tableName) < 3) {
                        console.log(`[DEBUG] Query for ${tableName}: ${query}`);
                    }
                } else {
                    // Fallback: replace table name in FROM clause and remove ORDER BY
                    let query = templateSql.replace(/FROM\s+["']?\w+["']?/i, `FROM "${tableName}"`);
                    query = query.replace(/\s+ORDER\s+BY\s+.+$/i, '').trim();
                    unionQueries.push(query);
                    // Only log first few tables to avoid console spam
                    if (allTableNames.indexOf(tableName) < 3) {
                        console.log(`[DEBUG] Query for ${tableName} (fallback): ${query}`);
                    }
                }
            }
            
            // Build UNION query and add ORDER BY at the end
            finalSql = unionQueries.join(' UNION ALL ');
            if (orderByClause) {
                // Wrap in subquery to handle complex ORDER BY expressions
                finalSql = `SELECT * FROM (${finalSql}) AS union_result ORDER BY ${orderByClause}`;
            }
            // Log only a summary for large queries to avoid string length errors
            if (finalSql.length > 10000) {
                console.log(`[POST /api/query] Final UNION query length: ${finalSql.length} chars (too long to log)`);
            } else {
                console.log(`[POST /api/query] Final UNION query: ${finalSql}`);
            }
            
            // Keep conversation short for large queries
            const shortSql = finalSql.length > 200 
                ? finalSql.substring(0, 200) + '... (UNION query across all tables)'
                : finalSql;
            
            conversation.push(`AGENT: Generated SQL: ${shortSql}`);
            conversation.push(`AGENT: Combining results from ${allTableNames.length} tables`);
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
        
        // First, check the count to avoid loading huge datasets into memory
        const countSql = `SELECT COUNT(*) as total FROM (${validation.sanitizedSql || finalSql}) AS count_query`;
        console.log("[POST /api/query] Checking result count first...");
        
        const countResult = await queryDb.handler({ 
            sql: countSql, 
            connection: connection 
        });
        
        const totalRows = countResult.rows[0]?.total || 0;
        console.log(`[POST /api/query] Query will return ${totalRows} rows`);
        
        // If query returns more than 2M rows, use sampling + aggregation instead
        const MAX_SAFE_ROWS = 2000000;
        let rows: any[];
        let isSampled = false;
        
        if (totalRows > MAX_SAFE_ROWS) {
            console.log(`[POST /api/query] Large dataset detected (${totalRows} rows). Using sampling...`);
            conversation.push(`AGENT: Large dataset detected (${totalRows.toLocaleString()} rows). Using statistical sampling for performance...`);
            
            // Get a sample for preview and aggregations
            const sampleSql = `SELECT * FROM (${validation.sanitizedSql || finalSql}) AS sample_query ORDER BY RANDOM() LIMIT 50000`;
            const sampleResult = await queryDb.handler({ 
                sql: sampleSql, 
                connection: connection 
            });
            rows = sampleResult.rows;
            isSampled = true;
            conversation.push(`AGENT: Sampled ${rows.length.toLocaleString()} rows for analysis. Charts show estimated values. Export will include all ${totalRows.toLocaleString()} rows.`);
        } else {
            // Normal query execution for reasonable datasets
            const queryResult = await queryDb.handler({ 
                sql: validation.sanitizedSql || finalSql, 
                connection: connection 
            });
            rows = queryResult.rows;
            conversation.push(`AGENT: Query successful! Found ${rows.length} results.`);
        }
        
        // Deduplicate entries based on caption display rules
        const dedupedRows = deduplicateEntries(rows);
        if (dedupedRows.length !== rows.length) {
            conversation.push(`AGENT: Deduplicated ${rows.length} results to ${dedupedRows.length} (removed duplicate caption entries).`);
            rows = dedupedRows;
        }
        
        if (rows.length > 0) {
            conversation.push(`AGENT: First result: ${JSON.stringify(rows[0], null, 2)}`);
        }
        
        // Generate executive summary (compliance-focused) - AI Insights removed
        let executiveSummary: string | null = null;
        
        try {
            if (rows.length > 0 && !isSampled) {
                // Only generate summary for non-sampled data to avoid misleading statistics
                conversation.push("AGENT: Generating executive summary...");
                const analysisResult = await analyzeResults.handler({
                    userQuestion: naturalQuery,
                    queryResults: rows,
                    sqlQuery: finalSql
                });
                executiveSummary = analysisResult.answer;
                conversation.push(`AGENT: Executive summary generated successfully.`);
            } else if (isSampled) {
                // For sampled queries, provide a note instead of misleading summary
                executiveSummary = `**Note:** This query returned ${totalRows.toLocaleString()} total entries, which is too large to analyze in detail. The dashboard shows estimated statistics based on a statistical sample of 50,000 rows. For detailed analysis, please use more specific filters or export the full dataset.`;
                conversation.push(`AGENT: Skipping detailed summary for large dataset. Showing sample-based statistics.`);
            }
        } catch (analysisError) {
            console.error("[POST /api/query] AI analysis failed:", analysisError);
            conversation.push(`AGENT: AI analysis failed, but query results are still available.`);
            // Don't fail the whole request if analysis fails
        }
        
        // Calculate aggregations for charts (server-side to avoid sending huge datasets)
        const aggregations = calculateAggregations(rows);
        
        // Limit preview results to prevent JSON string length errors
        const MAX_PREVIEW = 1000; // Maximum rows for preview table
        let previewRows = rows.slice(0, MAX_PREVIEW);
        
        // Use actual total count (from COUNT query) if sampled, otherwise use rows.length
        let totalRowCount = isSampled ? totalRows : rows.length;
        
        if (rows.length > MAX_PREVIEW) {
            console.log(`[POST /api/query] Returning ${MAX_PREVIEW} preview rows from ${totalRowCount} total`);
            if (!isSampled) {
                conversation.push(`AGENT: Found ${totalRowCount.toLocaleString()} total results. Showing first ${MAX_PREVIEW.toLocaleString()} rows in preview. Charts show full dataset. Export to Excel for all data.`);
            }
        }
        
        // Return JSON (not HTML)
        return res.json({
            success: true,
            conversation,
            results: previewRows, // Preview rows for table
            aggregations: aggregations, // Pre-calculated stats for charts (from sample if large)
            totalCount: totalRowCount, // Always show the actual total count
            displayedCount: previewRows.length,
            limitedResults: totalRowCount > MAX_PREVIEW,
            isSampled: isSampled, // Flag to indicate if data is sampled
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
        
        // For large datasets (>1M rows), use CSV to avoid memory issues
        // Excel has a limit of 1,048,576 rows anyway
        if (rows.length > 1000000) {
            console.log(`[POST /api/export] Large dataset detected, using CSV format`);
            const filename = `query_results_${timestamp}.csv`;
            
            // Stream CSV to avoid memory issues
            const columns = Object.keys(rows[0]);
            const csvHeader = columns.join(',') + '\n';
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Write header
            res.write(csvHeader);
            
            // Stream rows in chunks
            const chunkSize = 10000;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const csvChunk = chunk.map(row => 
                    columns.map(col => {
                        const value = row[col];
                        const stringValue = value !== null && value !== undefined ? String(value) : '';
                        return stringValue.includes(',') || stringValue.includes('\n') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
                    }).join(',')
                ).join('\n') + '\n';
                res.write(csvChunk);
                
                // Log progress
                if (i % 100000 === 0) {
                    console.log(`[POST /api/export] Streamed ${i + chunk.length} / ${rows.length} rows`);
                }
            }
            
            res.end();
            console.log(`[POST /api/export] CSV export completed`);
        } else {
            // For smaller datasets, use Excel
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
        }
        
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