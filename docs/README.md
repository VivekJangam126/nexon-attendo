# Payroll & Compensation Module

A production-level Payroll & Compensation system for the Nexus HR platform.

## 🎯 Overview

The Payroll & Compensation module provides comprehensive payroll management capabilities including:

- **Salary Structure Management** - Create and manage salary structures with dynamic components
- **Employee Salary Assignment** - Assign salary structures to employees with revision tracking
- **Payroll Processing** - Automated monthly payroll calculation with attendance and leave integration
- **Payslip Generation** - Automatic payslip generation with PDF download and email capabilities
- **Tax Management** - Configurable tax slabs and employee tax declarations
- **Bank Disbursement** - Salary disbursement tracking and bank file generation
- **Comprehensive Reporting** - Multiple report types for payroll analysis

## ✨ Features

### 1. Salary Structure Management
- Create multiple salary structures for different roles
- Add/edit/delete salary components
- Support for fixed and percentage-based components
- Earnings and deductions categorization

### 2. Employee Salary Assignment
- Assign salary structures to employees
- Track salary history with revision records
- Support salary revisions with reason tracking
- Effective date management

### 3. Payroll Processing
- Monthly payroll run creation
- Automatic calculation based on:
  - Attendance data
  - Leave deductions
  - Salary components
  - Tax slabs
- Draft, finalize, and reverse operations
- Batch processing capability

### 4. Payslip Management
- Automatic payslip generation after finalization
- Earnings and deduction breakdown
- Tax calculation display
- PDF download
- Print functionality
- Email distribution

### 5. Tax Management
- Configurable tax slabs by income bracket
- Support for multiple financial years
- Automatic tax calculation
- Employee tax declarations
- Investment proof tracking

### 6. Bank Disbursement
- Salary disbursement tracking
- Bank file generation (CSV/Excel)
- Status management (pending/processed/failed)
- Transaction reference tracking
- Summary statistics

### 7. Reporting
- Payroll summary reports
- Department-wise payroll analysis
- CTC reports
- Payroll register
- Statutory reports
- Tax reports
- PDF/Excel export

## 🚀 Quick Start

### 1. Database Setup
Execute the SQL migration in Supabase:
```bash
# File: supabase/migrations/payroll_schema.sql
```

### 2. Access the Module
Navigate to: **Admin Dashboard → Payroll & Compensation**

### 3. Create Salary Structure
1. Go to **Structures** tab
2. Click **New Structure**
3. Enter structure name and employment type
4. Add salary components
5. Save

### 4. Assign Salary to Employees
1. Select a structure
2. Assign to employees
3. Set basic salary and CTC
4. Save

### 5. Process Payroll
1. Go to **Payroll** tab
2. Select month and year
3. Click **Process Payroll**
4. Review preview
5. Click **Finalize**

### 6. Generate Payslips
Payslips are automatically generated after finalization.

### 7. Manage Disbursements
1. Go to **Disbursement** tab
2. Select payroll run
3. Generate bank file
4. Update disbursement status

## 📊 Calculation Logic

```
Employee Salary Calculation Flow:

1. Get Employee Salary Structure
2. Fetch Attendance & Leave Data
3. Calculate Working Days (excluding weekends)
4. Calculate Leave Days (approved leaves)
5. Calculate Pro-rata Basic Salary
   = Basic × (Actual Working Days / Total Working Days)
6. Calculate Salary Components
   - Earnings: HRA, Conveyance, Medical, etc.
   - Deductions: PF, Insurance, etc.
7. Apply Payroll Adjustments
   - Ad-hoc additions
   - Ad-hoc deductions
8. Calculate Gross Salary
   = Pro-rata Basic + Earnings + Adjustments
9. Calculate Tax (Based on Tax Slabs)
10. Calculate Net Salary
    = Gross - Deductions - Tax
```

## 🔧 Configuration

### Tax Slabs
Configure tax slabs in the **Tax** tab:
1. Select financial year
2. Click **Add Tax Slab**
3. Enter min income, max income, and tax rate
4. Save

### Salary Components
Add salary components in the **Structures** tab:
1. Select a structure
2. Click **Add Component**
3. Enter component name, type, and amount
4. Save

## 📈 Reports

Available reports:
- **Payroll Summary** - Overview of payroll for the month
- **Department Payroll** - Department-wise payroll analysis
- **CTC Report** - Cost to company analysis
- **Payroll Register** - Detailed payroll register
- **Statutory Report** - Compliance and statutory information
- **Tax Report** - Tax deduction and calculation details

## 🔐 Security

- Row Level Security (RLS) on all tables
- Admin-only access enforcement
- Audit logging for all operations
- Data validation (frontend & backend)
- Sensitive data encryption
- API authentication

## 📁 File Structure

```
nexon-attendo/
├── server/
│   ├── services/
│   │   ├── payroll.service.ts
│   │   └── payroll-calculation.service.ts
│   ├── api/
│   │   └── payroll.ts
│   └── index.ts (updated)
├── src/
│   ├── pages/admin/
│   │   ├── PayrollPage.tsx
│   │   ├── PayrollOverview.tsx
│   │   ├── SalaryStructureManager.tsx
│   │   ├── PayrollRunManager.tsx
│   │   ├── PayslipViewer.tsx
│   │   ├── TaxManagementPanel.tsx
│   │   ├── BankDisbursementPanel.tsx
│   │   └── PayrollReports.tsx
│   ├── lib/
│   │   └── payroll-api.ts
│   ├── components/
│   │   └── Sidebar.tsx (updated)
│   └── App.tsx (updated)
├── supabase/
│   └── migrations/
│       └── payroll_schema.sql
└── docs/
    ├── PAYROLL_IMPLEMENTATION_GUIDE.md
    ├── PAYROLL_QUICK_REFERENCE.md
    ├── PAYROLL_IMPLEMENTATION_SUMMARY.md
    ├── PAYROLL_DEPLOYMENT_CHECKLIST.md
    ├── PAYROLL_FILE_INDEX.md
    └── README.md (this file)
```

## 🧪 Testing

### Unit Tests
- Payroll calculation logic
- Tax calculation
- Component calculations

### Integration Tests
- Salary structure creation
- Employee salary assignment
- Payroll run processing
- Payslip generation

### End-to-End Tests
- Complete payroll workflow
- Disbursement tracking
- Report generation

## 📚 Documentation

- **[Implementation Guide](./PAYROLL_IMPLEMENTATION_GUIDE.md)** - Comprehensive setup and usage guide
- **[Quick Reference](./PAYROLL_QUICK_REFERENCE.md)** - Developer quick reference
- **[Implementation Summary](./PAYROLL_IMPLEMENTATION_SUMMARY.md)** - High-level overview
- **[Deployment Checklist](./PAYROLL_DEPLOYMENT_CHECKLIST.md)** - Deployment verification
- **[File Index](./PAYROLL_FILE_INDEX.md)** - Complete file listing

## 🔗 Integration

### With Existing Modules
- **Attendance Module** - Fetches attendance records, calculates working days
- **Leave Management** - Retrieves approved leaves, applies deductions
- **Employee Management** - Links to employee profiles, maintains hierarchy

### Data Flow
```
Employee Profile
    ↓
Salary Structure Assignment
    ↓
Attendance & Leave Data
    ↓
Payroll Calculation
    ↓
Payslip Generation
    ↓
Bank Disbursement
```

## 🚨 Troubleshooting

### Payroll calculation not working
- Check if employee has salary structure assigned
- Verify attendance data exists for the month
- Check tax slabs are configured

### Payslips not generating
- Ensure payroll run is finalized
- Check employee bank account is configured
- Verify PDF generation service is running

### Disbursement status not updating
- Check database permissions
- Verify transaction reference format
- Check for duplicate entries

## 📞 Support

For issues or questions:
1. Check the [Implementation Guide](./PAYROLL_IMPLEMENTATION_GUIDE.md)
2. Review the [Quick Reference](./PAYROLL_QUICK_REFERENCE.md)
3. Check error logs in browser console
4. Check Supabase logs for database errors
5. Contact the development team

## 🔮 Future Enhancements

- Accounting software integration
- Xero Payroll integration
- Time tracking integration
- Mobile app support
- Employee self-service portal
- Compliance automation
- Bulk operations
- Multi-level approval workflow

## 📋 API Endpoints

### Salary Structures
```
POST   /api/payroll/salary-structures
GET    /api/payroll/salary-structures
GET    /api/payroll/salary-structures/:id
```

### Payroll Processing
```
POST   /api/payroll/payroll-runs
GET    /api/payroll/payroll-runs
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

See [Implementation Guide](./PAYROLL_IMPLEMENTATION_GUIDE.md) for complete API documentation.

## 📊 Database Schema

13 tables created:
- `salary_structures` - Salary structure definitions
- `salary_components` - Salary components
- `employee_salary` - Employee salary assignments
- `salary_revision_history` - Salary change history
- `payroll_runs` - Monthly payroll runs
- `payroll_entries` - Payroll calculations
- `payroll_adjustments` - Ad-hoc adjustments
- `tax_slabs` - Tax configuration
- `tax_declarations` - Employee tax declarations
- `investment_proofs` - Tax investment proofs
- `payslips` - Generated payslips
- `bank_accounts` - Employee bank accounts
- `salary_disbursements` - Salary disbursements

## ✅ Deployment Status

- **Status:** ✅ Production Ready
- **Version:** 1.0.0
- **Last Updated:** 2024
- **Code Quality:** Production Grade
- **Documentation:** Complete
- **Testing:** Comprehensive

## 📝 License

Part of the Nexus HR Platform

## 👥 Contributors

- Development Team
- QA Team
- Business Team

---

**For detailed information, refer to the documentation files in the `docs/` directory.**

**Questions? Check the [Implementation Guide](./PAYROLL_IMPLEMENTATION_GUIDE.md) or contact the development team.**
