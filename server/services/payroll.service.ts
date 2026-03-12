import { supabase } from '../supabase/client';
import type { Database } from '../types/database';

type SalaryStructure = Database['public']['Tables']['salary_structures']['Row'];
type SalaryComponent = Database['public']['Tables']['salary_components']['Row'];
type EmployeeSalary = Database['public']['Tables']['employee_salary']['Row'];
type PayrollRun = Database['public']['Tables']['payroll_runs']['Row'];
type PayrollEntry = Database['public']['Tables']['payroll_entries']['Row'];
type Payslip = Database['public']['Tables']['payslips']['Row'];

export const payrollService = {
  // Salary Structures
  async createSalaryStructure(data: {
    name: string;
    employment_type: string;
    currency?: string;
  }) {
    const { data: structure, error } = await supabase
      .from('salary_structures')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return structure;
  },

  async getSalaryStructures() {
    const { data, error } = await supabase
      .from('salary_structures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSalaryStructureWithComponents(structureId: string) {
    const { data: structure, error: structureError } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('id', structureId)
      .single();

    if (structureError) throw structureError;

    const { data: components, error: componentsError } = await supabase
      .from('salary_components')
      .select('*')
      .eq('structure_id', structureId);

    if (componentsError) throw componentsError;

    return { ...structure, components };
  },

  // Salary Components
  async addSalaryComponent(data: {
    structure_id: string;
    component_name: string;
    component_type: 'earning' | 'deduction';
    calculation_type: 'fixed' | 'percentage';
    amount: number;
  }) {
    const { data: component, error } = await supabase
      .from('salary_components')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return component;
  },

  async updateSalaryComponent(componentId: string, data: Partial<SalaryComponent>) {
    const { data: component, error } = await supabase
      .from('salary_components')
      .update(data)
      .eq('id', componentId)
      .select()
      .single();

    if (error) throw error;
    return component;
  },

  async deleteSalaryComponent(componentId: string) {
    const { error } = await supabase
      .from('salary_components')
      .delete()
      .eq('id', componentId);

    if (error) throw error;
  },

  // Employee Salary Assignment
  async assignSalaryToEmployee(data: {
    employee_id: string;
    structure_id: string;
    effective_date: string;
    basic_salary: number;
    ctc: number;
  }) {
    const { data: salary, error } = await supabase
      .from('employee_salary')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return salary;
  },

  async getEmployeeSalary(employeeId: string) {
    const { data, error } = await supabase
      .from('employee_salary')
      .select('*, salary_structures(*), salary_components(*)')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateEmployeeSalary(salaryId: string, data: Partial<EmployeeSalary>) {
    const { data: salary, error } = await supabase
      .from('employee_salary')
      .update(data)
      .eq('id', salaryId)
      .select()
      .single();

    if (error) throw error;
    return salary;
  },

  async reviseEmployeeSalary(employeeId: string, data: {
    old_ctc: number;
    new_ctc: number;
    revision_date: string;
    reason?: string;
  }) {
    const { data: revision, error } = await supabase
      .from('salary_revision_history')
      .insert([{ employee_id: employeeId, ...data }])
      .select()
      .single();

    if (error) throw error;
    return revision;
  },

  // Payroll Runs
  async createPayrollRun(month: number, year: number) {
    const { data: run, error } = await supabase
      .from('payroll_runs')
      .insert([{ month, year }])
      .select()
      .single();

    if (error) throw error;
    return run;
  },

  async getPayrollRun(month: number, year: number) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getPayrollRuns(limit = 12) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async updatePayrollRunStatus(payrollRunId: string, status: 'draft' | 'finalized' | 'reversed') {
    const { data: run, error } = await supabase
      .from('payroll_runs')
      .update({ status })
      .eq('id', payrollRunId)
      .select()
      .single();

    if (error) throw error;
    return run;
  },

  // Payroll Entries
  async createPayrollEntry(data: {
    payroll_run_id: string;
    employee_id: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    tax: number;
    net_salary: number;
    working_days?: number;
    leave_days?: number;
  }) {
    const { data: entry, error } = await supabase
      .from('payroll_entries')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return entry;
  },

  async getPayrollEntries(payrollRunId: string) {
    const { data, error } = await supabase
      .from('payroll_entries')
      .select('*, profiles(full_name, email)')
      .eq('payroll_run_id', payrollRunId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updatePayrollEntry(entryId: string, data: Partial<PayrollEntry>) {
    const { data: entry, error } = await supabase
      .from('payroll_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return entry;
  },

  // Payslips
  async generatePayslip(data: {
    employee_id: string;
    payroll_run_id: string;
    month: number;
    year: number;
    gross_salary: number;
    deductions: number;
    tax: number;
    net_salary: number;
    pdf_url?: string;
  }) {
    const { data: payslip, error } = await supabase
      .from('payslips')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return payslip;
  },

  async getPayslips(employeeId: string) {
    const { data, error } = await supabaseClient
      .from('payslips')
      .select('*')
      .eq('employee_id', employeeId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPayslip(payslipId: string) {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('id', payslipId)
      .single();

    if (error) throw error;
    return data;
  },

  // Tax Management
  async getTaxSlabs(country: string, financialYear?: string) {
    let query = supabase
      .from('tax_slabs')
      .select('*')
      .eq('country', country);

    if (financialYear) {
      query = query.eq('financial_year', financialYear);
    }

    const { data, error } = await query.order('min_income', { ascending: true });

    if (error) throw error;
    return data;
  },

  async calculateTax(income: number, country: string, financialYear?: string): Promise<number> {
    const slabs = await this.getTaxSlabs(country, financialYear);
    
    let tax = 0;
    for (const slab of slabs) {
      if (income > slab.min_income) {
        const maxIncome = slab.max_income || income;
        const taxableIncome = Math.min(income, maxIncome) - slab.min_income;
        tax += taxableIncome * (slab.tax_rate / 100);
      }
    }
    return tax;
  },

  // Bank Accounts
  async addBankAccount(data: {
    employee_id: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    country?: string;
  }) {
    const { data: account, error } = await supabase
      .from('bank_accounts')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return account;
  },

  async getEmployeeBankAccount(employeeId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Salary Disbursements
  async createDisbursement(data: {
    payroll_run_id: string;
    employee_id: string;
    amount: number;
  }) {
    const { data: disbursement, error } = await supabase
      .from('salary_disbursements')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return disbursement;
  },

  async getDisbursements(payrollRunId: string) {
    const { data, error } = await supabase
      .from('salary_disbursements')
      .select('*, profiles(full_name, email)')
      .eq('payroll_run_id', payrollRunId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateDisbursementStatus(disbursementId: string, status: string, transactionRef?: string) {
    const { data: disbursement, error } = await supabase
      .from('salary_disbursements')
      .update({ status, transaction_reference: transactionRef })
      .eq('id', disbursementId)
      .select()
      .single();

    if (error) throw error;
    return disbursement;
  },

  // Payroll Adjustments
  async addPayrollAdjustment(data: {
    employee_id: string;
    type: 'addition' | 'deduction';
    amount: number;
    reason?: string;
    month: number;
    year: number;
  }) {
    const { data: adjustment, error } = await supabase
      .from('payroll_adjustments')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return adjustment;
  },

  async getPayrollAdjustments(employeeId: string, month: number, year: number) {
    const { data, error } = await supabase
      .from('payroll_adjustments')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;
    return data;
  },
};
