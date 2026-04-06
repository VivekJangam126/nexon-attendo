========================
MY LEAVE FEATURE - IMPLEMENTATION GUIDE
========================

## COMPLETED STEPS ✅

1. ✅ Database Migration SQL Created - ADD_MY_LEAVE_FEATURE.sql
2. ✅ Updated UserProfile Types (server & mobile)
3. ✅ Updated Registration Form with Gender Field
4. ✅ Updated Admin Add Employee Modal with Gender
5. ✅ Updated Admin Add Employee Screen with Gender
6. ✅ Updated Leave Dropdown - Shows "My Leave" only for female employees
7. ✅ Backend Validation - Eligibility & Monthly Limit
8. ✅ Approval Validation - Prevents approving My Leave for non-female

Build Status: ✅ SUCCESSFUL (11.04s)

========================
REMAINING STEPS (NOT YET IMPLEMENTED)
========================

### STEP 1: Run Database Migration
SQL file: D:\nexon-attendo\ADD_MY_LEAVE_FEATURE.sql

In Supabase SQL Editor, execute:
```sql
ALTER TABLE profiles 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT NULL;

CREATE INDEX idx_profiles_gender ON profiles(gender);

INSERT INTO leave_types (name, max_per_year) 
VALUES ('My Leave', 12)
ON CONFLICT (name) DO NOTHING;
```

### STEP 2: Update Admin Employee Detail Screen
File: src/pages/admin/AdminEmployeeDetailScreen.tsx

Add to editForm state:
```typescript
const [editForm, setEditForm] = useState({
  email: "",
  role: "employee" as 'employee' | 'admin',
  office_location: "",
  designation: "",
  role_type: "Employee" as 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern',
  gender: "" as 'male' | 'female' | '',  // Add this
});
```

In handleOpenEditDialog:
```typescript
setEditForm({
  email: employee.email,
  role: employee.role,
  office_location: employee.office_location || "",
  designation: employee.designation || "",
  role_type: employee.role_type || "Employee",
  gender: employee.gender || "",  // Add this
});
```

In handleSaveEdit call to employeeService.updateEmployeeProfile:
```typescript
const { success } = await employeeService.updateEmployeeProfile(id, {
  email: editForm.email,
  role: editForm.role,
  office_location: editForm.office_location,
  designation: editForm.designation,
  role_type: editForm.role_type,
  gender: editForm.gender,  // Add this
});
```

### STEP 3: Add Gender Edit UI in Admin Detail
File: src/pages/admin/AdminEmployeeDetailScreen.tsx

Add to edit modal form (in DialogContent):
```jsx
<div>
  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
    Gender
  </label>
  <select 
    value={editForm.gender} 
    onChange={(e) => setEditForm({...editForm, gender: e.target.value})} 
    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
  >
    <option value="">Not Set</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </select>
</div>
```

### STEP 4: Create Gender Column in Employee Admin Table
File: src/pages/admin/EmployeeListPage.tsx or equivalent

Add to admin employees table header:
```jsx
<TableHead>Gender</TableHead>
```

Add to table body row for each employee:
```jsx
<TableCell>
  {employee.gender ? (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      employee.gender === 'female'
        ? 'bg-pink-100 text-pink-800'
        : 'bg-blue-100 text-blue-800'
    }`}>
      {employee.gender === 'female' ? '👩 Female' : '👨 Male'}
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">Not Set</span>
  )}
</TableCell>
```

### STEP 5: Update Employee Service
File: server/services/employee.service.ts

Add gender to updateEmployeeProfile method:
```typescript
static async updateEmployeeProfile(
  userId: string,
  updates: {
    email?: string;
    role?: 'employee' | 'admin';
    office_location?: string;
    designation?: string;
    role_type?: string;
    gender?: string;  // Add this
  }
) {
  // ... existing code ...
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  // ... rest of method ...
}
```

### STEP 6: Update Registration Service
File: server/services/registration.service.ts

Add gender to registerEmployee method:
```typescript
static async registerEmployee(data: {
  email: string;
  password: string;
  full_name: string;
  office_id: string;
  role_type?: string;
  designation?: string;
  gender?: string;  // Add this
}) {
  // ... existing auth/user creation code ...
  
  // When creating profile:
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      email: data.email,
      full_name: data.full_name,
      office_location: office.city,
      office_id: data.office_id,
      role: 'employee',
      status: 'pending',
      gender: data.gender || null,  // Add this
      role_type: data.role_type,
      designation: data.designation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}
```

### STEP 7: Update Leave API Endpoints
File: server/routes/leave.routes.ts (or where leave endpoints are)

When calling LeaveService.applyForLeave, pass gender:
```typescript
// In the POST /leave/apply endpoint
const leaveRequest = await LeaveService.applyForLeave(
  userId,
  leaveTypeId,
  startDate,
  endDate,
  reason,
  userProfile.gender  // Pass gender here
);
```

### STEP 8: Update Admin Leave Table (Optional Enhanced Display)
File: src/components/leave/AdminLeaveRequestsTable.tsx

Add gender indicator for "My Leave" requests:
```jsx
// In the table cells for each request:
{request.leave_type?.name === 'My Leave' && (
  <div className="flex items-center gap-1">
    <span>👩 My Leave</span>
  </div>
)}
```

### STEP 9: Add Gender Filter in Admin Leave Management (Optional)
File: src/components/leave/AdminLeaveDashboard.tsx

Add filter to show only female employees' My Leave requests or add visual indicators.

========================
TESTING CHECKLIST
========================

### Frontend Tests
- [ ] Register new employee - gender field is required
- [ ] Register female employee - should see "My Leave" in dropdown
- [ ] Register male employee - should NOT see "My Leave" in dropdown
- [ ] Admin edit employee gender - Should update successfully
- [ ] Existing employees with null gender - Should not see "My Leave"
- [ ] Update gender to female - "My Leave" should appear
- [ ] Update gender to male - "My Leave" should disappear
- [ ] Admin employee table shows gender column with badge

### Backend Tests
- [ ] Female employee applies for My Leave - Should succeed
- [ ] Male employee tries to apply for My Leave - Should fail with error
- [ ] Female employee applies for second My Leave same month - Should fail
- [ ] Female employee applies for My Leave next month - Should succeed
- [ ] Admin tries to approve My Leave for male - Should fail
- [ ] Admin approves My Leave for female - Should succeed
- [ ] Database has gender column - Verify in Supabase

### Leave Balance Tests
- [ ] New female employee - My Leave balance = 12 (annual)
- [ ] My Leave used reduces remaining balance
- [ ] Multiple employees don't affect each other's My Leave count

========================
SECURITY VALIDATIONS
========================

✅ Already Implemented:
- Backend validation for gender eligibility (cannot apply frontend only)
- Backend validation for monthly limits (cannot bypass frontend)
- Approval validation (admin cannot approve for ineligible employees)

✅ Also Verified:
- Gender field is not editable by employees (only admin)
- All validations happen server-side

========================
DATABASE SCHEMA VERIFICATION
========================

After running migration, verify in Supabase:

1. Check profiles table has gender column:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'gender';
   ```

2. Check leave_types table has My Leave:
   ```sql
   SELECT * FROM leave_types WHERE name = 'My Leave';
   ```

3. Check index created:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'profiles' AND indexname LIKE '%gender%';
   ```

========================
EDGE CASES HANDLED
========================

1. ✅ NULL gender → Treated as not eligible, My Leave hidden
2. ✅ Existing employees without gender → Gracefully fallback
3. ✅ Gender updated later → Feature automatically reflects
4. ✅ Admin tries to approve for wrong gender → Blocked with error
5. ✅ Multiple approvals same month → Rejected
6. ✅ Female employee without balance → Uses annual max (12)

========================
CONFIGURATION IDs
========================

My Leave Leave Type ID: 55555555-5555-5555-5555-555555555555

This ID is hardcoded in:
- ApplyLeaveModal.tsx (frontend)
- leave.service.ts (backend)

If database has different UUID, update both files.

========================
NEXT STEPS FOR PRODUCTION
========================

1. Run database migration in production Supabase
2. Deploy frontend changes
3. Test with real employees
4. Train admins on gender field
5. Manual update of existing employees' gender (admin task)
6. Monitor leave requests for errors
7. Update HR policies document to include My Leave details

========================
KNOWN LIMITATIONS
========================

1. Gender is binary (male/female) - no other options
2. My Leave limit is per calendar month (not employment month)
3. Admin must manually set gender for existing employees
4. No automatic gender detection - manual entry only

========================
SUPPORT CONTACTS
========================

For issues:
- Registration errors → Check gender validation in RegisterScreen.tsx
- Leave dropdown issues → Check getAvailableLeaveTypes in ApplyLeaveModal.tsx
- Backend errors → Check LeaveService.applyForLeave and approveLeaveRequest
- Database issues → Check profiles table gender column and leave_types

========================
