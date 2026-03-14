/**
 * Recalculate Performance Metrics
 * Run this to update all employee performance data with the fixed calculation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function recalculateAllMetrics() {
  try {
    console.log('🔄 Starting performance metrics recalculation...');
    
    // Get all employees
    const { data: employees } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'employee');
    
    console.log(`👥 Found ${employees?.length || 0} employees`);
    
    // Find the most recent month with attendance data
    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (!recentAttendance) {
      console.log('❌ No attendance data found');
      return;
    }
    
    const recentDate = new Date(recentAttendance.date);
    const month = recentDate.getMonth() + 1;
    const year = recentDate.getFullYear();
    
    console.log(`📅 Calculating metrics for: ${month}/${year}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each employee
    for (const employee of employees || []) {
      try {
        console.log(`📊 Processing: ${employee.full_name}`);
        
        // Calculate metrics for this employee
        await calculateEmployeeMetrics(employee.id, month, year);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error for ${employee.full_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\\n✅ Recalculation complete!`);
    console.log(`✅ Success: ${successCount} employees`);
    console.log(`❌ Errors: ${errorCount} employees`);
    
  } catch (error) {
    console.error('❌ Recalculation failed:', error.message);
  }
}

async function calculateEmployeeMetrics(employeeId, month, year) {
  // Get working days for the month
  const workingDays = await getWorkingDaysInMonth(employeeId, month, year);
  
  // Get attendance data
  const attendanceData = await getAttendanceDataForMonth(employeeId, month, year);
  
  // Get break data
  const breakData = await getBreakDataForMonth(employeeId, month, year);
  
  // Calculate metrics
  const metrics = calculateMetrics(workingDays, attendanceData, breakData);
  
  // Save metrics
  const { error } = await supabase
    .from('performance_metrics')
    .upsert({
      employee_id: employeeId,
      month,
      year,
      ...metrics,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'employee_id,month,year'
    });
  
  if (error) throw error;
}

async function getWorkingDaysInMonth(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Simple calculation - assume 22 working days for now
  // In production, this should account for holidays
  return 22;
}

async function getAttendanceDataForMonth(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', employeeId)  // Fixed: use user_id instead of employee_id
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .gte('start_date', startDate.toISOString().split('T')[0])
    .lte('end_date', endDate.toISOString().split('T')[0]);

  return { attendance: attendance || [], leaves: leaves || [] };
}

async function getBreakDataForMonth(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const { data: breaks } = await supabase
    .from('break_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  return breaks || [];
}

function calculateMetrics(workingDays, attendanceData, breakData) {
  const { attendance, leaves } = attendanceData;
  
  // Fixed: Count both 'present' and 'late' as present
  const daysPresent = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysAbsent = attendance.filter(a => a.status === 'absent').length;
  const daysOnLeave = leaves.length;
  const attendanceRate = workingDays > 0 ? (daysPresent / workingDays) * 100 : 0;

  // Fixed: Separate on-time and late calculations
  const onTimeAttendance = attendance.filter(a => a.status === 'present');
  const lateAttendance = attendance.filter(a => a.status === 'late');
  
  const onTimeDays = onTimeAttendance.length;
  const lateDays = lateAttendance.length;
  const avgLateMinutes = lateDays > 0 ? 
    lateAttendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0) / lateDays : 0;
  const punctualityScore = daysPresent > 0 ? (onTimeDays / daysPresent) * 100 : 0;

  // Break metrics
  const totalBreaks = breakData.length;
  const avgBreaksPerDay = daysPresent > 0 ? totalBreaks / daysPresent : 0;
  const totalBreakMinutes = breakData.reduce((sum, b) => {
    if (b.break_start && b.break_end) {
      const start = new Date(b.break_start);
      const end = new Date(b.break_end);
      return sum + ((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return sum;
  }, 0);
  const avgBreakDuration = totalBreaks > 0 ? totalBreakMinutes / totalBreaks : 0;

  // Fixed: Overall score calculation with proper zero handling
  let overallScore = 0;
  if (daysPresent > 0) {
    overallScore = (
      (attendanceRate * 0.4) +
      (punctualityScore * 0.3) +
      (Math.max(0, 100 - (avgBreaksPerDay * 10)) * 0.3)
    );
  }

  return {
    total_working_days: workingDays,
    days_present: daysPresent,
    days_absent: daysAbsent,
    days_on_leave: daysOnLeave,
    days_on_holiday: 0,
    attendance_rate: Math.round(attendanceRate * 100) / 100,
    on_time_days: onTimeDays,
    late_days: lateDays,
    avg_late_minutes: Math.round(avgLateMinutes * 100) / 100,
    punctuality_score: Math.round(punctualityScore * 100) / 100,
    total_breaks: totalBreaks,
    avg_breaks_per_day: Math.round(avgBreaksPerDay * 100) / 100,
    total_break_minutes: Math.round(totalBreakMinutes),
    avg_break_duration: Math.round(avgBreakDuration * 100) / 100,
    overall_score: Math.round(overallScore * 100) / 100
  };
}

// Run the recalculation
recalculateAllMetrics();