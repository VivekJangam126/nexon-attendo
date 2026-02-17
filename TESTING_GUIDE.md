# Testing Guide - History & Reports Features

## 🧪 Testing Checklist

### Prerequisites
- Admin account credentials
- At least 10 employees with attendance records
- Attendance data spanning multiple days/weeks
- Different attendance statuses (Present, Late, Absent)

---

## 1. Calendar View Testing

### Test Case 1.1: Basic Calendar Display
**Steps:**
1. Login as admin
2. Navigate to Reports page
3. Click "Attendance History" tab
4. Click Calendar View button (calendar icon)

**Expected Results:**
- ✅ Monthly calendar displays
- ✅ Current month shown by default
- ✅ Today's date is highlighted
- ✅ Dates show attendance counts (Present/Late/Absent)
- ✅ Dates are color-coded based on attendance rate

### Test Case 1.2: Month Navigation
**Steps:**
1. In Calendar View, click "Previous Month" button
2. Click "Next Month" button twice
3. Click "Today" button

**Expected Results:**
- ✅ Calendar navigates to previous month
- ✅ Calendar advances two months forward
- ✅ Calendar returns to current month
- ✅ Month/year header updates correctly

### Test Case 1.3: Date Details
**Steps:**
1. Click on any date with attendance records
2. Review the employee list
3. Click on an employee name
4. Close the drill-down modal
5. Click the same date again to collapse details

**Expected Results:**
- ✅ Date details panel appears below calendar
- ✅ Shows all employees with their status for that date
- ✅ Employee drill-down modal opens
- ✅ Modal closes properly
- ✅ Date details collapse when clicked again

---

## 2. Employee Drill-Down Testing

### Test Case 2.1: Open from Grid View
**Steps:**
1. Switch to Grid View
2. Click on any employee name in the left column

**Expected Results:**
- ✅ Drill-down modal opens
- ✅ Shows employee name and email
- ✅ Displays statistics (total days, present, late, absent, rate)
- ✅ Shows attendance rate progress bar
- ✅ Lists all attendance records for date range

### Test Case 2.2: Open from List View
**Steps:**
1. Switch to List View
2. Click on any employee name in a record card

**Expected Results:**
- ✅ Drill-down modal opens with same information
- ✅ All data displays correctly

### Test Case 2.3: Open from Calendar View
**Steps:**
1. Switch to Calendar View
2. Click a date to show details
3. Click an employee name in the date details

**Expected Results:**
- ✅ Drill-down modal opens
- ✅ Shows complete history for selected date range

### Test Case 2.4: Modal Functionality
**Steps:**
1. Open any employee drill-down
2. Scroll through attendance records
3. Click outside modal to close
4. Open again and press ESC key

**Expected Results:**
- ✅ Records scroll smoothly
- ✅ Modal closes when clicking outside
- ✅ Modal closes with ESC key
- ✅ No errors in console

---

## 3. List View Sorting Testing

### Test Case 3.1: Sort by Name
**Steps:**
1. Switch to List View
2. Click "Name" button
3. Click "Name" button again

**Expected Results:**
- ✅ Records sort alphabetically (A-Z)
- ✅ Button shows ↓ indicator
- ✅ Second click reverses to Z-A
- ✅ Button shows ↑ indicator

### Test Case 3.2: Sort by Date
**Steps:**
1. Click "Date" button
2. Verify records are sorted by date
3. Click again to reverse

**Expected Results:**
- ✅ Records sort by date (newest first)
- ✅ Indicator shows ↓
- ✅ Reverses to oldest first
- ✅ Indicator shows ↑

### Test Case 3.3: Sort by Status
**Steps:**
1. Click "Status" button
2. Verify sort order (Present → Late → Absent)
3. Click again to reverse

**Expected Results:**
- ✅ Records group by status
- ✅ Correct order maintained
- ✅ Reverses properly

### Test Case 3.4: Sort with Filters
**Steps:**
1. Apply a status filter (e.g., "Late Only")
2. Sort by name
3. Sort by date

**Expected Results:**
- ✅ Sorting works with filtered data
- ✅ Only filtered records are sorted
- ✅ No errors occur

---

## 4. Pagination Testing

### Test Case 4.1: Basic Pagination
**Steps:**
1. Ensure more than 50 records exist
2. Switch to List View
3. Verify pagination controls appear

**Expected Results:**
- ✅ Shows "Showing 1-50 of X records"
- ✅ Page buttons appear (1, 2, 3, etc.)
- ✅ Next button is enabled
- ✅ Previous button is disabled on page 1

### Test Case 4.2: Page Navigation
**Steps:**
1. Click "Next" button
2. Click page number "3"
3. Click "Previous" button
4. Click page "1"

**Expected Results:**
- ✅ Advances to page 2
- ✅ Jumps to page 3
- ✅ Goes back to page 2
- ✅ Returns to page 1
- ✅ Record count updates correctly

### Test Case 4.3: Pagination with Sorting
**Steps:**
1. Go to page 2
2. Change sort order
3. Verify page resets to 1

**Expected Results:**
- ✅ Sorting resets to page 1
- ✅ Sorted records display correctly
- ✅ Pagination recalculates

### Test Case 4.4: Pagination with Filters
**Steps:**
1. Apply filters to reduce records below 50
2. Verify pagination disappears
3. Remove filters
4. Verify pagination returns

**Expected Results:**
- ✅ Pagination hides when not needed
- ✅ Pagination shows when needed
- ✅ Correct page count displayed

---

## 5. Excel Export Testing

### Test Case 5.1: Basic Excel Export
**Steps:**
1. Go to Reports & Export tab
2. Select "Excel" format
3. Select "Week" time range
4. Click "Download XLSX Report"

**Expected Results:**
- ✅ File downloads successfully
- ✅ Filename includes "attendance-report-week"
- ✅ File opens in Excel/Sheets
- ✅ No corruption errors

### Test Case 5.2: Excel Content Verification
**Steps:**
1. Open downloaded Excel file
2. Check "Summary" sheet
3. Check "Detailed Records" sheet

**Expected Results:**
- ✅ Summary sheet contains:
  - Report header
  - Statistics (total, present, late, absent, rate)
  - Daily breakdown table
- ✅ Detailed Records sheet contains:
  - Column headers
  - All attendance records
  - Proper formatting

### Test Case 5.3: Excel with Different Time Ranges
**Steps:**
1. Export with "Today" range
2. Export with "Month" range
3. Compare file sizes and content

**Expected Results:**
- ✅ Today export has 1 day of data
- ✅ Month export has 30 days of data
- ✅ All data is accurate
- ✅ No missing records

---

## 6. Report Templates Testing

### Test Case 6.1: Daily Template
**Steps:**
1. Select any export format (CSV/PDF/Excel)
2. Click download icon on "Daily Attendance Report"
3. Wait for download

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Report generates for today
- ✅ File downloads successfully
- ✅ Success notification appears

### Test Case 6.2: Weekly Template
**Steps:**
1. Select Excel format
2. Click download on "Weekly Summary Report"
3. Open downloaded file

**Expected Results:**
- ✅ Report contains last 7 days
- ✅ Excel format is used
- ✅ All data is present

### Test Case 6.3: Monthly Template
**Steps:**
1. Select PDF format
2. Click download on "Monthly Report"
3. Open PDF file

**Expected Results:**
- ✅ Report contains last 30 days
- ✅ PDF format is used
- ✅ Professional formatting

### Test Case 6.4: Template with Format Change
**Steps:**
1. Select CSV format
2. Download Daily template
3. Change to Excel format
4. Download Weekly template

**Expected Results:**
- ✅ Daily report is CSV
- ✅ Weekly report is Excel
- ✅ Format selection is respected

---

## 7. Integration Testing

### Test Case 7.1: Filter + Calendar View
**Steps:**
1. Apply status filter "Present Only"
2. Switch to Calendar View
3. Click a date

**Expected Results:**
- ✅ Calendar shows only present employees
- ✅ Date details show filtered results
- ✅ Counts are accurate

### Test Case 7.2: Filter + Drill-Down
**Steps:**
1. Apply date range filter (last 7 days)
2. Open employee drill-down
3. Verify date range in modal

**Expected Results:**
- ✅ Drill-down shows only filtered date range
- ✅ Statistics match filtered period
- ✅ Records are accurate

### Test Case 7.3: Sort + Pagination + Filter
**Steps:**
1. Apply status filter
2. Sort by name
3. Navigate to page 2

**Expected Results:**
- ✅ All three features work together
- ✅ Correct records display
- ✅ No errors occur

---

## 8. Error Handling Testing

### Test Case 8.1: Network Error
**Steps:**
1. Disconnect internet
2. Try to load attendance history
3. Reconnect and retry

**Expected Results:**
- ✅ Error message displays
- ✅ Retry option available
- ✅ Works after reconnection

### Test Case 8.2: No Data Scenario
**Steps:**
1. Apply filters that return no results
2. Verify empty state message

**Expected Results:**
- ✅ "No records found" message displays
- ✅ No errors in console
- ✅ UI remains functional

### Test Case 8.3: Export Error
**Steps:**
1. Try to export with custom range (not implemented)
2. Verify error handling

**Expected Results:**
- ✅ "Coming soon" message displays
- ✅ No crash occurs
- ✅ User can continue using app

---

## 9. Performance Testing

### Test Case 9.1: Large Dataset
**Steps:**
1. Load attendance history with 100+ employees
2. Switch between views
3. Apply filters
4. Export reports

**Expected Results:**
- ✅ Views load within 2 seconds
- ✅ Filters apply quickly
- ✅ Exports complete successfully
- ✅ No lag or freezing

### Test Case 9.2: Pagination Performance
**Steps:**
1. Load 500+ records in List View
2. Navigate through pages
3. Change sort order

**Expected Results:**
- ✅ Page changes are instant
- ✅ Sorting is fast
- ✅ No memory leaks

---

## 10. Cross-Browser Testing

### Test Case 10.1: Browser Compatibility
**Test in:**
- Chrome
- Firefox
- Safari
- Edge

**Expected Results:**
- ✅ All features work in all browsers
- ✅ UI renders correctly
- ✅ Exports download properly
- ✅ No browser-specific errors

---

## 🐛 Bug Reporting Template

If you find any issues, report using this format:

```
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Copy any error messages]
```

---

## ✅ Sign-Off Checklist

Before marking testing complete, verify:

- [ ] All 10 test sections completed
- [ ] No critical bugs found
- [ ] All features work as expected
- [ ] Performance is acceptable
- [ ] Cross-browser testing done
- [ ] Documentation reviewed
- [ ] Ready for production deployment

---

## 📞 Support

If you encounter issues during testing:
1. Check console for error messages
2. Verify test data exists
3. Clear browser cache and retry
4. Review implementation documentation
5. Report bugs using template above
