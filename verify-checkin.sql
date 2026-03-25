-- Verify the check-in was saved
SELECT 
    t.name as tour_name,
    t.status,
    p.email as guide_email,
    c.checkin_type,
    c.checked_in_at,
    c.selfie_url,
    c.minutes_early_or_late
FROM tours t
JOIN profiles p ON t.guide_id = p.id
LEFT JOIN guide_checkins c ON c.tour_id = t.id
WHERE t.name = 'Tulum Test Tour';
