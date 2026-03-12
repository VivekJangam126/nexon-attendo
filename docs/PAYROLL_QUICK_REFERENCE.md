# Payroll System - Quick Reference

## File Structure

```
nexon-attendo/
├── server/
│   ├── services/
│   │   ├── payroll.service.ts              # Core payroll operations
│   │   └── payroll-calculation.service.ts  # Calculation engine
│   ├── api/
│   │   └── payroll.ts                      # API endpoints
│   └── types/
│       └── database.ts                     # Updated with payroll types
├── src/
│   ├── pages/admin/
│   │   ├── PayrollPage.tsx                 # Main payroll page
│   │   ├── PayrollOverview.tsx             # Dashboard
│   │   ├── SalaryStructureManager.tsx      # Structure management
│   │   ├── PayrollRunManager.tsx           # Payroll processing
│   │   ├── PayslipViewer.tsx               # Payslip viewing
│   │   ├── TaxManagementPanel.tsx          # Tax configuration
│   │   ├── BankDisbursementPanel.tsx       # Disbursement management
│   │   └── PayrollReports.tsx              # Reports generation
│   ├── lib/
│   │   └── payroll-api.ts                  # API client
│   ├── components/
│   │   └── Sidebar.tsx                     # Updated with payroll route
│   └── App.tsx                             # Updated with payroll route
├── supabase/
│   └── migrations/
│       └── payroll_schema.sql              # Database schema
└── docs/
    └── PAYROLL_IMPLEMENTATION_GUIDE.md     # Full documentation
```

## Key Services

### payroll.service.ts
**Purpose:** Core payroll data operations

**Key Methods:**
- `createSalaryStructure()` - Create salary structure
- `addSalaryComponent()` - Add component to structure
- `assignSalaryToEmployee()` - Assign salary to employee
- `createPayrollRun()` - Create monthly payroll run
- `createPayrollEntry()` - Create payroll entry for employee
- `generatePayslip()` - Generate payslip
- `calculateTax()` - Calculate tax based on slabs
- `createDisbursement()` - Create disbursement record

### payroll-calculation.service.ts
**Purpose:** Payroll calculation logic

**Key Methods:**
- `calculatePayroll()` - Calculate complete payroll for employee
- `getAttendanceData()` - Get attendance and leave data
- `calculateProRataSalary()` - Calculate pro-rata salary
- `calculateComponents()` - Calculate earnings and deductions
- `processPayrollRun()` - Process entire payroll run
- `finalizePayrollRun()` - Finalize and generate payslips
- `reversePayrollRun()` - Reverse payroll run

## Database Schema

### Core Tables

**salary_structures**
```sql
id, name, employment_type, currency, created_at, updated_at
```

**salary_components**
```sql
id, structure_id, component_name, component_type, calculation_type, amount, created_at
```

**employee_salary**
```sql
id, employee_id, structure_id, effective_date, basic_salary, ctc, status, created_at, updated_at
```

**payroll_runs**
```sql
id, month, year, status, total_payroll, employee_count, created_at, updated_at
```

**payroll_entries**
```sql
id, payroll_run_id, employee_id, basic_salary, allowances, deductions, tax, net_salary, working_days, leave_days, created_at
```

**payslips**
```sql
id, employee_id, payroll_run_id, month, year, gross_salary, deductions, tax, net_salary, pdf_url, created_at
```

**bank_accounts**
```sql
id, employee_id, bank_name, account_number, ifsc_code, country, is_primary, created_at, updated_at
```

**salary_disbursements**
```sql
id, payroll_run_id, employee_id, amount, status, transaction_reference, created_at, updated_at
```

## API Endpoints

### Salary Structures
```
POST   /api/payroll/salary-structures
GET    /api/payroll/salary-structures
GET    /api/payroll/salary-structures/:id
```

### Salary Components
```
POST   /api/payroll/salary-components
PUT    /api/payroll/salary-components/:id
DELETE /api/payroll/salary-components/:id
```

### Employee Salary
```
POST   /api/payroll/employee-salary
GET    /api/payroll/employee-salary/:employeeId
PUT    /api/payroll/employee-salary/:id
POST   /api/payroll/salary-revision
```

### Payroll Runs
```
POST   /api/payroll/payroll-runs
GET    /api/payroll/payroll-runs
GET    /api/payroll/payroll-runs/:month/:year
POST   /api/payroll/payroll-runs/:id/process
POST   /api/payroll/payroll-runs/:id/finalize
POST   /api/payroll/payroll-runs/:id/reverse
```

### Payslips
```
GET    /api/payroll/payslips/:employeeId
GET    /api/payroll/payslips/detail/:id
```

### Disbursements
```
GET    /api/payroll/disbursements/:payrollRunId
PUT    /api/payroll/disbursements/:id/status
```

## Frontend Components

### PayrollPage.tsx
**Purpose:** Main container with tab navigation

**Tabs:**
- Overview - Dashboard
- Structures - Salary structure management
- Payroll - Payroll processing
- Payslips - Payslip viewing
- Tax - Tax configuration
- Disbursement - Salary disbursement
- Reports - Report generation

### PayrollOverview.tsx
**Purpose:** Dashboard with metrics and charts

**Displays:**
- Total payroll cost
- Employees paid
- Pending runs
- Average salary
- Monthly trend chart
- Department cost chart

### SalaryStructureManager.tsx
**Purpose:** Create and manage salary structures

**Features:**
- Create new structures
- Add/edit/delete components
- View structure details
- Component breakdown

### PayrollRunManager.tsx
**Purpose:** Process and manage payroll runs

**Features:**
- Select month/year
- Process payroll
- Preview payroll
- Finalize payroll
- Reverse payroll
- View payroll entries

### PayslipViewer.tsx
**Purpose:** View and manage payslips

**Features:**
- Select employee
- View payslips
- Download PDF
- Print payslip
- Email payslip

### TaxManagementPanel.tsx
**Purpose:** Configure tax settings

**Features:**
- Add tax slabs
- View tax configuration
- Employee tax declarations
- Investment proofs

### BankDisbursementPanel.tsx
**Purpose:** Manage salary disbursements

**Features:**
- Select payroll run
- Generate bank file
- Update disbursement status
- Track transactions
- View summary

### PayrollReports.tsx
**Purpose:** Generate payroll reports

**Reports:**
- Payroll summary
- Department payroll
- CTC report
- Payroll register
- Statutory report
- Tax report

## Integration Points

### With Attendance
- Fetches attendance records
- Calculates working days
- Applies leave deductions

### With Leave Management
- Retrieves approved leaves
- Calculates leave days
- Applies pro-rata calculation

### With Employee Management
- Links to employee profiles
- Uses employee data
- Maintains hierarchy

## Calculation Flow

```
1. Get Employee Salary Structure
   ↓
2. Fetch Attendance & Leave Data
   ↓
3. Calculate Working Days & Leave Days
   ↓
4. Calculate Pro-rata Basic Salary
   ↓
5. Calculate Salary Components
   ├─ Earnings (HRA, Conveyance, etc.)
   └─ Deductions (PF, Insurance, etc.)
   ↓
6. Apply Payroll Adjustments
   ├─ Ad-hoc Additions
   └─ Ad-hoc Deductions
   ↓
7. Calculate Gross Salary
   ↓
8. Calculate Tax (Based on Tax Slabs)
   ↓
9. Calculate Net Salary
   ↓
10. Create Payroll Entry
```

## Common Tasks

### Add New Salary Component Type
1. Update `salary_components` table
2. Add to component form in `SalaryStructureManager.tsx`
3. Update calculation logic in `payroll-calculation.service.ts`

### Add New Report Type
1. Create report generation logic in backend
2. Add endpoint in `server/api/payroll.ts`
3. Add report option in `PayrollReports.tsx`

### Modify Tax Calculation
1. Update tax slabs in database
2. Modify `calculateTax()` in `payroll.service.ts`
3. Test with sample data

### Add Bank Integration
1. Create bank-specific file format
2. Add format option in `BankDisbursementPanel.tsx`
3. Implement file generation in backend

## Testing Checklist

- [ ] Create salary structure
- [ ] Add salary components
- [ ] Assign salary to employee
- [ ] Process payroll run
- [ ] Verify calculations
- [ ] Generate payslips
- [ ] Download payslip PDF
- [ ] Generate bank file
- [ ] Update disbursement status
- [ ] Generate reports
- [ ] Test with multiple employees
- [ ] Test with leave deductions
- [ ] Test tax calculations
- [ ] Test salary revisions

## Performance Tips

1. **Use React Query** - Caching and background updates
2. **Pagination** - Load large datasets in pages
3. **Indexes** - Database indexes on foreign keys
4. **Batch Operations** - Process multiple records together
5. **Lazy Loading** - Load components on demand

## Security Checklist

- [ ] RLS policies configured
- [ ] Admin-only access enforced
- [ ] Audit logging enabled
- [ ] Data validation on frontend and backend
- [ ] Sensitive data encrypted
- [ ] API authentication verified
- [ ] CORS properly configured

---

**Quick Links:**
- [Full Implementation Guide](./PAYROLL_IMPLEMENTATION_GUIDE.md)
- [Database Schema](../supabase/migrations/payroll_schema.sql)
- [API Endpoints](../server/api/payroll.ts)
- [Frontend Components](../src/pages/admin/)
