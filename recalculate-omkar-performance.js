/**
 * Recalculate Omkar's Performance Metrics
 * Direct calculation without importing TypeScript service
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const recalculateOmkarPerformance = async () => {
  console.log('🔧 Recalculating Omkar\'s Performance Metrics...');
  
  try {
    const omkarId = 'f017bda9-1ac0-4296-9fe5-d0c29f35690e';
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    console.log(`📅 Calculating for: ${currentMonth}/${currentYear}`);
    console.log(`👤 Employee ID: ${omkarId}`);
    
    // Get attendance data for current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', omkarId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
    
    if (attError) {
      console.error('❌ Attendance fetch error:', attError);
      return;
    }
    
    console.log(`📋 Found ${attendance?.length || 0} attendance records for current month`);
    
    // Calculate metrics
    const daysPresent = attendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
    const daysAbsent = attendance?.filter(a => a.status === 'absent').length || 0;
    const lateDays = attendance?.filter(a => a.status === 'late').length || 0;
    const onTimeDays = attendance?.filter(a => a.status === 'present').length || 0;
    
    const totalWorkingDays = attendance?.length || 0;
    const attendanceRate = totalWorkingDays > 0 ? (daysPresent / totalWorkingDays) * 100 : 0;
    const punctualityScore = daysPresent > 0 ? (onTimeDays / daysPresent) * 100 : 0;
    
    console.log('📊 Calculated metrics:', {
      total_working_days: totalWorkingDays,
      days_present: daysPresent,
      days_absent: daysAbsent,
      late_days: lateDays,
      on_time_days: onTimeDays,
      attendance_rate: Math.round(attendanceRate * 100) / 100,
      punctuality_score: Math.round(punctualityScore * 100) / 100
    });
    
    // Check if performance_metrics table exists and try to insert
    try {
      const metrics = {
        employee_id: omkarId,
        month: currentMonth,
        year: currentYear,
        total_working_days: totalWorkingDays,
        days_present: daysPresent,
        days_absent: daysAbsent,
        days_on_leave: 0,
        days_on_holiday: 0,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        on_time_days: onTimeDays,
        late_days: lateDays,
        avg_late_minutes: 0,
        punctuality_score: Math.round(punctualityScore * 100) / 100,
        total_breaks: 0,
        avg_breaks_per_day: 0,
        total_break_minutes: 0,
        avg_break_duration: 0,
        overall_score: Math.round(attendanceRate * 100) / 100,
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: result, error: upsertError } = await supabase
        .from('performance_metrics')
        .upsert(metrics, {
          onConflict: 'employee_id,month,year'
        })
        .select()
        .single();
      
      if (upsertError) {
        console.log('⚠️  Performance metrics table issue:', upsertError.message);
        console.log('📋 This might be due to RLS policies or missing table');
        console.log('💡 Run the CREATE_PERFORMANCE_METRICS_TABLE.sql script in Supabase');
      } else {
        console.log('✅ Performance metrics updated successfully!');
        console.log('📊 Final metrics:', {
          total_working_days: result.total_working_days,
          days_present: result.days_present,
          days_absent: result.days_absent,
          attendance_rate: result.attendance_rate,
          overall_score: result.overall_score
        });
      }
      
    } catch (error) {
      console.log('⚠️  Performance metrics table not accessible:', error.message);
    }
    
    console.log('\n🎉 Calculation completed!');
    console.log('📋 Next steps:');
    console.log('1. If performance_metrics table issue, run CREATE_PERFORMANCE_METRICS_TABLE.sql');
    console.log('2. Refresh the browser (Ctrl+F5)');
    console.log('3. Check admin dashboard for updated metrics');
    console.log('4. Verify employee dashboard shows correct data');
    
    console.log('\n📊 Expected UI Display:');
    console.log(`   Present Days: ${daysPresent}`);
    console.log(`   Absent Days: ${daysAbsent}`);
    console.log(`   Total Days: ${totalWorkingDays}`);
    console.log(`   Attendance Rate: ${Math.round(attendanceRate * 100) / 100}%`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

recalculateOmkarPerformance();