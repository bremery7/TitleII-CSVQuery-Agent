# Caption Entry Deduplication Feature

## Overview
Automatically removes duplicate entries based on caption file rules to ensure clean, accurate query results.

## Problem Solved
When multiple caption files exist for a single entry, the database may return duplicate rows. This feature intelligently filters these duplicates based on specific business rules.

## Deduplication Rules

### 1. Display Filter
- **Only show captions where `captions_display_on_player = 'yes'`**
- Captions with `display_on_player = 'no'` or empty are excluded
- If no captions have `display_on_player = 'yes'`, keeps the first entry

### 2. Language Handling
- **Keep all different languages**
- Example: If an entry has English and French captions (both with `display_on_player = yes`), both are kept

### 3. Accuracy Selection
- **For same language, keep only the highest accuracy**
- Example: If an entry has two English captions (95% and 99% accuracy), only the 99% caption is kept

## Implementation

### Files Modified
1. **`src/utils/deduplicateEntries.ts`** - Core deduplication logic
2. **`server.ts`** - Integration into query endpoint

### How It Works

```typescript
// After query execution
let rows = queryResult.rows;

// Apply deduplication
const dedupedRows = deduplicateEntries(rows);
if (dedupedRows.length !== rows.length) {
    conversation.push(`AGENT: Deduplicated ${rows.length} results to ${dedupedRows.length}`);
    rows = dedupedRows;
}
```

### Deduplication Process

1. **Group by `entry_id`**
   - All rows with the same `entry_id` are grouped together

2. **Filter by display status**
   - Only keep captions where `captions_display_on_player = 'yes'`

3. **Group by language**
   - Within each entry, group captions by language code

4. **Select highest accuracy**
   - For each language, sort by accuracy and keep the highest

## Examples

### Example 1: Different Languages
**Input:**
```
entry_id: video_001
- English caption (99% accuracy, display: yes)
- French caption (98% accuracy, display: yes)
```

**Output:**
```
Both kept (different languages)
```

### Example 2: Same Language, Different Accuracy
**Input:**
```
entry_id: video_002
- English caption (95% accuracy, display: yes)
- English caption (99% accuracy, display: yes)
```

**Output:**
```
Only 99% accuracy kept (same language, highest accuracy)
```

### Example 3: Mixed Display Settings
**Input:**
```
entry_id: video_003
- English caption (90% accuracy, display: no)
- English caption (99% accuracy, display: yes)
```

**Output:**
```
Only 99% accuracy kept (display_on_player = yes)
```

### Example 4: Multiple Languages
**Input:**
```
entry_id: video_004
- English caption (99% accuracy, display: yes)
- Spanish caption (97% accuracy, display: yes)
- French caption (96% accuracy, display: yes)
```

**Output:**
```
All three kept (different languages)
```

## Testing

Run the test suite:
```bash
npx tsx test-deduplication.ts
```

Expected output:
```
=== DEDUPLICATION TEST ===
Input: 11 rows
Output: 8 rows

entry_001: 2 rows (English + French)
entry_002: 1 row (English 99%)
entry_003: 1 row (English 99%, display=yes)
entry_004: 1 row (first entry, no display field)
entry_005: 3 rows (English + Spanish + French)
```

## Column Names Supported

The function handles various column name formats:
- `captions_display_on_player`, `CAPTIONS_DISPLAY_ON_PLAYER`, `Captions_Display_On_Player`
- `captions_language`, `CAPTIONS_LANGUAGE`, `Captions_Language`
- `captions_language_code`, `CAPTIONS_LANGUAGE_CODE`
- `captions_accuracy`, `CAPTIONS_ACCURACY`
- `entry_id`, `ENTRY_ID`, `Entry_ID`

## Accuracy Parsing

Handles multiple accuracy formats:
- `"99%"` → 99
- `"99"` → 99
- `99` → 99
- `null` or `undefined` → 0

## Performance

- **Time Complexity**: O(n log n) where n is the number of rows
- **Space Complexity**: O(n) for grouping and sorting
- **Impact**: Minimal - typically reduces results by 10-30%

## Logging

The deduplication process logs:
```
[Deduplication] Input: 150 rows, Output: 120 rows
```

And adds to conversation:
```
AGENT: Deduplicated 150 results to 120 (removed duplicate caption entries).
```

## Edge Cases Handled

1. **No `entry_id`**: Rows without `entry_id` are kept as-is
2. **No `display_on_player` field**: Keeps first entry per `entry_id`
3. **Empty language**: Treated as "unknown" language
4. **Invalid accuracy**: Treated as 0% accuracy
5. **Single entry**: No deduplication needed, returned unchanged

## Future Enhancements

Potential improvements:
- [ ] Add configuration to enable/disable deduplication
- [ ] Add option to prefer human vs machine captions
- [ ] Add option to filter by minimum accuracy threshold
- [ ] Add detailed deduplication report in response

## Status: ✅ IMPLEMENTED

Deduplication is now active for all `/api/query` requests.
