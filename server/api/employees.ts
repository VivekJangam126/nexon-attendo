import { employeeService } from '../services/employee.service';

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname.replace('/api/employees/', '');
    const method = req.method;

    // GET /api/employees
    if (pathname === '' && method === 'GET') {
      const employees = await employeeService.getAllEmployees();
      return res.json({ success: true, data: employees });
    }

    // GET /api/employees/:id
    if (pathname && method === 'GET') {
      const employee = await employeeService.getEmployeeDetail(pathname);
      return res.json({ success: true, data: employee });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
