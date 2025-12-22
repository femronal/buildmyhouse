# 🚀 Quick Start: Google Maps

## What You Have Now

✅ **Full Google Maps integration** - Interactive maps, address search, geocoding  
✅ **Database ready** - All address fields added and migrated  
✅ **Backend ready** - API accepts and stores address details  
✅ **Frontend ready** - Location screen with maps (waiting for API key)  

---

## ⚡ 3 Steps to Get It Working

### Step 1: Get Your Google Maps API Key (5 minutes)

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Click **"Enable APIs & Services"**
4. Enable these 4 APIs:
   - Maps SDK for Android  
   - Maps SDK for iOS
   - Places API
   - Geocoding API
5. Go to **"Credentials"** → **"Create Credentials"** → **"API Key"**
6. Copy your API key

**Detailed guide:** See `GOOGLE_MAPS_SETUP.md`

---

### Step 2: Add API Key to Your App (1 minute)

**File 1:** `apps/mobile-homeowner/config/maps.ts`

```typescript
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'PASTE_YOUR_KEY_HERE', // 👈 Replace this
  // ... rest stays the same
};
```

**File 2:** `apps/mobile-homeowner/app.json`

Find these sections and replace the placeholder:

```json
"ios": {
  "config": {
    "googleMapsApiKey": "PASTE_YOUR_KEY_HERE"  // 👈 Replace this
  }
},
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "PASTE_YOUR_KEY_HERE"  // 👈 Replace this
    }
  }
}
```

---

### Step 3: Restart Your App (1 minute)

```bash
# Stop the Expo server (Ctrl+C in terminal)

# Restart
cd apps/mobile-homeowner
pnpm start

# Press 'r' to reload the app
# OR restart completely
```

---

## ✅ Test It

1. Open the mobile app
2. Navigate to the **location selection screen**
3. Try these:
   - Type an address in the search bar
   - Tap anywhere on the map
4. You should see:
   - Map loads (not gray/blank)
   - Address appears when you tap
   - Search suggestions appear as you type

---

## 🎯 What's Next?

After Google Maps is working, here's what you can build:

### Immediate (Already works):
- ✅ Select location → Create project → Address stored in DB

### Easy to add next:
- Show project location on a map in project detail screen
- "Open in Google Maps" navigation button
- Display vendor delivery zones on a map

### Future features:
- Track material deliveries in real-time
- Show contractor route to job site
- Find nearby contractors based on project location
- Geofencing alerts when contractor arrives

---

## 🆘 Troubleshooting

### Map shows blank/gray tiles
**Problem:** API key not configured or invalid  
**Solution:** Double-check you pasted the key in both files, then rebuild app

### Search doesn't work
**Problem:** Places API not enabled  
**Solution:** Go back to Google Cloud Console → Enable "Places API"

### "This API project is not authorized"
**Problem:** You didn't enable all required APIs  
**Solution:** Enable all 4 APIs listed in Step 1

### App crashes on location screen
**Problem:** Need to rebuild after adding API key  
**Solution:** Stop Expo completely, restart, and reload app

---

## 📊 Cost

Google Maps is **FREE** for small apps:
- $200 free credit every month
- Covers ~28,000 map loads
- ~40,000 geocoding requests
- ~100,000 autocomplete sessions

You won't pay anything until you exceed this (which you won't for a while).

---

## 📝 Summary

1. **Get API key** from Google Cloud Console (5 min)
2. **Paste it** in `config/maps.ts` and `app.json` (1 min)
3. **Restart app** and test (1 min)

**Total time: ~10 minutes**

---

## 📚 Full Documentation

- **Setup Guide**: `GOOGLE_MAPS_SETUP.md`
- **Address Usage**: `ADDRESS_USAGE_GUIDE.md`
- **Implementation**: `GOOGLE_MAPS_IMPLEMENTATION.md`

---

**Questions? Just ask!** 🗺️
