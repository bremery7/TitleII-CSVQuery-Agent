/**
 * SQL Injection Protection Utilities
 * Provides validation and sanitization for SQL queries
 */

/**
 * Whitelist of allowed SQL operations
 */
const ALLOWED_OPERATIONS = [
  'SELECT',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'GROUP BY',
  'ORDER BY',
  'LIMIT',
  'WHERE',
  'AND',
  'OR',
  'LIKE',
  'IN',
  'BETWEEN',
  'AS',
  'FROM',
  'JOIN',
  'UNION ALL'
];

/**
 * Dangerous SQL keywords that should be blocked
 */
const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'INSERT',
  'UPDATE',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'EXEC',
  'EXECUTE',
  'SCRIPT',
  '--',
  ';--',
  '/*',
  '*/',
  'xp_',
  'sp_',
  'UNION SELECT',
  'INFORMATION_SCHEMA',
  'SYSOBJECTS',
  'SYSCOLUMNS'
];

/**
 * Validates that SQL query only contains allowed operations
 */
export function validateSqlQuery(sql: string): { valid: boolean; error?: string } {
  const upperSql = sql.toUpperCase();

  // Check for dangerous keywords with word boundaries to avoid false positives
  // (e.g., "created_at" should not trigger "CREATE")
  for (const keyword of DANGEROUS_KEYWORDS) {
    const upperKeyword = keyword.toUpperCase();
    
    // For keywords with special characters, use simple includes
    if (keyword.includes('_') || keyword.includes('-') || keyword.includes('/') || keyword.includes('*')) {
      if (upperSql.includes(upperKeyword)) {
        return {
          valid: false,
          error: `Dangerous SQL operation detected: ${keyword}`
        };
      }
    } else {
      // For word keywords, use word boundary regex to avoid false positives
      const wordBoundaryRegex = new RegExp(`\\b${upperKeyword}\\b`, 'i');
      if (wordBoundaryRegex.test(upperSql)) {
        return {
          valid: false,
          error: `Dangerous SQL operation detected: ${keyword}`
        };
      }
    }
  }

  // Check for multiple statements (SQL injection attempt)
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  if (statements.length > 1) {
    return {
      valid: false,
      error: 'Multiple SQL statements are not allowed'
    };
  }

  // Ensure query starts with SELECT (read-only)
  if (!upperSql.trim().startsWith('SELECT')) {
    return {
      valid: false,
      error: 'Only SELECT queries are allowed'
    };
  }

  return { valid: true };
}

/**
 * Sanitizes table name to prevent SQL injection
 */
export function sanitizeTableName(tableName: string): string {
  // Remove any characters that aren't alphanumeric or underscore
  return tableName.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Sanitizes column name to prevent SQL injection
 */
export function sanitizeColumnName(columnName: string): string {
  // Remove any characters that aren't alphanumeric, underscore, or dot (for table.column)
  return columnName.replace(/[^a-zA-Z0-9_.]/g, '_');
}

/**
 * Escapes string values for SQL (basic protection)
 * Note: DuckDB should handle parameterized queries, but this adds extra layer
 */
export function escapeSqlString(value: string): string {
  // Escape single quotes by doubling them
  return value.replace(/'/g, "''");
}

/**
 * Validates that a table name exists in the allowed list
 */
export function validateTableName(tableName: string, allowedTables: string[]): boolean {
  const sanitized = sanitizeTableName(tableName);
  return allowedTables.includes(sanitized);
}

/**
 * Comprehensive SQL query validation
 */
export function validateAndSanitizeSql(
  sql: string,
  allowedTables: string[]
): { valid: boolean; sanitizedSql?: string; error?: string } {
  
  // First, validate the query structure
  const validation = validateSqlQuery(sql);
  if (!validation.valid) {
    return validation;
  }

  // Extract table names from the query
  const tablePattern = /FROM\s+([a-zA-Z0-9_]+)/gi;
  const matches = sql.matchAll(tablePattern);
  
  for (const match of matches) {
    const tableName = match[1];
    if (!validateTableName(tableName, allowedTables)) {
      return {
        valid: false,
        error: `Table '${tableName}' is not allowed or does not exist`
      };
    }
  }

  return {
    valid: true,
    sanitizedSql: sql
  };
}

/**
 * Logs potentially suspicious SQL patterns for monitoring
 */
export function logSuspiciousQuery(sql: string, userId?: string): void {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY] Suspicious SQL query detected at ${timestamp}`);
  if (userId) {
    console.warn(`[SECURITY] User ID: ${userId}`);
  }
  console.warn(`[SECURITY] Query: ${sql.substring(0, 200)}...`);
}
