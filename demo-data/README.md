# Demo Data Import Files

Use these CSV files to populate demo data for testing.

## Usage

1. Go to `/super-admin` dashboard
2. Click "Import Data"
3. Select CSV file
4. Map columns
5. Import

---

## File: `demo-guests.csv`

```csv
tour_id,first_name,last_name,email,phone,hotel,room_number,adults,children,checked_in,no_show,notes
TOUR-001,John,Smith,john.smith@email.com,+1-555-0101,Grand Velas Riviera Maya,205,2,0,true,false,"Anniversary trip, vegetarian meals"
TOUR-001,Sarah,Johnson,sarah.j@email.com,+1-555-0102,Grand Velas Riviera Maya,205,2,0,true,false,"Traveling with John"
TOUR-002,Michael,Brown,m.brown@email.com,+1-555-0103,Beloved Playa Mujeres,312,2,1,true,false,"Family with 8yo child, need car seat"
TOUR-002,Lisa,Brown,lisa.b@email.com,+1-555-0104,Beloved Playa Mujeres,312,2,1,true,false,"Traveling with Michael"
TOUR-002,Emma,Brown,emma.b@email.com,+1-555-0105,Beloved Playa Mujeres,312,0,1,true,false,"Child (8 years old)"
TOUR-003,David,Wilson,d.wilson@email.com,+1-555-0106,Secrets Maroma Beach,418,2,0,true,false,"Honeymoon package"
TOUR-003,Jennifer,Wilson,j.wilson@email.com,+1-555-0107,Secrets Maroma Beach,418,2,0,true,false,"Traveling with David"
TOUR-004,Robert,Garcia,r.garcia@email.com,+1-555-0108,Finest Playa Mujeres,521,4,0,true,false,"Group of 4 friends"
TOUR-004,Amanda,Martinez,a.martinez@email.com,+1-555-0109,Finest Playa Mujeres,522,4,0,true,false,"Group of 4 friends"
TOUR-004,Christopher,Lee,c.lee@email.com,+1-555-0110,Finest Playa Mujeres,523,4,0,true,false,"Group of 4 friends"
TOUR-004,Jessica,Lopez,j.lopez@email.com,+1-555-0111,Finest Playa Mujeres,523,4,0,true,false,"Group of 4 friends"
TOUR-005,William,Taylor,w.taylor@email.com,+1-555-0112,Hyatt Ziva Cap Cana,614,2,2,true,false,"Family with twins (5yo)"
TOUR-005,Elizabeth,Taylor,e.taylor@email.com,+1-555-0113,Hyatt Ziva Cap Cana,614,2,2,true,false,"Traveling with William"
TOUR-005,James,Taylor,james.t@email.com,+1-555-0114,Hyatt Ziva Cap Cana,614,0,1,true,false,"Child (5 years old)"
TOUR-005,Charlotte,Taylor,charlotte.t@email.com,+1-555-0115,Hyatt Ziva Cap Cana,614,0,1,true,false,"Child (5 years old)"
TOUR-006,Daniel,Anderson,d.anderson@email.com,+1-555-0116,Excellence Playa Mujeres,715,2,0,false,false,"Early morning pickup"
TOUR-006,Michelle,Anderson,m.anderson@email.com,+1-555-0117,Excellence Playa Mujeres,715,2,0,false,false,"Traveling with Daniel"
TOUR-007,Matthew,Thomas,m.thomas@email.com,+1-555-0118,TRS Coral Hotel,816,2,0,true,false,"VIP service"
TOUR-007,Ashley,Thomas,a.thomas@email.com,+1-555-0119,TRS Coral Hotel,816,2,0,true,false,"Traveling with Matthew"
TOUR-008,Joseph,Jackson,j.jackson@email.com,+1-555-0120,Hard Rock Hotel Cancun,917,1,0,true,false,"Solo traveler, photography enthusiast"
TOUR-009,Nancy,White,n.white@email.com,+1-555-0121,Iberostar Selection Cancun,1018,3,0,true,false,"Group of 3"
TOUR-009,Karen,Harris,k.harris@email.com,+1-555-0122,Iberostar Selection Cancun,1018,3,0,true,false,"Group of 3"
TOUR-009,Betty,Clark,b.clark@email.com,+1-555-0123,Iberostar Selection Cancun,1019,3,0,true,false,"Group of 3"
TOUR-010,Edward,Lewis,e.lewis@email.com,+1-555-0124,Live Aqua Beach Resort,1120,2,0,true,false,"Foodie tour"
TOUR-010,Sandra,Lewis,s.lewis@email.com,+1-555-0125,Live Aqua Beach Resort,1120,2,0,true,false,"Traveling with Edward"
```

---

## File: `demo-tours.csv`

```csv
name,description,tour_date,start_time,duration_minutes,capacity,pickup_location,dropoff_location,guide_id,vehicle_id,brand_id,template_id,price,status,guest_count,tour_type
"Tulum Ruins + Cenote Classic","Explore ancient Mayan ruins and swim in sacred cenote",2026-03-27,08:00,480,15,"Hotel Zone Pickup","Hotel Zone Dropoff",GUIDE-001,VEH-001,BRAND-001,TMPL-001,89.00,scheduled,12,private
"Coba Adventure + 4 Cenotes","Climb Nohoch Mul pyramid and visit 4 cenotes",2026-03-27,07:30,540,20,"Playa del Carmen","Playa del Carmen",GUIDE-002,VEH-002,BRAND-001,TMPL-002,109.00,scheduled,18,shared
"Chichen Itza Express","Full day at Wonder of the World",2026-03-27,06:00,720,30,"Cancun Hotel Zone","Cancun Hotel Zone",GUIDE-003,VEH-003,BRAND-002,TMPL-003,129.00,scheduled,25,shared
"Tulum Private VIP","Private luxury tour with personal guide",2026-03-27,09:00,360,8,"Grand Velas","Grand Velas",GUIDE-004,VEH-004,BRAND-003,TMPL-004,299.00,scheduled,2,private
"Cenote Route Adventure","Visit 3 hidden cenotes off the beaten path",2026-03-27,08:30,420,12,"Tulum Town","Tulum Town",GUIDE-005,VEH-005,BRAND-001,TMPL-005,79.00,scheduled,8,private
"Coba + Valladolid","Archaeology and colonial culture",2026-03-28,07:00,600,25,"Cancun","Cancun",GUIDE-001,VEH-001,BRAND-002,TMPL-006,99.00,scheduled,20,shared
"Tulum + Akumal Snorkeling","Ruins and sea turtles",2026-03-28,08:00,480,18,"Playa del Carmen","Playa del Carmen",GUIDE-002,VEH-002,BRAND-001,TMPL-007,95.00,scheduled,15,shared
"Chichen Itza + Cenote Ik Kil","Wonder of the World + sacred cenote",2026-03-28,06:30,660,35,"Riviera Maya","Riviera Maya",GUIDE-003,VEH-003,BRAND-002,TMPL-003,119.00,scheduled,30,shared
"Private Cenote Tour","Exclusive cenote experience",2026-03-28,09:00,360,6,"Any Hotel","Any Hotel",GUIDE-004,VEH-004,BRAND-003,TMPL-008,249.00,scheduled,4,private
"Sunset Tulum","Evening tour with sunset views",2026-03-28,14:00,300,15,"Tulum Hotels","Tulum Hotels",GUIDE-005,VEH-005,BRAND-001,TMPL-009,69.00,scheduled,10,private
```

---

## File: `demo-pickup-stops.csv`

```csv
tour_id,brand_id,sort_order,location_name,address,latitude,longitude,scheduled_time,guest_count,notes
TOUR-002,BRAND-001,1,"Grand Sunset Resort","Carretera Cancun-Tulum Km 240",20.6897,-87.0739,07:30,3,"Main lobby pickup"
TOUR-002,BRAND-001,2,"Vidanta Riviera Maya","Carretera Federal Cancun-Playa Km 293",20.6234,-87.0812,07:45,5,"Near main entrance"
TOUR-002,BRAND-001,3,"Playa del Carmen Center","5ta Avenida & Constituyentes",20.6296,-87.0739,08:00,6,"Corner of 5th Ave"
TOUR-002,BRAND-001,4,"Maroma Beach Resort","Carretera Cancun-Playa Km 51",20.7234,-86.9812,08:15,4,"Beach club entrance"
TOUR-003,BRAND-002,1,"Cancun Airport Meeting Point","Terminal 3, Exit B",21.0365,-86.8770,06:00,8,"Look for guide with sign"
TOUR-003,BRAND-002,2,"Hotel Zone - Zone 1","Blvd. Kukulcan Km 9",21.1333,-86.7667,06:30,10,"Near Kukulcan Plaza"
TOUR-003,BRAND-002,3,"Hotel Zone - Zone 2","Blvd. Kukulcan Km 12.5",21.1089,-86.7594,06:45,7,"In front of La Isla Mall"
```

---

## File: `demo-incidents.csv`

```csv
tour_id,reported_by,type,severity,description,status,photo_urls,guide_id,resolution_notes
TOUR-001,GUIDE-001,vehicle_breakdown,high,"Van wouldn't start this morning. Battery dead. Had to call for jump start from operations.",resolved,"[\"https://cloudinary.com/incident1.jpg\"]",GUIDE-001,"Operations provided jump start. Tour delayed 25 min but completed successfully."
TOUR-002,GUIDE-002,medical,medium,"Guest felt dizzy during hike to cenote. Possible dehydration. Gave water and rest.",resolved,"[\"https://cloudinary.com/incident2.jpg\"]",GUIDE-002,"Guest recovered after 30 min rest. Completed tour with no further issues."
TOUR-003,GUIDE-003,delay,low,"Traffic jam on highway 307. Construction zone. Running 20 min behind schedule.",resolved,[],GUIDE-003,"Alternative route found. Made up time. Tour on schedule by lunch."
TOUR-004,GUIDE-004,guest_complaint,medium,"Guest upset about cenote being closed due to maintenance. Had to substitute with different cenote.",resolved,[],GUIDE-004,"Explained situation. Guest understood. Alternative cenote was actually better. Guest happy."
TOUR-005,GUIDE-005,weather,high,"Sudden tropical storm. Had to take shelter in restaurant for 45 min. Lightning very close.",resolved,"[\"https://cloudinary.com/incident5a.jpg\",\"https://cloudinary.com/incident5b.jpg\"]",GUIDE-005,"Storm passed. Tour resumed. Completed all activities with modified schedule."
```

---

## File: `demo-guest-feedback.csv`

```csv
tour_id,guest_id,rating,review_title,review_text,review_date,responded,response_text
TOUR-001,GUEST-001,5,"Absolutely Amazing!","Best tour of our vacation! Guide was knowledgeable and cenote was breathtaking. Highly recommend!",2026-03-25,false,""
TOUR-001,GUEST-002,5,"Perfect Day","Everything was perfect. Small group, great guide, beautiful locations. Worth every penny!",2026-03-25,false,""
TOUR-002,GUEST-003,4,"Great Adventure","Loved climbing the pyramid! Cenotes were beautiful. Only issue was it was very hot.",2026-03-25,false,""
TOUR-002,GUEST-004,5,"Unforgettable Experience","This was the highlight of our trip! Coba was incredible and cenotes were refreshing. Guide was excellent!",2026-03-25,false,""
TOUR-003,GUEST-005,5,"Bucket List Item Checked!","Chichen Itza was on my bucket list. This tour exceeded expectations. Early start worth it!",2026-03-24,false,""
TOUR-003,GUEST-006,4,"Wonderful Tour","Chichen Itza amazing, cenote beautiful. Tour was long (12 hours) but worth it.",2026-03-24,false,""
```

---

## File: `demo-tour-expenses.csv`

```csv
tour_id,guide_id,company_id,category,description,amount,currency,receipt_url,has_receipt,status,notes
TOUR-001,GUIDE-001,COMPANY-001,fuel,"Van fuel for Tulum round trip",45.50,MXN,"https://cloudinary.com/receipt1.jpg",true,pending,"Regular gas"
TOUR-001,GUIDE-001,COMPANY-001,parking,"Tulum ruins parking fee",150.00,MXN,"https://cloudinary.com/receipt2.jpg",true,pending,"Official parking"
TOUR-001,GUIDE-001,meals,"Guide lunch",180.00,MXN,"https://cloudinary.com/receipt3.jpg",true,pending,"Local restaurant"
TOUR-002,GUIDE-002,COMPANY-001,fuel,"Van fuel for Coba trip",62.00,MXN,"https://cloudinary.com/receipt4.jpg",true,pending,"Longer route"
TOUR-002,GUIDE-002,COMPANY-001,tolls,"Highway tolls",85.00,MXN,"https://cloudinary.com/receipt5.jpg",true,pending,"Cuota highway"
TOUR-002,GUIDE-002,COMPANY-001,meals,"Guide lunch + drinks",200.00,MXN,"https://cloudinary.com/receipt6.jpg",true,pending,"Valladolid"
TOUR-003,GUIDE-003,COMPANY-001,fuel,"Van fuel Chichen Itza",78.00,MXN,"https://cloudinary.com/receipt7.jpg",true,pending,"Long distance"
TOUR-003,GUIDE-003,COMPANY-001,tolls,"Multiple tolls",140.00,MXN,"https://cloudinary.com/receipt8.jpg",true,pending,"Round trip tolls"
TOUR-004,GUIDE-004,COMPANY-001,supplies,"Bottled water for guests",95.00,MXN,"https://cloudinary.com/receipt9.jpg",true,pending,"24 bottles"
TOUR-004,GUIDE-004,COMPANY-001,meals,"VIP lunch at beach club",450.00,MXN,"https://cloudinary.com/receipt10.jpg",true,pending,"Guest lunch included"
TOUR-005,GUIDE-005,COMPANY-001,fuel,"Local cenote route fuel",35.00,MXN,"",false,pending,"Small local station, no receipt"
```

---

## Notes

### Guest Import
- Tour IDs should match existing tours or use format `TOUR-XXX`
- Email format: standard email
- Phone format: international format with country code
- Hotels: Use real hotel names in Riviera Maya/Cancun/Tulum

### Tour Import
- Dates: Use future dates for testing
- Times: 24-hour format (HH:MM)
- Status: scheduled, in_progress, completed, cancelled
- Tour type: private or shared

### Pickup Stops
- Sort order: 1, 2, 3... (sequence matters)
- Coordinates: Yucatan peninsula area (20.x, -87.x)
- Times: Staggered by 15-30 min per stop

### Incidents
- Severity: low, medium, high, critical
- Status: reported, in_progress, resolved, closed
- Photo URLs: Use Cloudinary URLs or leave empty

### Expenses
- Categories: fuel, meals, supplies, parking, tolls, other
- Currency: MXN or USD
- Status: pending, approved, rejected

---

## Testing Scenarios

### Scenario 1: Full Tour Lifecycle
1. Import `demo-tours.csv` → Create tours
2. Import `demo-guests.csv` → Assign guests
3. Import `demo-pickup-stops.csv` → Set up shared tours
4. Guide checks in → Uses `guide_checkins`
5. Guide completes tour → Fills end-of-tour report
6. Import `demo-tour-expenses.csv` → Submit expenses
7. Import `demo-guest-feedback.csv` → Collect reviews

### Scenario 2: Incident Management
1. Import `demo-incidents.csv` → Create incidents
2. Supervisor reviews → Adds comments
3. Mark as resolved → Update status
4. View in activity feed

### Scenario 3: Multi-Brand Operations
1. Create tours for different brands
2. Assign guides to specific brands
3. Filter by brand in supervisor dashboard
4. Test brand isolation

---

**Files Location:** `C:\Users\lifeo\OneDrive\Documents\GitHub\tour-ops-platform\demo-data\`

**Created:** 2026-03-26  
**Last Updated:** 2026-03-26
