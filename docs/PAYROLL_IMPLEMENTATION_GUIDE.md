# Payroll & Compensation System - Implementation Guide

## Overview
This guide covers the complete implementation of the Payroll & Compensation module for the Nexus HR platform.

## Database Setup

### 1. Create Tables in Supabase

Run the SQL migration file to create all payroll tables:

```bash
# File: supabase/migrations/payroll_schema.sql
# Execute this in Supabase SQL Editor
```

**Tables Created:**
- `salary_structures` - Define salary structures for different roles
- `salary_components` - Components (earnings/deductions) for each structure
- `employee_salary` - Salary assignment to employees
- `salary_revision_history` - Track salary changes
- `payroll_runs` - Monthly payroll processing records
- `payroll_entries` - Individual employee payroll calculations
- `payroll_adjustments` - Ad-hoc additions/deductions
- `tax_slabs` - Tax configuration by income bracket
- `tax_declarations` - Employee tax declarations
- `investment_proofs` - Tax investment proof documents
- `payslips` - Generated payslips
- `bank_accounts` - Employee bank account details
- `salary_disbursements` - Salary transfer records

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all payroll tables
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_disbursements ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage payroll" ON salary_structures
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## Backend Setup

### 1. Services Created

**File:** `server/services/payroll.service.ts`
- Salary structure management
- Employee salary assignment
- Payroll run management
- Payslip generation
- Tax calculations
- Bank account management
- Disbursement tracking

**File:** `server/services/payroll-calculation.service.ts`
- Payroll calculation engine
- Attendance integration
- Leave deduction calculation
- Pro-rata salary calculation
- Tax computation
- Payroll run processing

### 2. API Endpoints

**File:** `server/api/payroll.ts`

**Salary Structures:**
- `POST /api/payroll/salary-structures` - Create structure
- `GET /api/payroll/salary-structures` - List structures
- `GET /api/payroll/salary-structures/:id` - Get structure with components

**Salary Components:**
- `POST /api/payroll/salary-components` - Add component
- `PUT /api/payroll/salary-components/:id` - Update component
- `DELETE /api/payroll/salary-components/:id` - Delete component

**Employee Salary:**
- `POST /api/payroll/employee-salary` - Assign salary
- `GET /api/payroll/employee-salary/:employeeId` - Get employee salary
- `PUT /api/payroll/employee-salary/:id` - Update salary
- `POST /api/payroll/salary-revision` - Revise salary

**Payroll Processing:**
- `POST /api/payroll/payroll-runs` - Create payroll run
- `GET /api/payroll/payroll-runs` - List payroll runs
- `POST /api/payroll/payroll-runs/:id/process` - Process payroll
- `POST /api/payroll/payroll-runs/:id/finalize` - Finalize payroll
- `POST /api/payroll/payroll-runs/:id/reverse` - Reverse payroll

**Payslips:**
- `GET /api/payroll/payslips/:employeeId` - Get employee payslips
- `GET /api/payroll/payslips/detail/:id` - Get payslip details

**Disbursements:**
- `GET /api/payroll/disbursements/:payrollRunId` - List disbursements
- `PUT /api/payroll/disbursements/:id/status` - Update status

## Frontend Setup

### 1. Components Created

**Main Page:** `src/pages/admin/PayrollPage.tsx`
- Tab-based interface for all payroll functions

**Components:**
1. **PayrollOverview.tsx** - Dashboard with key metrics and charts
2. **SalaryStructureManager.tsx** - Create and manage salary structures
3. **PayrollRunManager.tsx** - Process and manage payroll runs
4. **PayslipViewer.tsx** - View and download payslips
5. **TaxManagementPanel.tsx** - Configure tax slabs
6. **BankDisbursementPanel.tsx** - Manage salary disbursements
7. **PayrollReports.tsx** - Generate payroll reports

### 2. API Integration

**File:** `src/lib/payroll-api.ts`
- Centralized API client for all payroll operations
- Type-safe API calls
- Error handling

### 3. Routes

Added to `src/App.tsx`:
```tsx
<Route path="/admin/payroll" element={<PayrollPage />} />
```

Updated `src/components/Sidebar.tsx`:
```tsx
{ icon: DollarSign, label: 'Payroll', path: '/admin/payroll' }
```

## Features Implemented

### 1. Salary Structure Management
- Create multiple salary structures
- Add/edit/delete salary components
- Support for fixed and percentage-based components
- Earnings and deductions categorization

### 2. Employee Salary Assignment
- Assign salary structures to employees
- Track salary history
- Support salary revisions with reason tracking

### 3. Payroll Processing
- Monthly payroll run creation
- Automatic calculation based on:
  - Attendance data
  - Leave deductions
  - Salary components
  - Tax slabs
- Draft, finalize, and reverse operations

### 4. Payslip Generation
- Automatic payslip generation after finalization
- Earnings breakdown
- Deduction breakdown
- Tax calculation
- Download as PDF
- Email payslips
- Print functionality

### 5. Tax Management
- Configure tax slabs by income bracket
- Support for multiple financial years
- Automatic tax calculation
- Employee tax declarations
- Investment proof tracking

### 6. Bank Disbursement
- Track salary disbursements
- Generate bank transfer files (CSV/Excel)
- Update disbursement status
- Transaction reference tracking

### 7. Reporting
- Payroll summary reports
- Department-wise payroll analysis
- CTC reports
- Payroll register
- Statutory reports
- Tax reports
- Export to PDF/Excel

## Data Integration

### Attendance Integration
- Fetches attendance records for the payroll month
- Calculates working days and leave days
- Applies pro-rata salary calculation

### Leave Integration
- Retrieves approved leave records
- Deducts leave days from salary
- Supports partial month calculations

### Employee Integration
- Links to existing employee profiles
- Uses employee email for payslip distribution
- Maintains employee hierarchy

## Calculation Logic

### Payroll Calculation Flow

```
1. Get Employee Salary Structure
2. Calculate Attendance Data
   - Working days (excluding weekends)
   - Leave days (approved leaves)
3. Calculate Pro-rata Salary
   - Basic Salary × (Actual Working Days / Total Working Days)
4. Calculate Components
   - Earnings (fixed + percentage-based)
   - Deductions (fixed + percentage-based)
5. Apply Adjustments
   - Ad-hoc additions
   - Ad-hoc deductions
6. Calculate Gross Salary
   - Pro-rata Basic + Earnings + Adjustments
7. Calculate Tax
   - Based on tax slabs
8. Calculate Net Salary
   - Gross - Deductions - Tax
```

## Usage Guide

### Step 1: Create Salary Structure
1. Go to Admin → Payroll → Structures tab
2. Click "New Structure"
3. Enter structure name and employment type
4. Add salary components (Basic, HRA, etc.)
5. Save

### Step 2: Assign Salary to Employees
1. In Structures tab, select a structure
2. Assign to employees with effective date
3. Set basic salary and CTC

### Step 3: Process Payroll
1. Go to Payroll tab
2. Select month and year
3. Click "Process Payroll"
4. Review preview
5. Click "Finalize" to generate payslips

### Step 4: Manage Disbursements
1. Go to Disbursement tab
2. Select payroll run
3. Generate bank file (CSV/Excel)
4. Update disbursement status
5. Track transaction references

### Step 5: Generate Reports
1. Go to Reports tab
2. Select report type
3. Choose month/year
4. Download as PDF or Excel

## Security Considerations

1. **Row Level Security (RLS)** - Only admins can access payroll data
2. **Audit Logging** - All payroll operations are logged
3. **Data Encryption** - Sensitive data (bank accounts) encrypted
4. **Access Control** - Role-based access to payroll functions
5. **Compliance** - Follows data protection regulations

## Performance Optimization

1. **Indexes** - Created on frequently queried columns
2. **Query Optimization** - Efficient joins and filtering
3. **Caching** - React Query for client-side caching
4. **Pagination** - Large datasets paginated
5. **Batch Processing** - Payroll runs processed in batches

## Error Handling

- Comprehensive error messages
- Validation at frontend and backend
- Transaction rollback on failures
- Audit trail for debugging

## Future Enhancements

1. **Accounting Integration** - Export to accounting software
2. **Xero Integration** - Direct Xero Payroll sync
3. **Time Tracking Integration** - Automatic overtime calculation
4. **Mobile App** - Payslip access on mobile
5. **Employee Self-Service** - View payslips and tax declarations
6. **Compliance Reports** - Statutory compliance automation
7. **Bulk Operations** - Bulk salary updates
8. **Approval Workflow** - Multi-level payroll approval

## Troubleshooting

### Issue: Payroll calculation not working
- Check if employee has salary structure assigned
- Verify attendance data exists for the month
- Check tax slabs are configured

### Issue: Payslips not generating
- Ensure payroll run is finalized
- Check employee bank account is configured
- Verify PDF generation service is running

### Issue: Disbursement status not updating
- Check database permissions
- Verify transaction reference format
- Check for duplicate entries

## Support

For issues or questions:
1. Check the implementation guide
2. Review error logs in browser console
3. Check Supabase logs for database errors
4. Contact development team

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
