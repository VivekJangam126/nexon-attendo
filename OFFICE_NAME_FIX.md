# Office Name Display Fix

## Issue
The office location was displaying as a UUID (e.g., `faa2bcd6-6c49-45ff-bd5b-c4f6407b718f`) instead of the actual office name throughout the application.

## Root Cause
The `office_location` field in the `profiles` table stores the office UUID, but the services were not joining with the `offices` table to fetch the actual office name.

## Solution

### Backend Changes

#### 1. Updated Profile Service (`server/services/profile.service.ts`)
- Modified `getProfile()` to join with the `offices` table
- Added SQL join: `offices:office_location (id, name)`
- Transforms the response to include `office_name` field

#### 2. Updated Employee Service (`server/services/employee.service.ts`)
- Modified `getAllEmployees()` to join with the `offices` table
- Modified `getEmployeeDetail()` to join with the `offices` table
- Both methods now populate the `office_name` field with the actual office name

#### 3. Updated Profile Type (`server/types/profile.ts`)
- Added optional `office_name?: string | null` field to `UserProfile` interface

### Frontend Changes

#### 1. Employee Dashboard (`src/pages/DashboardScreen.tsx`)
- Changed from displaying hardcoded "Assigned Office" text
- Now displays `profile.office_name` or fallback to 'Assigned Office'

#### 2. Profile Screen (`src/pages/ProfileScreen.tsx`)
- Removed unnecessary `officeService.getOfficeById()` call
- Removed loading state and Skeleton components
- Removed unused imports (`officeService`, `Skeleton`)
- Now directly displays `profile.office_name` from the profile data

#### 3. Employee Detail Screen (`src/pages/admin/AdminEmployeeDetailScreen.tsx`)
- Changed from displaying `employee.office_location` (UUID)
- Now displays `employee.office_name` (actual office name)

## Benefits

1. **Performance**: Reduced API calls by fetching office name in the initial profile/employee query
2. **Consistency**: Office name is now fetched and displayed consistently across all pages
3. **Simplicity**: Removed redundant office fetching logic from frontend components
4. **User Experience**: Users now see meaningful office names instead of UUIDs

## Testing

Verify the following:
1. Employee dashboard shows actual office name (not UUID)
2. Profile screen shows actual office name
3. Admin employee list shows office names
4. Admin employee detail page shows office name
5. All pages handle "Not assigned" case when office_location is null

## Database Query Example

The join query used:
```sql
SELECT 
  profiles.*,
  offices.name as office_name
FROM profiles
LEFT JOIN offices ON profiles.office_location = offices.id
```

This is handled automatically by Supabase with the syntax:
```typescript
.select(`
  *,
  offices:office_location (
    id,
    name
  )
`)
```
