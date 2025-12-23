# Frontend Package Optimization Report

## Current Status
- **Total Packages**: ~1,699 (down from ~3,984)
- **node_modules Size**: 2.2GB
- **Direct Dependencies**: 51 packages

## Optimizations Completed ✅

1. **Removed Extraneous Packages** (99 packages removed)
   - Removed leftover packages from old `xlsx` dependency:
     - `xlsx`, `adler-32`, `cfb`, `codepage`, `crc-32`, `frac`, `ssf`, `wmf`, `word`
   - These were causing "extraneous" warnings

2. **Moved Testing Libraries to devDependencies**
   - Moved `@testing-library/dom` from dependencies to devDependencies
   - All testing libraries are now properly categorized

3. **Ran npm dedupe**
   - Removed duplicate dependencies where possible

## Remaining Optimization Opportunities

### 1. Consolidate Chart Libraries (HIGH IMPACT) ⚠️
**Current**: Using both `chart.js` + `react-chartjs-2` AND `recharts`
- `chart.js` is used in 5 files
- `recharts` is used in 3 files

**Recommendation**: Remove `recharts` and migrate 3 files to `chart.js`
- **Files to migrate**:
  - `src/pages/inventory/AnalyticsPage.js`
  - `src/pages/inventory/PartsUsageReportPage.js`
  - `src/pages/technicians/TechnicianAnalyticsPage.js`

**Estimated Impact**: Remove ~200-300 packages

### 2. Consider Ejecting from react-scripts (MEDIUM IMPACT)
**Current**: `react-scripts` includes many dev dependencies (webpack, babel, eslint, jest, etc.)

**Options**:
- Eject and manually configure only what you need
- Use Vite instead of Create React App (requires migration)
- Keep as-is (easiest but largest bundle)

**Estimated Impact**: Could reduce by 500-800 packages, but requires significant refactoring

### 3. Material-UI Optimization (LOW-MEDIUM IMPACT)
**Current**: Using `@mui/material` and `@mui/icons-material` (large packages)

**Options**:
- Use tree-shaking (already enabled)
- Consider lighter alternatives for specific components
- Keep as-is (MUI is feature-rich and well-maintained)

**Estimated Impact**: Minimal (tree-shaking already helps)

### 4. Radix UI Consolidation (LOW IMPACT)
**Current**: Using 8 separate `@radix-ui` packages

**Options**:
- Keep as-is (each package is small and modular)
- Consider if all are needed

**Estimated Impact**: Minimal (each package is small)

## Recommended Next Steps

1. **Immediate**: Remove `recharts` and migrate 3 files to `chart.js` (estimated 2-3 hours)
2. **Short-term**: Review if all dependencies are actually used
3. **Long-term**: Consider migrating from Create React App to Vite for better performance

## Package Count Breakdown

- **Direct Dependencies**: 51
- **Transitive Dependencies**: ~1,648
- **Main Contributors**:
  - `react-scripts`: ~800-1000 packages (dev tools)
  - `@mui/material`: ~200-300 packages
  - `chart.js` + `recharts`: ~300-400 packages (duplicate functionality)
  - Other: ~200-300 packages

## Notes

- The high package count is primarily due to:
  1. `react-scripts` bundling many dev tools
  2. Duplicate chart libraries
  3. Transitive dependencies from large libraries

- Most packages are in `node_modules` but not bundled in production builds
- Production bundle size is more important than `node_modules` size for deployment

