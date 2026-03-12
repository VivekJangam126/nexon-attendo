/**
 * Payroll API Integration
 * Frontend API client for payroll operations
 */

const API_BASE = '/api/payroll';

export const payrollAPI = {
  // Salary Structures
  async getSalaryStructures() {
    const response = await fetch(`${API_BASE}/salary-structures`);
    if (!response.ok) throw new Error('Failed to fetch salary structures');
    return response.json();
  },

  async createSalaryStructure(data: any) {
    const response = await fetch(`${API_BASE}/salary-structures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create salary structure');
    return response.json();
  },

  async getSalaryStructure(id: string) {
    const response = await fetch(`${API_BASE}/salary-structures/${id}`);
    if (!response.ok) throw new Error('Failed to fetch salary structure');
    return response.json();
  },

  // Salary Components
  async addSalaryComponent(data: any) {
    const response = await fetch(`${API_BASE}/salary-components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add salary component');
    return response.json();
  },

  async updateSalaryComponent(id: string, data: any) {
    const response = await fetch(`${API_BASE}/salary-components/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update salary component');
    return response.json();
  },

  async deleteSalaryComponent(id: string) {
    const response = await fetch(`${API_BASE}/salary-components/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete salary component');
    return response.json();
  },

  // Employee Salary
  async assignSalaryToEmployee(data: any) {
    const response = await fetch(`${API_BASE}/employee-salary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to assign salary');
    return response.json();
  },

  async getEmployeeSalary(employeeId: string) {
    const response = await fetch(`${API_BASE}/employee-salary/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch employee salary');
    return response.json();
  },

  async updateEmployeeSalary(id: string, data: any) {
    const response = await fetch(`${API_BASE}/employee-salary/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update employee salary');
    return response.json();
  },

  async reviseEmployeeSalary(data: any) {
    const response = await fetch(`${API_BASE}/salary-revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to revise salary');
    return response.json();
  },

  // Payroll Runs
  async getPayrollRuns() {
    const response = await fetch(`${API_BASE}/payroll-runs`);
    if (!response.ok) throw new Error('Failed to fetch payroll runs');
    return response.json();
  },

  async createPayrollRun(month: number, year: number) {
    const response = await fetch(`${API_BASE}/payroll-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    if (!response.ok) throw new Error('Failed to create payroll run');
    return response.json();
  },

  async getPayrollRun(month: number, year: number) {
    const response = await fetch(`${API_BASE}/payroll-runs/${month}/${year}`);
    if (!response.ok) throw new Error('Failed to fetch payroll run');
    return response.json();
  },

  async processPayrollRun(id: string, month: number, year: number) {
    const response = await fetch(`${API_BASE}/payroll-runs/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    if (!response.ok) throw new Error('Failed to process payroll');
    return response.json();
  },

  async finalizePayrollRun(id: string) {
    const response = await fetch(`${API_BASE}/payroll-runs/${id}/finalize`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to finalize payroll');
    return response.json();
  },

  async reversePayrollRun(id: string) {
    const response = await fetch(`${API_BASE}/payroll-runs/${id}/reverse`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reverse payroll');
    return response.json();
  },

  // Payroll Entries
  async getPayrollEntries(payrollRunId: string) {
    const response = await fetch(`${API_BASE}/payroll-entries/${payrollRunId}`);
    if (!response.ok) throw new Error('Failed to fetch payroll entries');
    return response.json();
  },

  // Payslips
  async getPayslips(employeeId: string) {
    const response = await fetch(`${API_BASE}/payslips/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch payslips');
    return response.json();
  },

  async getPayslip(id: string) {
    const response = await fetch(`${API_BASE}/payslips/detail/${id}`);
    if (!response.ok) throw new Error('Failed to fetch payslip');
    return response.json();
  },

  // Bank Accounts
  async addBankAccount(data: any) {
    const response = await fetch(`${API_BASE}/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add bank account');
    return response.json();
  },

  async getEmployeeBankAccount(employeeId: string) {
    const response = await fetch(`${API_BASE}/bank-accounts/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch bank account');
    return response.json();
  },

  // Disbursements
  async getDisbursements(payrollRunId: string) {
    const response = await fetch(`${API_BASE}/disbursements/${payrollRunId}`);
    if (!response.ok) throw new Error('Failed to fetch disbursements');
    return response.json();
  },

  async updateDisbursementStatus(id: string, status: string, transactionReference?: string) {
    const response = await fetch(`${API_BASE}/disbursements/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, transactionReference }),
    });
    if (!response.ok) throw new Error('Failed to update disbursement status');
    return response.json();
  },

  // Payroll Adjustments
  async addPayrollAdjustment(data: any) {
    const response = await fetch(`${API_BASE}/payroll-adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add payroll adjustment');
    return response.json();
  },
};
