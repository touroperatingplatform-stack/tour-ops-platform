-- Check if generate_demo_data function exists
SELECT 
  routine_name,
  routine_schema,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_demo_data';

-- Also check what functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
