# Cloudinary Setup Guide

## ✅ Your Credentials

- **Cloud Name:** `dorhbpsxy`
- **API Key:** `933486393815468`
- **API Secret:** (from your dashboard - keep secure)

---

## 📚 **Step 1: Create Upload Preset**

### **In Cloudinary Dashboard:**

1. Go to: **Settings** → **Upload**
2. Scroll to **"Upload presets"** section
3. Click **"Add upload preset"**
4. Fill in:
   - **Preset name:** `tour-ops-unsigned`
   - **Signing mode:** **Unsigned** (important!)
   - **Folder:** `tour-ops` (optional)
   - **Unique filename:** **Enabled** (prevents overwrites)
5. Click **"Save"**

**Why unsigned?** No API secret needed in client code - safer for frontend uploads.

---

## 📚 **Step 2: Add API Secret to .env.local**

### **Create `.env.local` file:**

```bash
# In project root:
C:\Users\lifeo\OneDrive\Documents\GitHub\tour-ops-platform\.env.local
```

**Contents:**
```env
CLOUDINARY_CLOUD_NAME=dorhbpsxy
CLOUDINARY_API_KEY=933486393815468
CLOUDINARY_API_SECRET=your-actual-secret-here
CLOUDINARY_UPLOAD_PRESET=tour-ops-unsigned
```

**⚠️ Never commit `.env.local` to git!**

---

## 📚 **Step 3: Test Upload**

### **Manual Test:**

1. Go to Cloudinary dashboard → **Media**
2. Click **"Upload"**
3. Drag any image
4. Verify it appears in `tour-ops` folder
5. Copy the URL (e.g., `https://res.cloudinary.com/dorhbpsxy/image/upload/...`)

---

## 📚 **Step 4: Integration Ready**

**Files created:**
- `lib/cloudinary/upload.ts` - Upload utility
- `.env.example` - Template for env vars
- `CLOUDINARY-SETUP.md` - This guide

**Next:** I'll update the incident form with photo upload field.

---

## 🎯 **Upload Flow:**

1. Guide selects photo in incident form
2. Uploads to Cloudinary (unsigned preset)
3. Gets URL back
4. Saves URL in incident record

**Folder structure:**
```
tour-ops/
├── incidents/
│   ├── 2026-03-24-medical-abc123.jpg
│   └── 2026-03-24-vehicle-def456.jpg
└── expenses/
    └── receipts/
        └── 2026-03-24-fuel-ghi789.jpg
```

---

## ✅ **Checklist:**

- [ ] Create upload preset: `tour-ops-unsigned`
- [ ] Set signing mode: **Unsigned**
- [ ] Add API secret to `.env.local`
- [ ] Test manual upload in dashboard
- [ ] Confirm preset name matches code

**Let me know when preset is created.** 🧙
