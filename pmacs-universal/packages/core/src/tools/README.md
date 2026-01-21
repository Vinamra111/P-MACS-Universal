# P-MACS LangChain Tools

Complete set of 26 specialized tools for pharmacy inventory management, forecasting, and analytics.

## Tool Categories

### 1. Inventory Management (6 tools)

#### ✅ `lookup_inventory`
- **Status**: Implemented
- **Purpose**: Find drug information by name (fuzzy matching supported)
- **Use cases**: "Where is Propofol?", "Find Morphine", "Show Insulin stock"
- **Returns**: Drug locations, quantities, status, expiry info

#### ✅ `update_inventory`
- **Status**: Implemented
- **Purpose**: Update stock quantity (Pharmacist/Master only)
- **Use cases**: "Add 50 Propofol to ICU", "Update stock", "Received 200 units"
- **Returns**: Update confirmation with transaction log

#### ✅ `list_ward_stock`
- **Status**: Implemented
- **Purpose**: List all inventory for a specific location
- **Use cases**: "Show ICU stock", "What's in ER?", "Ward-A inventory"
- **Returns**: Complete location inventory with status summary

#### ✅ `get_full_inventory`
- **Status**: Implemented
- **Purpose**: Complete inventory overview with filters
- **Use cases**: "Show full inventory", "List all drugs", "All controlled substances"
- **Returns**: Filterable inventory report with statistics

#### ✅ `get_location_list`
- **Status**: Implemented
- **Purpose**: List all storage locations with summaries
- **Use cases**: "List all locations", "Show storage areas", "Where are drugs stored?"
- **Returns**: Locations with item counts and alert levels

#### ✅ `manage_user_access`
- **Status**: Implemented
- **Purpose**: User management (Master only)
- **Use cases**: "Show all users", "Blacklist user N005", "List pharmacists"
- **Returns**: User lists, blacklist/whitelist confirmations

---

### 2. Forecasting & ML (7 tools)

#### ✅ `get_forecast_ml`
- **Status**: Implemented
- **Purpose**: Generate 7-day demand forecast using ML
- **Algorithm**: EWMA + trend detection + day-of-week factors
- **Use cases**: "Forecast Propofol", "Predict demand for Morphine"
- **Returns**: Daily forecasts with confidence intervals, stockout predictions

#### ✅ `calculate_safety_stock`
- **Status**: Implemented
- **Purpose**: Calculate optimal safety stock using Wilson formula
- **Formula**: Z-score × σ(demand) × √(lead time)
- **Use cases**: "Calculate safety stock for Propofol", "What's the safety level?"
- **Returns**: Recommended safety stock levels per location

#### `recalculate_all_safety_stocks`
- **Status**: Pending
- **Purpose**: Batch recalculation for all drugs
- **Use cases**: "Recalculate all safety stocks", "Update safety levels system-wide"
- **Returns**: Bulk update report

#### `detect_seasonal_patterns`
- **Status**: Pending
- **Purpose**: Identify weekly/monthly usage patterns
- **Use cases**: "Check seasonal patterns for ICU drugs", "Usage trends"
- **Returns**: Seasonality analysis with peak/low periods

#### `predict_stockout_date`
- **Status**: Pending
- **Purpose**: Predict when a drug will run out
- **Use cases**: "When will Propofol run out?", "Stockout prediction for Insulin"
- **Returns**: Predicted stockout date with confidence level

#### `analyze_usage_trends`
- **Status**: Pending
- **Purpose**: Historical usage trend analysis
- **Use cases**: "Show usage trends for Morphine", "Analyze ICU consumption"
- **Returns**: Trend charts, growth rates, anomaly detection

#### ✅ `check_expiring_drugs`
- **Status**: Implemented
- **Purpose**: Find drugs expiring within time period
- **Use cases**: "What's expiring?", "Show expiring drugs", "Expiry check for 30 days"
- **Returns**: Expiring items categorized by urgency (critical/warning/notice)

---

### 3. Expiry & FEFO (4 tools)

#### ✅ `check_expiring_drugs`
- **Status**: Implemented (also in Forecasting section)
- **Urgency Levels**: Critical (<7 days), Warning (7-30 days), Notice (30-90 days)
- **Returns**: Value at risk, controlled substances list, disposal recommendations

#### `get_fefo_recommendations`
- **Status**: Pending
- **Purpose**: First Expired, First Out recommendations
- **Use cases**: "FEFO recommendations for ICU", "Which batch to use first?"
- **Returns**: Prioritized batch usage order

#### `get_batch_report`
- **Status**: Pending
- **Purpose**: Detailed batch information and traceability
- **Use cases**: "Show batch report for Morphine", "Track batch BATCH-001"
- **Returns**: Batch lineage, locations, quantities, expiry dates

#### `get_expired_items_report`
- **Status**: Pending
- **Purpose**: Report of already-expired items (need removal)
- **Use cases**: "Show expired items", "What needs disposal?"
- **Returns**: Expired items requiring immediate action

---

### 4. Analytics & Reports (6 tools)

#### `get_top_movers_report`
- **Status**: Pending
- **Purpose**: Most frequently used drugs
- **Use cases**: "Top movers last 30 days", "Most used drugs in ICU"
- **Returns**: Ranked list with usage stats, velocity analysis

#### `get_slow_movers_report`
- **Status**: Pending
- **Purpose**: Rarely used drugs (overstocking risk)
- **Use cases**: "Slow movers", "Which drugs aren't being used?"
- **Returns**: Low-turnover items, recommendations to reduce stock

#### `get_stockout_risk_report`
- **Status**: Pending
- **Purpose**: Drugs at risk of stocking out
- **Use cases**: "Stockout risks", "Which drugs are running low?"
- **Returns**: Risk-ranked list with days-until-stockout

#### `get_usage_analytics`
- **Status**: Pending
- **Purpose**: Comprehensive usage statistics
- **Use cases**: "Usage analytics for Ward-A", "Consumption report"
- **Returns**: Usage by location/time/category, trends, insights

#### `get_shortage_alerts`
- **Status**: Pending
- **Purpose**: Real-time shortage warnings
- **Use cases**: "Show current shortages", "Critical alerts"
- **Returns**: Immediate action items, priority ordering

#### `get_restock_recommendation`
- **Status**: Pending
- **Purpose**: Smart restock suggestions
- **Use cases**: "What should I restock?", "Reorder recommendations"
- **Returns**: Prioritized restock list with quantities

---

### 5. Procurement (3 tools)

#### `generate_purchase_order`
- **Status**: Pending
- **Purpose**: Auto-generate PO based on forecasts and safety stock
- **Use cases**: "Generate PO for ICU", "Create purchase order", "Order for low stock items"
- **Returns**: Structured PO with line items, quantities, urgency levels, cost estimates

#### `get_reorder_recommendations`
- **Status**: Pending (also in Analytics)
- **Purpose**: Intelligent reorder suggestions
- **Use cases**: "What to reorder?", "Reorder recommendations for Ward-A"
- **Returns**: Optimal order quantities, timing, supplier info

#### `estimate_order_value`
- **Status**: Pending
- **Purpose**: Calculate total cost for planned orders
- **Use cases**: "Estimate PO cost", "How much will this order cost?"
- **Returns**: Itemized costs, total value, budget impact

---

## Implementation Status

| Category | Completed | Pending | Total |
|----------|-----------|---------|-------|
| Inventory | 6 | 0 | 6 |
| Forecasting | 3 | 4 | 7 |
| Expiry | 1 | 3 | 4 |
| Analytics | 0 | 6 | 6 |
| Procurement | 0 | 3 | 3 |
| **TOTAL** | **10** | **16** | **26** |

## Tool Design Patterns

All tools follow consistent patterns:

### 1. Permission Checks
```typescript
if (userRole === 'Nurse' && requiresPharmacist) {
  return { error: true, permissionDenied: true, requiredRole: 'Pharmacist' };
}
```

### 2. Fuzzy Matching
```typescript
const matches = inventory.filter(item => smartDrugMatch(drugName, item.drugName));
```

### 3. Structured Responses
```typescript
return JSON.stringify({
  type: 'inventory_lookup',
  detailLevel: 'full',
  summary: 'One-line summary',
  data: { ... },
  alertLevel: 'critical' | 'warning' | 'info',
  alertMessage: 'Human-readable alert',
  recommendations: ['actionable suggestions'],
  actions: ['create_po', 'download_report'],
  followUp: 'Suggested next question',
}, null, 2);
```

### 4. Error Handling
```typescript
try {
  // Tool logic
} catch (error) {
  return JSON.stringify({
    error: true,
    message: `Error: ${error instanceof Error ? error.message : String(error)}`,
  });
}
```

### 5. Controlled Substance Handling
```typescript
const isControlled = item.category === 'controlled';
const detailLevel = isControlled ? 'audit' : 'standard';
// Always include batch, expiry, audit trail for controlled substances
```

## Usage in PMacsAgent

```typescript
import { createAllTools } from './tools';

const tools = createAllTools({
  db: databaseAdapter,
  userRole: 'Pharmacist',
  userId: 'P001',
});

const agent = createReactAgent({
  llm,
  tools,
  messageModifier: systemPrompt,
});
```

## Next Steps

1. ✅ Implement remaining forecasting tools (4 tools)
2. ✅ Implement expiry & FEFO tools (3 tools)
3. ✅ Implement analytics & reports tools (6 tools)
4. ✅ Implement procurement tools (3 tools)
5. ✅ Create comprehensive test suite
6. ✅ Add tool usage examples and documentation
