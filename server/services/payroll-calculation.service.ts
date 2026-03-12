import { supabase } from '../supabase/client';
import { payrollService } from './payroll.service';

interface PayrollCalculationInput {
  employeeId: string;
  month: number;
  year: number;
}

interface PayrollCalculationResult {
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  grossSalary: number;
  netSalary: number;
  workingDays: number;
  leaveDays: number;
  adjustments: { addition: number; deduction: number };
}

export const payrollCalculationService = {
  async calculatePayroll(input: PayrollCalculationInput): Promise<PayrollCalculationResult> {
    const { employeeId, month, year } = input;

    // Get employee salary structure
    const employeeSalary = await payrollService.getEmployeeSalary(employeeId);
    if (!employeeSalary) {
      throw new Error(`No salary structure assigned to employee ${employeeId}`);
    }

    const basicSalary = employeeSalary.basic_salary;

    // Get attendance data for the month
    const { workingDays, leaveDays } = await this.getAttendanceData(employeeId, month, year);

    // Calculate pro-rata salary if employee has leave
    const proRataSalary = this.calculateProRataSalary(basicSalary, workingDays, leaveDays);

    // Get salary components
    const { data: components } = await supabase
      .from('salary_components')
      .select('*')
      .eq('structure_id', employeeSalary.structure_id);

    // Calculate allowances and deductions
    const { allowances, deductions } = this.calculateComponents(
      components || [],
      proRataSalary
    );

    // Get payroll adjustments
    const adjustments = await this.getPayrollAdjustments(employeeId, month, year);

    // Calculate gross salary
    const grossSalary = proRataSalary + allowances + adjustments.addition - adjustments.deduction;

    // Calculate tax
    const tax = await payrollService.calculateTax(grossSalary, 'India', `${year}-${year + 1}`);

    // Calculate net salary
    const netSalary = grossSalary - deductions - tax;

    return {
      employeeId,
      basicSalary: proRataSalary,
      allowances,
      deductions,
      tax,
      grossSalary,
      netSalary,
      workingDays,
      leaveDays,
      adjustments,
    };
  },

  async getAttendanceData(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{ workingDays: number; leaveDays: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', employeeId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    // Get leave records
    const { data: leaves } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', startDate.toISOString().split('T')[0])
      .lte('end_date', endDate.toISOString().split('T')[0]);

    // Calculate working days (excluding weekends)
    let workingDays = 0;
    let leaveDays = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    // Count leave days
    if (leaves && leaves.length > 0) {
      for (const leave of leaves) {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            leaveDays++;
          }
        }
      }
    }

    return { workingDays, leaveDays };
  },

  calculateProRataSalary(basicSalary: number, workingDays: number, leaveDays: number): number {
    const totalWorkingDays = workingDays;
    const actualWorkingDays = workingDays - leaveDays;
    
    if (totalWorkingDays === 0) return 0;
    
    return (basicSalary / totalWorkingDays) * actualWorkingDays;
  },

  calculateComponents(
    components: any[],
    basicSalary: number
  ): { allowances: number; deductions: number } {
    let allowances = 0;
    let deductions = 0;

    for (const component of components) {
      const amount =
        component.calculation_type === 'percentage'
          ? (basicSalary * component.amount) / 100
          : component.amount;

      if (component.component_type === 'earning') {
        allowances += amount;
      } else if (component.component_type === 'deduction') {
        deductions += amount;
      }
    }

    return { allowances, deductions };
  },

  async getPayrollAdjustments(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{ addition: number; deduction: number }> {
    const adjustments = await payrollService.getPayrollAdjustments(employeeId, month, year);

    let addition = 0;
    let deduction = 0;

    for (const adj of adjustments) {
      if (adj.type === 'addition') {
        addition += adj.amount;
      } else if (adj.type === 'deduction') {
        deduction += adj.amount;
      }
    }

    return { addition, deduction };
  },

  async processPayrollRun(month: number, year: number) {
    // Get or create payroll run
    let payrollRun = await payrollService.getPayrollRun(month, year);
    if (!payrollRun) {
      payrollRun = await payrollService.createPayrollRun(month, year);
    }

    // Get all active employees
    const { data: employees } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'employee')
      .eq('status', 'active');

    if (!employees || employees.length === 0) {
      return { payrollRunId: payrollRun.id, entries: [] };
    }

    const entries = [];
    let totalPayroll = 0;

    for (const employee of employees) {
      try {
        const calculation = await this.calculatePayroll({
          employeeId: employee.id,
          month,
          year,
        });

        const entry = await payrollService.createPayrollEntry({
          payroll_run_id: payrollRun.id,
          employee_id: employee.id,
          basic_salary: calculation.basicSalary,
          allowances: calculation.allowances,
          deductions: calculation.deductions,
          tax: calculation.tax,
          net_salary: calculation.netSalary,
          working_days: calculation.workingDays,
          leave_days: calculation.leaveDays,
        });

        entries.push(entry);
        totalPayroll += calculation.netSalary;
      } catch (error) {
        console.error(`Error calculating payroll for employee ${employee.id}:`, error);
      }
    }

    // Update payroll run with totals
    await supabase
      .from('payroll_runs')
      .update({
        total_payroll: totalPayroll,
        employee_count: entries.length,
      })
      .eq('id', payrollRun.id);

    return { payrollRunId: payrollRun.id, entries };
  },

  async finalizePayrollRun(payrollRunId: string) {
    // Get payroll entries
    const { data: entries } = await supabase
      .from('payroll_entries')
      .select('*')
      .eq('payroll_run_id', payrollRunId);

    if (!entries || entries.length === 0) {
      throw new Error('No payroll entries found');
    }

    // Generate payslips for each entry
    const payslips = [];
    for (const entry of entries) {
      const payslip = await payrollService.generatePayslip({
        employee_id: entry.employee_id,
        payroll_run_id: payrollRunId,
        month: entry.created_at ? new Date(entry.created_at).getMonth() + 1 : 1,
        year: entry.created_at ? new Date(entry.created_at).getFullYear() : new Date().getFullYear(),
        gross_salary: entry.basic_salary + entry.allowances,
        deductions: entry.deductions,
        tax: entry.tax,
        net_salary: entry.net_salary,
      });

      payslips.push(payslip);

      // Create disbursement record
      await payrollService.createDisbursement({
        payroll_run_id: payrollRunId,
        employee_id: entry.employee_id,
        amount: entry.net_salary,
      });
    }

    // Update payroll run status
    await payrollService.updatePayrollRunStatus(payrollRunId, 'finalized');

    return { payslips, entries };
  },

  async reversePayrollRun(payrollRunId: string) {
    // Delete payslips
    await supabase
      .from('payslips')
      .delete()
      .eq('payroll_run_id', payrollRunId);

    // Delete disbursements
    await supabase
      .from('salary_disbursements')
      .delete()
      .eq('payroll_run_id', payrollRunId);

    // Delete payroll entries
    await supabase
      .from('payroll_entries')
      .delete()
      .eq('payroll_run_id', payrollRunId);

    // Update payroll run status
    await payrollService.updatePayrollRunStatus(payrollRunId, 'reversed');
  },
};
