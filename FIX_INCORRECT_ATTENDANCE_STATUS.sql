-- Fix Incorrect Attendance Status Records
-- These employees checked in after grace period but were marked as "present"
-- Grace period ends at 10:30 AM, so anyone after that should be "late"

-- Fix Shravani Santosh Padwal (checked in at 4:56 PM)
UPDATE attendance 
SET status = 'late', updated_at = NOW() 
WHERE id = '725fb2f9-ca79-4c9f-af47-4879a5d4bb74';

-- Fix Ruchita Jadhav (checked in at 4:57 PM)
UPDATE attendance 
SET status = 'late', updated_at = NOW() 
WHERE id = '2fa1109b-8760-4db0-b1d6-e3577a66ba92';

-- Fix Saidas Uttam Morvekar (checked in at 5:02 PM)
UPDATE attendance 
SET status = 'late', updated_at = NOW() 
WHERE id = '11d4ebf2-077d-4dd6-b467-c5233f147ccc';

-- Verify the fix
SELECT 
  p.full_name,
  a.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as check_in_ist,
  a.status,
  a.updated_at
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE a.id IN (
  '725fb2f9-ca79-4c9f-af47-4879a5d4bb74',
  '2fa1109b-8760-4db0-b1d6-e3577a66ba92',
  '11d4ebf2-077d-4dd6-b467-c5233f147ccc'
)
ORDER BY a.check_in_time;
