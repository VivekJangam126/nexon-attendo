import { employeeService } from '../services/employee.service';

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname.replace('/api/employees', '');
    const method = req.method;

    console.log('🔍 Employees API - pathname:', pathname, 'method:', method);

    // GET /api/employees
    if ((pathname === '' || pathname === '/') && method === 'GET') {
      console.log('📋 Getting all employees...');
      const { employees, error } = await employeeService.getAllEmployees();
      if (error) {
        console.log('❌ Error getting employees:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      console.log('✅ Found', employees.length, 'employees');
      return res.json({ success: true, data: employees });
    }

    // GET /api/employees/:id
    if (pathname && pathname !== '/' && method === 'GET') {
      const employeeId = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      console.log('📋 Getting employee detail for:', employeeId);
      const employee = await employeeService.getEmployeeDetail(employeeId);
      return res.json({ success: true, data: employee });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('❌ Employees API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
