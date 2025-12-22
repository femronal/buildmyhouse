# Google Maps Integration Setup Guide

This guide will help you configure Google Maps for the BuildMyHouse mobile application.

## 📍 Overview

The app uses Google Maps for:
- **Interactive address selection** (tap on map or search)
- **Address autocomplete** (Google Places API)
- **Geocoding** (convert addresses to coordinates)
- **Reverse geocoding** (convert coordinates to addresses)
- **Delivery tracking** (for materials and contractor services)

## 🔑 Step 1: Get Google Maps API Key

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give it a name (e.g., "BuildMyHouse-Maps")

### 1.2 Enable Required APIs

Enable the following APIs for your project:

1. **Maps SDK for Android**
   - Navigate to: APIs & Services → Library
   - Search for "Maps SDK for Android"
   - Click **Enable**

2. **Maps SDK for iOS**
   - Search for "Maps SDK for iOS"
   - Click **Enable**

3. **Places API**
   - Search for "Places API"
   - Click **Enable**

4. **Geocoding API**
   - Search for "Geocoding API"
   - Click **Enable**

### 1.3 Create API Credentials

1. Go to: APIs & Services → Credentials
2. Click **"Create Credentials"** → **"API Key"**
3. Your API key will be generated
4. **IMPORTANT**: Click **"Restrict Key"** to secure it

### 1.4 Restrict Your API Key (Security)

**For Development:**
- Application restrictions: **None** (for testing only!)
- API restrictions: Select the 4 APIs enabled above

**For Production:**
- **Android**: Restrict by Android app package name + SHA-1 certificate
- **iOS**: Restrict by iOS bundle identifier
- API restrictions: Same 4 APIs

## 🔧 Step 2: Configure the Mobile App

### 2.1 Update `app.json`

Open `apps/mobile-homeowner/app.json` and replace the placeholder keys:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_ACTUAL_IOS_API_KEY_HERE"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ACTUAL_ANDROID_API_KEY_HERE"
        }
      }
    }
  }
}
```

### 2.2 Update Configuration File

Open `apps/mobile-homeowner/config/maps.ts` and update:

```typescript
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace this
  // ... rest of config
};
```

**For Production**: Use environment variables instead:

```typescript
apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'fallback-key',
```

Then create a `.env.local` file:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key_here
```

## 🧪 Step 3: Test the Integration

### 3.1 Rebuild the App

After adding the API key, rebuild the app:

```bash
# Kill the existing Expo server
# Then restart
cd apps/mobile-homeowner
pnpm start

# On iOS
press 'i'

# On Android
press 'a'
```

### 3.2 Test Address Selection

1. Open the app
2. Navigate to the location selection screen
3. **Test Search**: Type an address in the search bar
4. **Test Map Tap**: Tap directly on the map
5. **Verify**: Confirm the address details are captured

### 3.3 Verify Database Storage

After selecting an address, check that it's stored:

```bash
# Connect to your database
psql -U mac -d buildmyhouse

# Query a project
SELECT name, address, street, city, state, "zipCode", latitude, longitude 
FROM projects 
LIMIT 1;
```

You should see all address fields populated.

## 📦 How Addresses Are Used

### In Projects
When a homeowner selects a building location, the address is stored with:
- Full formatted address
- Street, city, state, ZIP, country
- Latitude & longitude coordinates

### In Orders (Materials/Contractors)
When orders are created for a project:
- **Delivery address** is automatically populated from the project address
- Vendors can see the exact delivery location
- Contractors know where to work

### Example Order with Address

```json
{
  "orderId": "123",
  "projectId": "abc",
  "deliveryAddress": "123 Main St, San Francisco, CA 94102, USA",
  "deliveryLat": 37.7749,
  "deliveryLng": -122.4194
}
```

## 🚨 Common Issues

### Issue: Map shows blank/gray tiles
**Solution**: Your API key is invalid or the Maps SDK is not enabled

### Issue: Search doesn't work
**Solution**: Enable the "Places API" in Google Cloud Console

### Issue: "This API project is not authorized to use this API"
**Solution**: Check that you enabled all 4 required APIs

### Issue: App crashes on map screen
**Solution**: 
1. Make sure you've added the API key to `app.json`
2. Rebuild the app completely (stop Expo, clear cache, restart)

## 💰 Pricing & Limits

Google Maps offers **$200 free credit** per month, which covers:
- ~28,000 map loads
- ~40,000 geocoding requests
- ~100,000 autocomplete sessions

For a small-scale app, this should be sufficient. Monitor usage at:
[Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/)

## 🔒 Security Best Practices

1. **Never commit API keys** to Git (they're in `.gitignore`)
2. **Restrict keys** by platform (iOS bundle ID, Android package name)
3. **Restrict APIs** to only what you need
4. **Monitor usage** to detect abuse
5. **Rotate keys** if they're ever exposed

## 📚 Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Google Places Autocomplete](https://github.com/FaridSafi/react-native-google-places-autocomplete)

## ✅ Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled 4 required APIs (Maps Android, Maps iOS, Places, Geocoding)
- [ ] Created and restricted API key
- [ ] Updated `app.json` with API key
- [ ] Updated `config/maps.ts` with API key
- [ ] Rebuilt the mobile app
- [ ] Tested address search
- [ ] Tested map tap selection
- [ ] Verified address storage in database
- [ ] Set up billing alerts (optional but recommended)

---

**Need help?** Check the [Google Maps Platform Support](https://developers.google.com/maps/support) or open an issue in the repository.
