-- Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Salary Components
CREATE TABLE IF NOT EXISTS salary_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL CHECK (component_type IN ('earning', 'deduction')),
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('fixed', 'percentage')),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(structure_id, component_name)
);

-- Employee Salary Assignment
CREATE TABLE IF NOT EXISTS employee_salary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  structure_id UUID NOT NULL REFERENCES salary_structures(id),
  effective_date DATE NOT NULL,
  basic_salary NUMERIC NOT NULL,
  ctc NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Salary Revision History
CREATE TABLE IF NOT EXISTS salary_revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_ctc NUMERIC NOT NULL,
  new_ctc NUMERIC NOT NULL,
  revision_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'reversed')),
  total_payroll NUMERIC DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Payroll Entries
CREATE TABLE IF NOT EXISTS payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basic_salary NUMERIC NOT NULL,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  working_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- Payroll Adjustments
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('addition', 'deduction')),
  amount NUMERIC NOT NULL,
  reason TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tax Slabs
CREATE TABLE IF NOT EXISTS tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  min_income NUMERIC NOT NULL,
  max_income NUMERIC,
  tax_rate NUMERIC NOT NULL,
  financial_year TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, min_income, financial_year)
);

-- Tax Declarations
CREATE TABLE IF NOT EXISTS tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  investment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Investment Proofs
CREATE TABLE IF NOT EXISTS investment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES profiles(id)
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  gross_salary NUMERIC NOT NULL,
  deductions NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  net_salary NUMERIC NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, payroll_run_id)
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Salary Disbursements
CREATE TABLE IF NOT EXISTS salary_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'reversed')),
  transaction_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- Create indexes for performance
CREATE INDEX idx_employee_salary_employee_id ON employee_salary(employee_id);
CREATE INDEX idx_employee_salary_structure_id ON employee_salary(structure_id);
CREATE INDEX idx_payroll_entries_payroll_run_id ON payroll_entries(payroll_run_id);
CREATE INDEX idx_payroll_entries_employee_id ON payroll_entries(employee_id);
CREATE INDEX idx_payroll_adjustments_employee_id ON payroll_adjustments(employee_id);
CREATE INDEX idx_payroll_adjustments_month_year ON payroll_adjustments(month, year);
CREATE INDEX idx_tax_declarations_employee_id ON tax_declarations(employee_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_payroll_run_id ON payslips(payroll_run_id);
CREATE INDEX idx_bank_accounts_employee_id ON bank_accounts(employee_id);
CREATE INDEX idx_salary_disbursements_payroll_run_id ON salary_disbursements(payroll_run_id);
CREATE INDEX idx_salary_disbursements_employee_id ON salary_disbursements(employee_id);
