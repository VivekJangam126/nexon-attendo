# Fix Office Location Display

## Problem
Office location was not displaying properly on Dashboard and Profile screens. The screens showed:
- Dashboard: "Assigned Office" (hardcoded text)
- Profile: Office name not showing

## Root Cause
1. **Profile Service**: Was only fetching from `profiles` table without joining with `offices` table to get the office name
2. **Dashboard Screen**: Had hardcoded text "Assigned Office" instead of using `profile.office_name`
3. **UserProfile Type**: Missing `office_name` field

## Solution

### 1. Updated UserProfile Type
Added `office_name` field to the UserProfile interface:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string | null;
  role: UserRole;
  status: UserStatus;
  office_location: string | null;
  office_name?: string | null;  // ← Added this
  created_at: string;
  updated_at: string;
}
```

### 2. Updated Profile Service
Modified `getProfile()` to fetch office name separately (since Supabase foreign key relationship isn't configured):

```typescript
// First, get the profile
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// If user has an office assigned, fetch the office name
let officeName = null;
if (profileData.office_location) {
  const { data: officeData, error: officeError } = await supabase
    .from('offices')
    .select('name')
    .eq('id', profileData.office_location)
    .single();

  if (!officeError && officeData) {
    officeName = officeData.name;
  }
}

const profile: UserProfile = {
  ...profileData,
  office_name: officeName,
};
```

This approach:
- Makes two separate queries instead of a join
- Works without foreign key relationships configured in Supabase
- Handles cases where office doesn't exist gracefully

### 3. Updated Dashboard Screen
Changed hardcoded text to use actual office name:

```typescript
// Before:
<Text style={styles.officeValue}>Assigned Office</Text>

// After:
<Text style={styles.officeValue}>{profile.office_name || 'Assigned Office'}</Text>
```

### 4. Profile Screen Already Correct
The Profile screen was already using `profile.office_name || 'Not Assigned'`, so no changes needed there.

## How It Works Now

### Database Queries
When fetching profile, two queries are made:

**Query 1: Get Profile**
```sql
SELECT * FROM profiles WHERE id = 'user-id';
```

**Query 2: Get Office Name (if office_location exists)**
```sql
SELECT name FROM offices WHERE id = 'office-location-id';
```

This approach works without requiring foreign key relationships to be configured in Supabase.

### Data Flow
1. User logs in → Profile fetched with office join
2. Profile object includes `office_name` field
3. Dashboard displays: `profile.office_name` (e.g., "Main Office")
4. Profile displays: `profile.office_name` (e.g., "Main Office")
5. If no office assigned: Shows "Assigned Office" (Dashboard) or "Not Assigned" (Profile)

## Testing

### Test Cases
1. **User with office assigned**:
   - Dashboard should show actual office name (e.g., "Main Office")
   - Profile should show actual office name (e.g., "Main Office")

2. **User without office assigned**:
   - Dashboard should not show office card (hidden by `{profile.office_location && ...}`)
   - Profile should show "Not Assigned"

3. **Office name changes**:
   - Pull to refresh should fetch updated office name
   - Navigating away and back should refresh data

### How to Test
1. Open mobile app
2. Login as employee
3. Check Dashboard → Office card should show actual office name
4. Navigate to Profile → Office Location should show actual office name
5. In Supabase, update office name in `offices` table
6. Pull down to refresh on Dashboard
7. Office name should update

## Console Logs

The profile service now logs detailed information:

```
👤 Fetching profile for user: c6a37983-0e9e-468b-8357-a3f98f7f2a6d
✅ Profile fetched: {
  name: 'Vivek Jangam',
  email: 'vivek@example.com',
  office_location: 'office-uuid-here',
  office_name: 'Main Office'
}
```

If there's an error:
```
❌ Error fetching profile: [error details]
```

## Database Requirements

### Profiles Table
Must have `office_location` column (UUID):
```sql
ALTER TABLE profiles
ADD COLUMN office_location UUID;
```

Note: Foreign key constraint is optional. The code works with or without it.

### Offices Table
Must have `name` column:
```sql
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_in_meters INTEGER DEFAULT 150,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Optional: Add Foreign Key (for data integrity)
```sql
ALTER TABLE profiles
ADD CONSTRAINT fk_office_location
FOREIGN KEY (office_location) 
REFERENCES offices(id)
ON DELETE SET NULL;
```

This is optional but recommended for data integrity.

## Files Modified

1. `mobile/src/types/auth.ts` - Added `office_name` field to UserProfile
2. `mobile/src/services/profile.service.ts` - Updated to join with offices table
3. `mobile/src/screens/employee/DashboardScreen.tsx` - Use `profile.office_name` instead of hardcoded text

## Related Issues

This fix also resolves:
- Office name not showing after office assignment
- Office name not updating after office change
- Inconsistent office display between screens

## Future Improvements

Potential enhancements:
- Cache office data to reduce queries
- Show office address and contact info
- Show office working hours
- Show distance to office
- Show map with office location
