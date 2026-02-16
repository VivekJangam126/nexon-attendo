# FINAL SETUP INSTRUCTIONS - MUST COMPLETE

## Current Status
✅ Database tables exist and are accessible  
✅ Attendance records exist  
❌ **attendance_settings table is EMPTY** (0 records)

This is why everything is failing. You MUST insert the default record.

---

## STEP 1: Insert Default Settings (REQUIRED)

### Option A: Via Supabase Dashboard (RECOMMENDED)

1. **Open your browser**
2. **Go to**: https://supabase.com/dashboard
3. **Select your project**: falbkccaqjqdbvrmdlll
4. **Click**: "SQL Editor" in left sidebar
5. **Click**: "New query" button
6. **Copy and paste this EXACT SQL**:

```sql
INSERT INTO attendance_settings (
    id,
    setting_name, 
    start_time, 
    end_time, 
    grace_period_minutes, 
    strict_mode, 
    is_active,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'default_attendance_window', 
    '09:00:00', 
    '18:00:00', 
    30, 
    true, 
    true,
    NOW(),
    NOW()
);
```

7. **Click**: "Run" button (or press Ctrl+Enter)
8. **You should see**: "Success. 1 row affected" or similar

### Verify the Insert

Run this query to confirm:

```sql
SELECT * FROM attendance_settings;
```

You should see 1 record with:
- setting_name: 'default_attendance_window'
- start_time: '09:00:00'
- end_time: '18:00:00'
- grace_period_minutes: 30

---

## STEP 2: Verify in Terminal

After inserting the record in Supabase, run:

```bash
npm run diagnose
```

**Expected output**:
```
📋 Checking Attendance Settings table (attendance_settings)...
  ✅ Table accessible
  📊 Sample data: [
    {
      id: '...',
      setting_name: 'default_attendance_window',
      start_time: '09:00:00',
      end_time: '18:00:00',
      grace_period_minutes: 30,
      ...
    }
  ]
```

If you still see "Sample data: []", the insert didn't work.

---

## STEP 3: Run Full Validation

```bash
npm run validate
```

This will:
- ✅ Fetch settings
- ✅ Fetch attendance records
- ✅ Validate each record
- ✅ Show which records are correct/incorrect
- ✅ Generate SQL to fix incorrect records

---

## STEP 4: Fix Incorrect Records (if needed)

If validation shows incorrect records, it will generate SQL like:

```sql
UPDATE attendance SET status = 'late', updated_at = NOW() WHERE id = '...';
```

Copy that SQL and run it in Supabase SQL Editor.

---

## STEP 5: Test in Browser

1. Open your app
2. Go to: Admin → Settings → Grace Period
3. Should show: "30 minutes" selected
4. Should show: "If the attendance window starts at 9:00 AM..."
5. Try changing to 15 minutes and save
6. Refresh and verify it saved

---

## Troubleshooting

### Problem: "Sample data: []" after insert

**Cause**: RLS policy blocking read access  
**Solution**: Add this RLS policy in Supabase SQL Editor:

```sql
-- Allow authenticated users to read settings
CREATE POLICY IF NOT EXISTS "enable_read_settings_authenticated"
  ON attendance_settings FOR SELECT
  TO authenticated
  USING (true);

-- Allow public read for active settings
CREATE POLICY IF NOT EXISTS "enable_read_active_settings_public"
  ON attendance_settings FOR SELECT
  TO anon
  USING (is_active = true);
```

Then run `npm run diagnose` again.

### Problem: Insert fails with "violates row-level security"

**Cause**: No INSERT policy  
**Solution**: SQL Editor bypasses RLS, so this shouldn't happen. Make sure you're running the SQL in Supabase SQL Editor, not via the API.

### Problem: "No active window found" in app

**Cause**: Record not inserted or is_active = false  
**Solution**: 
1. Check: `SELECT * FROM attendance_settings;`
2. If empty, run INSERT again
3. If exists but is_active = false, run: `UPDATE attendance_settings SET is_active = true WHERE setting_name = 'default_attendance_window';`

---

## Summary Checklist

- [ ] Opened Supabase Dashboard
- [ ] Went to SQL Editor
- [ ] Ran INSERT SQL
- [ ] Saw "Success" message
- [ ] Ran SELECT to verify record exists
- [ ] Ran `npm run diagnose` - shows 1 record
- [ ] Ran `npm run validate` - all tests pass
- [ ] Tested in browser - Grace Period shows 9:00 AM
- [ ] Changed grace period - saves successfully

---

## What This Fixes

Once the record is inserted:

✅ Grace Period settings will load correctly  
✅ Attendance Window settings will load correctly  
✅ Late marking will work based on database values  
✅ Admins can change grace period (5, 10, 15, 20, 30 min)  
✅ Admins can change window times  
✅ All tests will pass  

---

## Need Help?

If you're still stuck after following these steps:

1. Run: `npm run diagnose`
2. Take a screenshot of Supabase SQL Editor showing the INSERT query and result
3. Share both with me

The issue is 100% that the record isn't in the database. Once it's there, everything will work.
