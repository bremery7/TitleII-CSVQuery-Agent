/**
 * Deduplicates entries based on caption file rules:
 * - Only show captions where display_on_player = 'yes'
 * - If multiple captions for same entry:
 *   - Keep all different languages
 *   - For same language, keep only highest accuracy
 */

interface CaptionEntry {
  entry_id: string;
  captions_display_on_player?: string;
  captions_language?: string;
  captions_language_code?: string;
  captions_accuracy?: string | number;
  [key: string]: any;
}

export function deduplicateEntries(rows: any[]): any[] {
  if (!rows || rows.length === 0) {
    return rows;
  }

  // Group entries by entry_id
  const entriesByIdMap = new Map<string, CaptionEntry[]>();
  
  for (const row of rows) {
    const entryId = row.entry_id || row.ENTRY_ID || row.Entry_ID;
    
    if (!entryId) {
      // If no entry_id, keep the row as-is
      continue;
    }

    if (!entriesByIdMap.has(entryId)) {
      entriesByIdMap.set(entryId, []);
    }
    entriesByIdMap.get(entryId)!.push(row);
  }

  const dedupedResults: any[] = [];

  // Process each entry group
  for (const [entryId, entries] of entriesByIdMap.entries()) {
    // Filter to only captions with display_on_player = 'yes'
    const displayedCaptions = entries.filter(entry => {
      const displayOnPlayer = entry.captions_display_on_player || 
                             entry.CAPTIONS_DISPLAY_ON_PLAYER || 
                             entry.Captions_Display_On_Player;
      
      return displayOnPlayer && 
             (String(displayOnPlayer).toLowerCase() === 'yes' || 
              String(displayOnPlayer).toLowerCase() === 'true' ||
              String(displayOnPlayer) === '1');
    });

    // If no captions with display_on_player = yes, keep first entry
    if (displayedCaptions.length === 0) {
      dedupedResults.push(entries[0]);
      continue;
    }

    // Group by language
    const byLanguageMap = new Map<string, CaptionEntry[]>();
    
    for (const caption of displayedCaptions) {
      const language = (caption.captions_language || 
                       caption.CAPTIONS_LANGUAGE || 
                       caption.Captions_Language ||
                       caption.captions_language_code ||
                       caption.CAPTIONS_LANGUAGE_CODE ||
                       'unknown').toLowerCase().trim();
      
      if (!byLanguageMap.has(language)) {
        byLanguageMap.set(language, []);
      }
      byLanguageMap.get(language)!.push(caption);
    }

    // For each language, keep only the highest accuracy
    for (const [language, captions] of byLanguageMap.entries()) {
      if (captions.length === 1) {
        dedupedResults.push(captions[0]);
      } else {
        // Multiple captions in same language - keep highest accuracy
        const sorted = captions.sort((a, b) => {
          const accuracyA = parseAccuracy(a.captions_accuracy || a.CAPTIONS_ACCURACY || '0');
          const accuracyB = parseAccuracy(b.captions_accuracy || b.CAPTIONS_ACCURACY || '0');
          return accuracyB - accuracyA; // Descending order
        });
        
        dedupedResults.push(sorted[0]); // Keep highest accuracy
      }
    }
  }

  // Add back any rows without entry_id
  for (const row of rows) {
    const entryId = row.entry_id || row.ENTRY_ID || row.Entry_ID;
    if (!entryId) {
      dedupedResults.push(row);
    }
  }

  console.log(`[Deduplication] Input: ${rows.length} rows, Output: ${dedupedResults.length} rows`);
  
  return dedupedResults;
}

/**
 * Parse accuracy value from string or number
 * Handles formats like: "95%", "95", 95, etc.
 */
function parseAccuracy(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove % sign and parse
    const cleaned = value.replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}
