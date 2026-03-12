import { payrollService } from '../services/payroll.service';
import { payrollCalculationService } from '../services/payroll-calculation.service';

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname.replace('/api/payroll/', '');
    const method = req.method;

    // GET /api/payroll/salary-structures
    if (pathname === 'salary-structures' && method === 'GET') {
      const structures = await payrollService.getSalaryStructures();
      return res.json({ success: true, data: structures });
    }

    // POST /api/payroll/salary-structures
    if (pathname === 'salary-structures' && method === 'POST') {
      const structure = await payrollService.createSalaryStructure(req.body);
      return res.json({ success: true, data: structure });
    }

    // GET /api/payroll/salary-structures/:id
    if (pathname.startsWith('salary-structures/') && method === 'GET') {
      const id = pathname.split('/')[1];
      const structure = await payrollService.getSalaryStructureWithComponents(id);
      return res.json({ success: true, data: structure });
    }

    // POST /api/payroll/salary-components
    if (pathname === 'salary-components' && method === 'POST') {
      const component = await payrollService.addSalaryComponent(req.body);
      return res.json({ success: true, data: component });
    }

    // PUT /api/payroll/salary-components/:id
    if (pathname.startsWith('salary-components/') && method === 'PUT') {
      const id = pathname.split('/')[1];
      const component = await payrollService.updateSalaryComponent(id, req.body);
      return res.json({ success: true, data: component });
    }

    // DELETE /api/payroll/salary-components/:id
    if (pathname.startsWith('salary-components/') && method === 'DELETE') {
      const id = pathname.split('/')[1];
      await payrollService.deleteSalaryComponent(id);
      return res.json({ success: true });
    }

    // POST /api/payroll/employee-salary
    if (pathname === 'employee-salary' && method === 'POST') {
      const salary = await payrollService.assignSalaryToEmployee(req.body);
      return res.json({ success: true, data: salary });
    }

    // GET /api/payroll/employee-salary/:employeeId
    if (pathname.startsWith('employee-salary/') && method === 'GET') {
      const employeeId = pathname.split('/')[1];
      const salary = await payrollService.getEmployeeSalary(employeeId);
      return res.json({ success: true, data: salary });
    }

    // PUT /api/payroll/employee-salary/:id
    if (pathname.startsWith('employee-salary/') && method === 'PUT') {
      const id = pathname.split('/')[1];
      const salary = await payrollService.updateEmployeeSalary(id, req.body);
      return res.json({ success: true, data: salary });
    }

    // POST /api/payroll/salary-revision
    if (pathname === 'salary-revision' && method === 'POST') {
      const revision = await payrollService.reviseEmployeeSalary(
        req.body.employeeId,
        req.body
      );
      return res.json({ success: true, data: revision });
    }

    // POST /api/payroll/payroll-runs
    if (pathname === 'payroll-runs' && method === 'POST') {
      const { month, year } = req.body;
      const run = await payrollService.createPayrollRun(month, year);
      return res.json({ success: true, data: run });
    }

    // GET /api/payroll/payroll-runs
    if (pathname === 'payroll-runs' && method === 'GET') {
      const runs = await payrollService.getPayrollRuns();
      return res.json({ success: true, data: runs });
    }

    // GET /api/payroll/payroll-runs/:month/:year
    if (pathname.startsWith('payroll-runs/') && method === 'GET') {
      const parts = pathname.split('/');
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const run = await payrollService.getPayrollRun(month, year);
      return res.json({ success: true, data: run });
    }

    // POST /api/payroll/payroll-runs/:id/process
    if (pathname.includes('/process') && method === 'POST') {
      const result = await payrollCalculationService.processPayrollRun(
        req.body.month,
        req.body.year
      );
      return res.json({ success: true, data: result });
    }

    // POST /api/payroll/payroll-runs/:id/finalize
    if (pathname.includes('/finalize') && method === 'POST') {
      const id = pathname.split('/')[1];
      const result = await payrollCalculationService.finalizePayrollRun(id);
      return res.json({ success: true, data: result });
    }

    // POST /api/payroll/payroll-runs/:id/reverse
    if (pathname.includes('/reverse') && method === 'POST') {
      const id = pathname.split('/')[1];
      await payrollCalculationService.reversePayrollRun(id);
      return res.json({ success: true });
    }

    // GET /api/payroll/payroll-entries/:payrollRunId
    if (pathname.startsWith('payroll-entries/') && method === 'GET') {
      const payrollRunId = pathname.split('/')[1];
      const entries = await payrollService.getPayrollEntries(payrollRunId);
      return res.json({ success: true, data: entries });
    }

    // GET /api/payroll/payslips/:employeeId
    if (pathname.startsWith('payslips/') && method === 'GET' && !pathname.includes('detail')) {
      const employeeId = pathname.split('/')[1];
      const payslips = await payrollService.getPayslips(employeeId);
      return res.json({ success: true, data: payslips });
    }

    // GET /api/payroll/payslips/detail/:id
    if (pathname.startsWith('payslips/detail/') && method === 'GET') {
      const id = pathname.split('/')[2];
      const payslip = await payrollService.getPayslip(id);
      return res.json({ success: true, data: payslip });
    }

    // POST /api/payroll/bank-accounts
    if (pathname === 'bank-accounts' && method === 'POST') {
      const account = await payrollService.addBankAccount(req.body);
      return res.json({ success: true, data: account });
    }

    // GET /api/payroll/bank-accounts/:employeeId
    if (pathname.startsWith('bank-accounts/') && method === 'GET') {
      const employeeId = pathname.split('/')[1];
      const account = await payrollService.getEmployeeBankAccount(employeeId);
      return res.json({ success: true, data: account });
    }

    // GET /api/payroll/disbursements/:payrollRunId
    if (pathname.startsWith('disbursements/') && method === 'GET' && !pathname.includes('status')) {
      const payrollRunId = pathname.split('/')[1];
      const disbursements = await payrollService.getDisbursements(payrollRunId);
      return res.json({ success: true, data: disbursements });
    }

    // PUT /api/payroll/disbursements/:id/status
    if (pathname.includes('/status') && method === 'PUT') {
      const id = pathname.split('/')[1];
      const disbursement = await payrollService.updateDisbursementStatus(
        id,
        req.body.status,
        req.body.transactionReference
      );
      return res.json({ success: true, data: disbursement });
    }

    // POST /api/payroll/payroll-adjustments
    if (pathname === 'payroll-adjustments' && method === 'POST') {
      const adjustment = await payrollService.addPayrollAdjustment(req.body);
      return res.json({ success: true, data: adjustment });
    }

    // GET /api/payroll/tax-slabs
    if (pathname === 'tax-slabs' && method === 'GET') {
      const country = url.searchParams.get('country') || 'India';
      const year = url.searchParams.get('year');
      const slabs = await payrollService.getTaxSlabs(country, year || undefined);
      return res.json({ success: true, data: slabs });
    }

    // GET /api/payroll/stats
    if (pathname === 'stats' && method === 'GET') {
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');
      const runs = await payrollService.getPayrollRuns();
      const currentRun = runs.find(
        (r) => r.month === parseInt(month as string) && r.year === parseInt(year as string)
      );

      return res.json({
        success: true,
        data: {
          totalPayroll: currentRun?.total_payroll || 0,
          employeeCount: currentRun?.employee_count || 0,
          status: currentRun?.status || 'draft',
        },
      });
    }

    // GET /api/payroll/trend
    if (pathname === 'trend' && method === 'GET') {
      const runs = await payrollService.getPayrollRuns(12);
      const trend = runs.map((run) => ({
        month: run.month,
        year: run.year,
        totalPayroll: run.total_payroll || 0,
        employeeCount: run.employee_count || 0,
      }));

      return res.json({ success: true, data: trend });
    }

    // GET /api/payroll/departments
    if (pathname === 'departments' && method === 'GET') {
      return res.json({
        success: true,
        data: [
          { name: 'Engineering', totalPayroll: 0, employeeCount: 0 },
          { name: 'Sales', totalPayroll: 0, employeeCount: 0 },
          { name: 'HR', totalPayroll: 0, employeeCount: 0 },
        ],
      });
    }

    // GET /api/payroll/reports/summary
    if (pathname === 'reports/summary' && method === 'GET') {
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');
      const run = await payrollService.getPayrollRun(
        parseInt(month as string),
        parseInt(year as string)
      );

      if (!run) {
        return res.json({
          success: true,
          data: {
            month: parseInt(month as string),
            year: parseInt(year as string),
            totalPayroll: 0,
            employeeCount: 0,
            status: 'draft',
            entries: [],
          },
        });
      }

      const entries = await payrollService.getPayrollEntries(run.id);

      return res.json({
        success: true,
        data: {
          month: run.month,
          year: run.year,
          totalPayroll: run.total_payroll || 0,
          employeeCount: run.employee_count || 0,
          status: run.status,
          entries: entries || [],
        },
      });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
