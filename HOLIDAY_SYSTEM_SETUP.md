# Holiday System - Quick Setup Guide

## Step 1: Run Database Migration

You need to run the SQL migration to create the holiday tables in your Supabase database.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/holiday_work_schedule_system.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Make sure you're in the project root
cd nexon-attendo

# Run the migration
supabase db push
```

### Option C: Using psql

```bash
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/migrations/holiday_work_schedule_system.sql
```

## Step 2: Verify Migration

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_recurring_holidays', 'employee_specific_holidays');

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_employee_holiday';
```

You should see:
- `employee_recurring_holidays`
- `employee_specific_holidays`
- `is_employee_holiday` function

## Step 3: Test the System

### Admin Testing:

1. **Login as Admin**
   - Navigate to `/admin/login`
   - Login with admin credentials

2. **Access Holiday Calendar**
   - Click "Holiday Calendar" in the sidebar
   - Or navigate to `/admin/calendar`

3. **Create a Recurring Holiday**
   - Click on a weekday header (e.g., "SAT")
   - Select employees who have Saturday off
   - Click "Confirm Holiday"
   - Verify the calendar shows the holiday

4. **Create a Specific Holiday**
   - Click on a specific date
   - Select holiday type (e.g., "Festival")
   - Enter reason (e.g., "Holi")
   - Select employees
   - Click "Confirm Holiday"
   - Verify the calendar shows the holiday

### Employee Testing:

1. **Login as Employee**
   - Navigate to `/login`
   - Login with employee credentials

2. **View Holidays**
   - Click "My Holidays" in the sidebar
   - Or navigate to `/calendar`
   - Verify you see your recurring and upcoming holidays

### Attendance Integration Testing:

1. **Test Holiday Prevents Absent Marking**
   - Set Saturday as a recurring holiday for an employee
   - Wait until Saturday
   - Check admin dashboard
   - Verify the employee is NOT marked absent
   - Verify employees without Saturday holiday ARE marked absent (if they don't check in)

2. **Test Specific Holiday**
   - Create a specific holiday for tomorrow
   - Wait until tomorrow
   - Verify employees with the holiday are NOT marked absent

## Step 4: Common Issues & Solutions

### Issue: Tables not created
**Solution**: Check Supabase logs for SQL errors. Ensure you have proper permissions.

### Issue: API returns 404
**Solution**: Restart the development server to reload the API routes.

### Issue: Holidays not showing in calendar
**Solution**: Check browser console for errors. Verify API authentication token is valid.

### Issue: Employees still marked absent on holidays
**Solution**: 
1. Verify the holiday was created correctly in the database
2. Check the `employee_recurring_holidays` or `employee_specific_holidays` table
3. Ensure the employee_id matches the profile id
4. Restart the server to reload the holiday service

### Issue: RLS policy errors
**Solution**: Verify you're logged in as admin when creating holidays. Check Supabase RLS policies are enabled.

## Step 5: Populate Initial Data (Optional)

You can populate some common holidays for all employees:

```sql
-- Example: Set Sunday as holiday for all active employees
INSERT INTO employee_recurring_holidays (employee_id, day_of_week)
SELECT id, 0 -- 0 = Sunday
FROM profiles
WHERE role = 'employee' AND status = 'active'
ON CONFLICT (employee_id, day_of_week) DO NOTHING;

-- Example: Add Independence Day for all employees
INSERT INTO employee_specific_holidays (employee_id, holiday_date, holiday_type, reason)
SELECT id, '2026-08-15', 'public_holiday', 'Independence Day'
FROM profiles
WHERE role = 'employee' AND status = 'active'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Example: Add Republic Day for all employees
INSERT INTO employee_specific_holidays (employee_id, holiday_date, holiday_type, reason)
SELECT id, '2026-01-26', 'public_holiday', 'Republic Day'
FROM profiles
WHERE role = 'employee' AND status = 'active'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;
```

## Step 6: Development Server

Make sure your development server is running:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The server should be running on `http://localhost:8081`

## API Endpoints Reference

### Get Holidays
```
GET /api/holidays
Authorization: Bearer <token>
```

### Create Recurring Holiday (Admin)
```
POST /api/holidays/recurring
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "employee_ids": ["uuid1", "uuid2"],
  "day_of_week": 6
}
```

### Create Specific Holiday (Admin)
```
POST /api/holidays/specific
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "employee_ids": ["uuid1", "uuid2"],
  "holiday_date": "2026-03-25",
  "holiday_type": "festival",
  "reason": "Holi"
}
```

## Database Schema Reference

### employee_recurring_holidays
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| employee_id | UUID | References profiles(id) |
| day_of_week | INTEGER | 0=Sunday, 1=Monday, ..., 6=Saturday |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### employee_specific_holidays
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| employee_id | UUID | References profiles(id) |
| holiday_date | DATE | Holiday date (YYYY-MM-DD) |
| holiday_type | TEXT | public_holiday, festival, company_event, other |
| reason | TEXT | Holiday reason/name |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the server logs
3. Verify database tables were created correctly
4. Ensure API routes are registered in vite.config.ts
5. Verify authentication tokens are valid

## Next Steps

After setup is complete:
1. Configure holidays for your organization
2. Train admins on using the holiday calendar
3. Inform employees about viewing their holidays
4. Monitor attendance system to ensure holidays work correctly
5. Consider adding more holidays as needed

---

**System is now ready to use!** 🎉
