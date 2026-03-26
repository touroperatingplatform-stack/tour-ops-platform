# Demo Data CSV Files

Use these files to populate demo data for client trials.

---

## 📋 FILE 1: TOURS CSV

**Purpose:** Create 10 demo tours with real guide assignments  
**Import:** Super Admin → Import Data (or use SQL below)

```csv
tour_id,name,description,tour_date,start_time,duration_minutes,capacity,pickup_location,dropoff_location,guide_email,vehicle_id,brand_id,template_id,price,status,guest_count,tour_type
UUID-TOUR-01,"Tulum Ruins + Cenote Classic","Explore ancient Mayan ruins and swim in sacred cenote",2026-03-27,08:00,480,15,"Hotel Zone Pickup","Hotel Zone Dropoff",guide2@lifeoperations.com,VEH-001,BRAND-001,TMPL-001,89.00,scheduled,12,private
UUID-TOUR-02,"Coba Adventure + 4 Cenotes","Climb Nohoch Mul pyramid and visit 4 cenotes",2026-03-27,07:30,540,20,"Playa del Carmen","Playa del Carmen",mariagar@lifeoperations.com,VEH-002,BRAND-001,TMPL-002,109.00,scheduled,18,shared
UUID-TOUR-03,"Chichen Itza Express","Full day at Wonder of the World",2026-03-27,06:00,720,30,"Cancun Hotel Zone","Cancun Hotel Zone",gude@lifeoperations.com,VEH-003,BRAND-002,TMPL-003,129.00,scheduled,25,shared
UUID-TOUR-04,"Tulum Private VIP","Private luxury tour with personal guide",2026-03-27,09:00,360,8,"Grand Velas","Grand Velas",carlos@tour-ops.com,VEH-004,BRAND-003,TMPL-004,299.00,scheduled,2,private
UUID-TOUR-05,"Cenote Route Adventure","Visit 3 hidden cenotes off the beaten path",2026-03-27,08:30,420,12,"Tulum Town","Tulum Town",maria@tour-ops.com,VEH-005,BRAND-001,TMPL-005,79.00,scheduled,8,private
UUID-TOUR-06,"Coba + Valladolid","Archaeology and colonial culture",2026-03-28,07:00,600,25,"Cancun","Cancun",juan@tour-ops.com,VEH-001,BRAND-002,TMPL-006,99.00,scheduled,20,shared
UUID-TOUR-07,"Tulum + Akumal Snorkeling","Ruins and sea turtles",2026-03-28,08:00,480,18,"Playa del Carmen","Playa del Carmen",guide2@lifeoperations.com,VEH-002,BRAND-001,TMPL-007,95.00,scheduled,15,shared
UUID-TOUR-08,"Chichen Itza + Cenote Ik Kil","Wonder of the World + sacred cenote",2026-03-28,06:30,660,35,"Riviera Maya","Riviera Maya",mariagar@lifeoperations.com,VEH-003,BRAND-002,TMPL-003,119.00,scheduled,30,shared
UUID-TOUR-09,"Private Cenote Tour","Exclusive cenote experience",2026-03-28,09:00,360,6,"Any Hotel","Any Hotel",gude@lifeoperations.com,VEH-004,BRAND-003,TMPL-008,249.00,scheduled,4,private
UUID-TOUR-10,"Sunset Tulum","Evening tour with sunset views",2026-03-28,14:00,300,15,"Tulum Hotels","Tulum Hotels",carlos@tour-ops.com,VEH-005,BRAND-001,TMPL-009,69.00,scheduled,10,private
```

**Before Import:**
1. Replace `UUID-TOUR-01` etc. with actual tour UUIDs from your database
2. Replace `VEH-001` etc. with actual vehicle UUIDs
3. Replace `BRAND-001` etc. with actual brand UUIDs
4. Replace `TMPL-001` etc. with actual template UUIDs (or leave empty)
5. Guide emails will be auto-converted to guide UUIDs during import

**OR use SQL:**
```sql
-- See EXPORT-DATA-UUIDS.sql to get real UUIDs
```

---

## 📋 FILE 2: GUESTS CSV

**Purpose:** Import guests for existing tours  
**Import:** Super Admin → Import Data → Upload CSV

```csv
tour_id,first_name,last_name,email,phone,hotel,room_number,adults,children,notes
UUID-TOUR-01,John,Smith,john.smith@email.com,+1-555-0101,Grand Velas Riviera Maya,205,2,0,"Anniversary trip, vegetarian meals"
UUID-TOUR-01,Sarah,Johnson,sarah.j@email.com,+1-555-0102,Grand Velas Riviera Maya,205,2,0,"Traveling with John"
UUID-TOUR-02,Michael,Brown,m.brown@email.com,+1-555-0103,Beloved Playa Mujeres,312,2,1,"Family with 8yo child, need car seat"
UUID-TOUR-02,Lisa,Brown,lisa.b@email.com,+1-555-0104,Beloved Playa Mujeres,312,2,1,"Traveling with Michael"
UUID-TOUR-02,Emma,Brown,emma.b@email.com,+1-555-0105,Beloved Playa Mujeres,312,0,1,"Child (8 years old)"
UUID-TOUR-03,David,Wilson,d.wilson@email.com,+1-555-0106,Secrets Maroma Beach,418,2,0,"Honeymoon package"
UUID-TOUR-03,Jennifer,Wilson,j.wilson@email.com,+1-555-0107,Secrets Maroma Beach,418,2,0,"Traveling with David"
UUID-TOUR-04,Robert,Garcia,r.garcia@email.com,+1-555-0108,Finest Playa Mujeres,521,4,0,"Group of 4 friends"
UUID-TOUR-04,Amanda,Martinez,a.martinez@email.com,+1-555-0109,Finest Playa Mujeres,522,4,0,"Group of 4 friends"
UUID-TOUR-04,Christopher,Lee,c.lee@email.com,+1-555-0110,Finest Playa Mujeres,523,4,0,"Group of 4 friends"
UUID-TOUR-04,Jessica,Lopez,j.lopez@email.com,+1-555-0111,Finest Playa Mujeres,523,4,0,"Group of 4 friends"
UUID-TOUR-05,William,Taylor,w.taylor@email.com,+1-555-0112,Hyatt Ziva Cap Cana,614,2,2,"Family with twins (5yo)"
UUID-TOUR-05,Elizabeth,Taylor,e.taylor@email.com,+1-555-0113,Hyatt Ziva Cap Cana,614,2,2,"Traveling with William"
UUID-TOUR-05,James,Taylor,james.t@email.com,+1-555-0114,Hyatt Ziva Cap Cana,614,0,1,"Child (5 years old)"
UUID-TOUR-05,Charlotte,Taylor,charlotte.t@email.com,+1-555-0115,Hyatt Ziva Cap Cana,614,0,1,"Child (5 years old)"
UUID-TOUR-06,Daniel,Anderson,d.anderson@email.com,+1-555-0116,Excellence Playa Mujeres,715,2,0,"Early morning pickup"
UUID-TOUR-06,Michelle,Anderson,m.anderson@email.com,+1-555-0117,Excellence Playa Mujeres,715,2,0,"Traveling with Daniel"
UUID-TOUR-07,Matthew,Thomas,m.thomas@email.com,+1-555-0118,TRS Coral Hotel,816,2,0,"VIP service"
UUID-TOUR-07,Ashley,Thomas,a.thomas@email.com,+1-555-0119,TRS Coral Hotel,816,2,0,"Traveling with Matthew"
UUID-TOUR-08,Joseph,Jackson,j.jackson@email.com,+1-555-0120,Hard Rock Hotel Cancun,917,1,0,"Solo traveler, photography enthusiast"
UUID-TOUR-09,Nancy,White,n.white@email.com,+1-555-0121,Iberostar Selection Cancun,1018,3,0,"Group of 3"
UUID-TOUR-09,Karen,Harris,k.harris@email.com,+1-555-0122,Iberostar Selection Cancun,1018,3,0,"Group of 3"
UUID-TOUR-09,Betty,Clark,b.clark@email.com,+1-555-0123,Iberostar Selection Cancun,1019,3,0,"Group of 3"
UUID-TOUR-10,Edward,Lewis,e.lewis@email.com,+1-555-0124,Live Aqua Beach Resort,1120,2,0,"Foodie tour"
UUID-TOUR-10,Sandra,Lewis,s.lewis@email.com,+1-555-0125,Live Aqua Beach Resort,1120,2,0,"Traveling with Edward"
```

**Before Import:**
1. Replace `UUID-TOUR-01` etc. with actual tour UUIDs
2. Make sure tours exist before importing guests

---

## 📋 FILE 3: PICKUP STOPS CSV

**Purpose:** Create multi-pickup stops for shared tours  
**Import:** Manual SQL or build UI later

```csv
tour_id,brand_id,sort_order,location_name,address,latitude,longitude,scheduled_time,guest_count,notes
UUID-TOUR-02,BRAND-001,1,"Grand Sunset Resort","Carretera Cancun-Tulum Km 240",20.6897,-87.0739,07:30,3,"Main lobby pickup"
UUID-TOUR-02,BRAND-001,2,"Vidanta Riviera Maya","Carretera Federal Cancun-Playa Km 293",20.6234,-87.0812,07:45,5,"Near main entrance"
UUID-TOUR-02,BRAND-001,3,"Playa del Carmen Center","5ta Avenida & Constituyentes",20.6296,-87.0739,08:00,6,"Corner of 5th Ave"
UUID-TOUR-02,BRAND-001,4,"Maroma Beach Resort","Carretera Cancun-Playa Km 51",20.7234,-86.9812,08:15,4,"Beach club entrance"
UUID-TOUR-03,BRAND-002,1,"Cancun Airport Meeting Point","Terminal 3, Exit B",21.0365,-86.8770,06:00,8,"Look for guide with sign"
UUID-TOUR-03,BRAND-002,2,"Hotel Zone - Zone 1","Blvd. Kukulcan Km 9",21.1333,-86.7667,06:30,10,"Near Kukulcan Plaza"
UUID-TOUR-03,BRAND-002,3,"Hotel Zone - Zone 2","Blvd. Kukulcan Km 12.5",21.1089,-86.7594,06:45,7,"In front of La Isla Mall"
```

---

## 📋 FILE 4: INCIDENTS CSV

**Purpose:** Demo incident reports  
**Import:** Manual SQL or build UI later

```csv
tour_id,reported_by_email,type,severity,description,status,guide_email,resolution_notes
UUID-TOUR-01,guide2@lifeoperations.com,vehicle_breakdown,high,"Van wouldn't start this morning. Battery dead. Had to call for jump start from operations.",resolved,guide2@lifeoperations.com,"Operations provided jump start. Tour delayed 25 min but completed successfully."
UUID-TOUR-02,mariagar@lifeoperations.com,medical,medium,"Guest felt dizzy during hike to cenote. Possible dehydration. Gave water and rest.",resolved,mariagar@lifeoperations.com,"Guest recovered after 30 min rest. Completed tour with no further issues."
UUID-TOUR-03,gude@lifeoperations.com,delay,low,"Traffic jam on highway 307. Construction zone. Running 20 min behind schedule.",resolved,gude@lifeoperations.com,"Alternative route found. Made up time. Tour on schedule by lunch."
UUID-TOUR-04,carlos@tour-ops.com,guest_complaint,medium,"Guest upset about cenote being closed due to maintenance. Had to substitute with different cenote.",resolved,carlos@tour-ops.com,"Explained situation. Guest understood. Alternative cenote was actually better. Guest happy."
UUID-TOUR-05,maria@tour-ops.com,weather,high,"Sudden tropical storm. Had to take shelter in restaurant for 45 min. Lightning very close.",resolved,maria@tour-ops.com,"Storm passed. Tour resumed. Completed all activities with modified schedule."
```

---

## 📋 FILE 5: EXPENSES CSV

**Purpose:** Demo expense reports  
**Import:** Manual SQL or build UI later

```csv
tour_id,guide_email,company_id,category,description,amount,currency,receipt_url,has_receipt,status,notes
UUID-TOUR-01,guide2@lifeoperations.com,COMPANY-001,fuel,"Van fuel for Tulum round trip",45.50,MXN,https://cloudinary.com/receipt1.jpg,true,pending,"Regular gas"
UUID-TOUR-01,guide2@lifeoperations.com,COMPANY-001,parking,"Tulum ruins parking fee",150.00,MXN,https://cloudinary.com/receipt2.jpg,true,pending,"Official parking"
UUID-TOUR-01,guide2@lifeoperations.com,COMPANY-001,meals,"Guide lunch",180.00,MXN,https://cloudinary.com/receipt3.jpg,true,pending,"Local restaurant"
UUID-TOUR-02,mariagar@lifeoperations.com,COMPANY-001,fuel,"Van fuel for Coba trip",62.00,MXN,https://cloudinary.com/receipt4.jpg,true,pending,"Longer route"
UUID-TOUR-02,mariagar@lifeoperations.com,COMPANY-001,tolls,"Highway tolls",85.00,MXN,https://cloudinary.com/receipt5.jpg,true,pending,"Cuota highway"
UUID-TOUR-02,mariagar@lifeoperations.com,COMPANY-001,meals,"Guide lunch + drinks",200.00,MXN,https://cloudinary.com/receipt6.jpg,true,pending,"Valladolid"
UUID-TOUR-03,gude@lifeoperations.com,COMPANY-001,fuel,"Van fuel Chichen Itza",78.00,MXN,https://cloudinary.com/receipt7.jpg,true,pending,"Long distance"
UUID-TOUR-03,gude@lifeoperations.com,COMPANY-001,tolls,"Multiple tolls",140.00,MXN,https://cloudinary.com/receipt8.jpg,true,pending,"Round trip tolls"
UUID-TOUR-04,carlos@tour-ops.com,COMPANY-001,supplies,"Bottled water for guests",95.00,MXN,https://cloudinary.com/receipt9.jpg,true,pending,"24 bottles"
UUID-TOUR-04,carlos@tour-ops.com,COMPANY-001,meals,"VIP lunch at beach club",450.00,MXN,https://cloudinary.com/receipt10.jpg,true,pending,"Guest lunch included"
UUID-TOUR-05,maria@tour-ops.com,COMPANY-001,fuel,"Local cenote route fuel",35.00,MXN,,false,pending,"Small local station, no receipt"
```

---

## 🔄 IMPORT WORKFLOW

### Step 1: Update User Roles
Run `UPDATE-USER-ROLES.sql` in Supabase SQL Editor

### Step 2: Get Real UUIDs
Run `EXPORT-DATA-UUIDS.sql` to get actual UUIDs from your database

### Step 3: Replace Placeholders
Replace all `UUID-*` placeholders in CSV files with real UUIDs

### Step 4: Import in Order
1. Tours (if creating new ones)
2. Guests (via Super Admin → Import Data)
3. Pickup stops (manual SQL for now)
4. Incidents (manual SQL for now)
5. Expenses (manual SQL for now)

### Step 5: Test
- Login as different roles
- Verify data appears correctly
- Test workflows (check-in, expenses, etc.)

---

## 🗑️ CLEAR DEMO DATA

Between trials, use Super Admin → Demo Management → "Clear All Demo Data"

This removes:
- Guests
- Guide check-ins
- Pickup stops
- Incidents
- Tour expenses
- Checklist completions
- Guest feedback

**Preserves:**
- Users/auth
- Tours
- Vehicles
- Brands
- Companies

---

**File Location:** `docs/DEMO-DATA-README.md`  
**Last Updated:** 2026-03-26
