# Chart and Export Improvements

## Summary of Changes

I've completely reworked the chart visualization and PDF export functionality to handle your specific use case for accuracy analysis.

## New Features

### 1. **Numeric Binning for Charts**
- The chart now automatically detects numeric columns (like accuracy percentages)
- Groups values into bins (e.g., 85.0-86.0%, 86.0-87.0%, 87.0-88.0%)
- Configurable bin sizes: 0.5%, 1%, 2%, 5%, or 10%
- Shows up to 50 bins for detailed analysis
- Bins are sorted in ascending order for easy reading

### 2. **Enhanced Chart Visualization**
- **Smart Column Detection**: Automatically identifies numeric vs. string columns
- **Bin Size Selector**: Appears when you select a numeric column (like accuracy)
- **Dynamic Titles**: Chart title updates to show "Distribution by [column] (X bins)"
- **Better Sorting**: Numeric bins sorted by value, not alphabetically

### 3. **Improved PDF Export**
- **Chart-Only Feature**: Export PDF button only appears in Chart View (not in Table View)
- **Chart Image Included**: Captures the chart visualization and includes it in the PDF
- **Professional Layout**: Portrait orientation with clean, readable formatting
- **Visual Summary**: Colored info boxes showing total records and column count
- **Smart Column Selection**: Shows only 6 most important columns in the data table
- **Multi-Page Layout**: 
  - Page 1: Title, metadata, chart visualization
  - Page 2: Summary statistics with colored boxes
  - Page 3: Sample data table (top 20 rows, 6 key columns)
- **Professional Formatting**: Better spacing, typography, and visual hierarchy

## How to Use

### For Your Specific Use Case:
```
"I want to see all entries that have captions less than 95% accurate"
```

**Steps:**
1. Run your query in the application
2. Click the **"Chart View"** tab
3. In the "Group By" dropdown, select your accuracy column (it will show "(Numeric)" next to it)
4. Adjust the **"Bin Size (%)"** to 1% for detailed analysis
5. The chart will show bars grouped by accuracy ranges (e.g., 85.0-86.0%, 86.0-87.0%)
6. Each bar shows the count of entries in that accuracy range
7. Click **"Export PDF"** to generate a PDF with:
   - The chart showing top 20 bars
   - A note explaining it only shows top 20
   - A data table with the top 20 rows

### Chart Types Available:
- **Bar Chart**: Best for seeing distribution across ranges
- **Line Chart**: Good for trend analysis
- **Pie Chart**: Shows proportions (limited to top 10)

## Technical Details

### Files Modified:

1. **`components/DataVisualization.tsx`**
   - Added numeric column detection
   - Implemented binning algorithm for percentage data
   - Added bin size selector UI
   - Fixed ResponsiveContainer lint errors
   - Added chart ref for export functionality

2. **`components/ResultsView.tsx`**
   - Enhanced PDF export with html2canvas
   - Added chart image capture
   - Implemented top 20 limitation with explanatory text
   - Multi-page PDF layout

### Dependencies Used:
- `recharts`: Chart rendering
- `jspdf`: PDF generation
- `jspdf-autotable`: Table formatting in PDF
- `html2canvas`: Chart to image conversion

## Example Output

When you query for accuracy < 95%, you'll see:

**Chart View:**
- X-axis: Accuracy ranges (85.0-86.0, 86.0-87.0, 87.0-88.0, etc.)
- Y-axis: Count of entries
- Bars showing distribution across accuracy ranges

**PDF Export:**
- Title: "Query Results Export"
- Metadata: Date, total results count
- Chart section with "Top 20 Bars" explanation
- Data table section with top 20 rows
- Footer note if more than 20 results exist

## Testing

To test the improvements:

1. Make sure you have CSV data with an accuracy column (numeric values 0-100)
2. Run a query like: "show entries with accuracy less than 95%"
3. Switch to Chart View
4. Select the accuracy column from "Group By"
5. Try different bin sizes (1% recommended for accuracy)
6. Export to PDF and verify it includes the chart

## Notes

- The bin size selector only appears for numeric columns
- For non-percentage data, the system automatically determines appropriate bin sizes
- Charts are limited to 50 bins maximum to maintain readability
- PDF exports are limited to top 20 for both chart and table to keep file size manageable
