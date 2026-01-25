# Security Summary: xlsx Vulnerability

**Date:** 2026-01-25  
**Severity:** HIGH  
**Status:** ⚠️ OPEN - No fix available  

---

## 🔴 Vulnerability Details

### Affected Package
- **Package:** xlsx
- **Current Version:** 0.18.5
- **Latest Available:** 0.18.5 (no newer version published to npm)

### Known Vulnerabilities

#### 1. Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- **Severity:** HIGH
- **Affected Versions:** < 0.19.3
- **Patched Version:** Not available on npm
- **Description:** Attackers can modify Object.prototype, potentially affecting all objects in the application

#### 2. Regular Expression Denial of Service - ReDoS (GHSA-5pgg-2g8v-p4x9)
- **Severity:** HIGH  
- **Affected Versions:** < 0.20.2
- **Patched Version:** Not available on npm
- **Description:** Maliciously crafted input can cause exponential regex processing time, leading to DoS

---

## 🎯 Risk Assessment for This Application

### Current Usage
The xlsx library is used in `src/exportService.ts` for exporting poll responses to Excel format.

```typescript
// Only used in one place:
export function exportToExcel(
    events: EventWithServices[],
    responses: ServicePollEntry[]
): void {
    // Creates Excel workbook from poll data
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Umfrage-Antworten');
    XLSX.writeFile(workbook, filename);
}
```

### Data Flow
1. **Input Source:** ChurchTools API + User Poll Responses
2. **Data Format:** JavaScript objects (events, responses)
3. **Processing:** Convert to Excel file
4. **Output:** Download to user's browser

### Risk Level: **MEDIUM**

#### Why Medium (not High):
1. **Trusted Data Source:** Data comes from ChurchTools API, not user-uploaded files
2. **Limited Exposure:** Only used for export, not for parsing uploaded Excel files
3. **Client-Side Only:** Runs in user's browser, doesn't affect server
4. **No External Input:** Doesn't process external Excel files

#### Why Not Low:
1. **User Comments:** Users can add free-text comments that are included in export
2. **Potential Exploitation:** If ChurchTools data is compromised, could be exploited
3. **Prototype Pollution:** Could affect other parts of the application

---

## 🛡️ Mitigation Strategies

### Option 1: Accept Risk (RECOMMENDED for now)
**Status:** Document and monitor

**Justification:**
- Data source is trusted (ChurchTools)
- Only used for export, not parsing
- No known active exploits
- User impact is limited to their own browser

**Actions:**
- ✅ Document the risk
- ✅ Add to security review checklist
- ⏳ Monitor for xlsx updates
- ⏳ Plan migration when fix available

**Implementation:**
```javascript
// Add warning comment in exportService.ts
/**
 * SECURITY NOTE: xlsx v0.18.5 has known vulnerabilities
 * (Prototype Pollution, ReDoS). Risk is mitigated because:
 * - Data comes from trusted ChurchTools API
 * - Only used for export, not parsing uploads
 * - Client-side only processing
 * 
 * TODO: Update to xlsx 0.20.2+ when available on npm
 * See: SECURITY.md for details
 */
```

### Option 2: Replace with Alternative Library
**Status:** Evaluated

**Alternatives:**
1. **exceljs** (✅ Recommended)
   - No known vulnerabilities
   - More features
   - Larger bundle size (~600KB)
   - Similar API

2. **xlsx-js-style** 
   - Fork of xlsx with additional features
   - May have same vulnerabilities

3. **SheetJS Community Edition**
   - Same as xlsx

**Migration Effort:** ~2-4 hours

**Example with exceljs:**
```typescript
import ExcelJS from 'exceljs';

export async function exportToExcel(
    events: EventWithServices[],
    responses: ServicePollEntry[]
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Umfrage-Antworten');
    
    // Add headers
    worksheet.columns = [
        { header: 'Event', key: 'event', width: 25 },
        { header: 'Datum', key: 'datum', width: 20 },
        // ... etc
    ];
    
    // Add data
    rows.forEach(row => worksheet.addRow(row));
    
    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    // ... trigger download
}
```

### Option 3: Remove Excel Export Feature
**Status:** Not recommended

**Impact:**
- Removes valuable feature for coordinators
- Users need manual data collection
- Reduces application value

---

## 📊 Decision Matrix

| Option | Security | Effort | User Impact | Recommended |
|--------|----------|--------|-------------|-------------|
| Accept Risk | ⚠️ Medium | ✅ None | ✅ None | ✅ Short term |
| Replace Library | ✅ High | ⚠️ 2-4h | ⚠️ Larger bundle | ✅ Long term |
| Remove Feature | ✅ High | ✅ 1h | ❌ Feature loss | ❌ No |

---

## 🔄 Recommended Action Plan

### Phase 1: Immediate (Now)
1. ✅ Document the vulnerability
2. ✅ Add security notes in code
3. ✅ Inform stakeholders
4. ✅ Accept risk for initial deployment

### Phase 2: Short Term (Next Sprint)
1. ⏳ Evaluate exceljs library
2. ⏳ Create proof-of-concept migration
3. ⏳ Performance testing with exceljs

### Phase 3: Long Term (When fix available)
1. ⏳ Monitor xlsx releases weekly
2. ⏳ Update to patched version when available
3. ⏳ Or migrate to exceljs if no fix within 3 months

---

## 🎓 Security Best Practices Applied

1. ✅ **Dependency Scanning:** Used npm audit + GitHub Advisory DB
2. ✅ **Risk Assessment:** Evaluated actual vs theoretical risk
3. ✅ **Documentation:** Created this security summary
4. ✅ **Monitoring:** Plan for ongoing review
5. ✅ **Alternatives:** Researched replacement options
6. ✅ **Stakeholder Communication:** Transparent about risks

---

## 📝 Changelog

| Date | Action | Status |
|------|--------|--------|
| 2026-01-25 | Vulnerability identified | ⚠️ Open |
| 2026-01-25 | Risk assessment completed | ✅ Done |
| 2026-01-25 | Documentation created | ✅ Done |
| 2026-01-25 | Alternatives researched | ✅ Done |
| 2026-01-25 | Decision: Accept risk (short term) | ✅ Done |

---

## 🔗 References

- [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) - Prototype Pollution
- [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) - ReDoS
- [SheetJS Repository](https://github.com/SheetJS/sheetjs)
- [ExcelJS Alternative](https://github.com/exceljs/exceljs)

---

## ✅ Approval

**Risk Accepted By:** [Stakeholder to fill]  
**Date:** [Date to fill]  
**Review Date:** [3 months from now]  
**Conditions:**
- Monitor weekly for xlsx updates
- Re-evaluate if new exploits discovered
- Migrate within 3 months if no fix available

---

**Document Owner:** Development Team  
**Last Updated:** 2026-01-25  
**Next Review:** 2026-04-25
