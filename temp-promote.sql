-- Promote current user to super_admin for RBAC testing
UPDATE "user" 
SET role = 'super_admin', updated_at = NOW() 
WHERE email = 'abdullah.arshad@coastline-fm.com';

-- Verify the update
SELECT id, name, email, role, department, is_active 
FROM "user" 
WHERE email = 'abdullah.arshad@coastline-fm.com'; 