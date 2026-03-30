-- Create profile records for the new guides with full_name
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, status, created_at)
VALUES 
  ('9b6f719b-5f50-4755-b4de-34eb7e77f3b9', 'guide1@test.me', 'Guide', 'One', 'Guide One', 'guide', 'active', NOW()),
  ('15e6cad4-b358-48e2-a888-23da2b81a050', 'guide2@test.me', 'Guide', 'Two', 'Guide Two', 'guide', 'active', NOW()),
  ('173d5f30-f72b-467d-9ce2-641ba9b4c05b', 'guide3@test.me', 'Guide', 'Three', 'Guide Three', 'guide', 'active', NOW()),
  ('441023ae-8498-40aa-bff4-48572e08d8ff', 'guide4@test.me', 'Guide', 'Four', 'Guide Four', 'guide', 'active', NOW()),
  ('e742aa03-61ad-4d65-b057-c9fdeda173ef', 'guide5@test.me', 'Guide', 'Five', 'Guide Five', 'guide', 'active', NOW()),
  ('4d91afd5-dbb8-4eef-8f7f-d2c7f17598b5', 'guide6@test.me', 'Guide', 'Six', 'Guide Six', 'guide', 'active', NOW())
ON CONFLICT (id) DO UPDATE SET role = 'guide', status = 'active', full_name = EXCLUDED.full_name;
