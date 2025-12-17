# 🧪 Vendor Product Upload - Testing Guide

## 🎯 What This Tests

This will verify the **complete full-stack flow**:
1. **Vendor logs in** → Mobile app
2. **Vendor uploads product** → Mobile app sends to backend API
3. **Backend saves product** → PostgreSQL database
4. **Product appears in shop** → Homeowner can see and purchase

---

## 🚀 Step-by-Step Testing

### Step 1: Start the Backend

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/backend

# Make sure PostgreSQL is running
brew services list | grep postgresql
# If not running: brew services start postgresql@15

# Run migrations (if not done)
pnpm prisma:migrate dev

# Seed database (creates vendor user)
pnpm prisma:seed

# Start backend
pnpm dev
```

✅ You should see: `🚀 Backend API running on: http://localhost:3001/api`

### Step 2: Start Mobile App

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/mobile-homeowner
pnpm start
```

Press **'i'** for iOS or **'a'** for Android

---

## 🧑‍💼 Test as Vendor

### Step 3: Login as Vendor

In the mobile app:
1. **Logout** if already logged in (Profile → Logout)
2. **Login** with vendor credentials:
   - **Email:** `vendor1@buildmyhouse.com`
   - **Password:** `password123`

### Step 4: Access Vendor Dashboard

1. Go to **Profile tab** (bottom navigation)
2. You should see a **green "Vendor Dashboard" button** at the top
3. **Tap it** to open your vendor dashboard

### Step 5: Add a Product

1. In the vendor dashboard, tap **"Add New Product"** (green button)
2. **Fill in the form:**
   - **Product Image:** Tap "Gallery" or "Camera" and select/take a photo
   - **Product Name:** e.g., "Super Strong Cement"
   - **Brand:** e.g., "Your Brand Name"
   - **Category:** Select "Cement" (or any category)
   - **Price:** e.g., "5500"
   - **Unit:** Select "bag (50kg)"
   - **Stock:** e.g., "1000"
   - **Description:** e.g., "High quality cement for all construction needs"

3. **Tap "Add Product"** (green button at bottom)

✅ You should see: **"Success! 🎉 Your product has been added and is now visible in the shop!"**

---

## 👀 Verify Product Appears in Shop

### Step 6: Switch to Homeowner View

**Option A - Use Another Device/Simulator:**
- Login as homeowner on different device
- Email: `homeowner@test.com`
- Password: `password123`

**Option B - Same Device:**
1. Go back to dashboard
2. Your product should appear in "Products" tab
3. To see it in the shop, logout and login as homeowner

### Step 7: Check Shop Tab

1. Go to **Shop tab** (bottom navigation)
2. Make sure **"Materials"** section is selected
3. **Scroll through the list**
4. **You should see your newly added product!** 🎉

### Step 8: Verify Product Details

1. **Tap on your product** in the shop
2. You should see:
   - Your uploaded image
   - Product name and brand
   - Category and unit
   - Stock quantity
   - Description
   - Price

---

## ✅ What This Proves

When you successfully complete this flow, it proves:

✅ **Mobile app connects to backend API**  
✅ **Authentication works** (vendor login)  
✅ **Authorization works** (only vendors can add products)  
✅ **Image upload works** (camera/gallery integration)  
✅ **Backend validates and saves data**  
✅ **Database stores products correctly**  
✅ **Products appear in real-time** (with React Query cache invalidation)  
✅ **Homeowners can browse vendor products**  
✅ **Full-stack integration is working!** 🚀

---

## 🎨 Expected Behavior

### Vendor Dashboard
- Shows count of your products
- Lists all your materials
- Each product shows: name, brand, category, price, stock
- Delete button for each product
- "Add New Product" button

### Add Product Screen
- Dark blue theme (vendor branding)
- Image picker with gallery/camera options
- All required fields marked with *
- Dropdowns for category and unit
- Submit button shows loading state
- Success message on completion

### Shop (Homeowner View)
- Your product appears in materials list
- Sorted by creation date (newest first)
- Shows all the details you entered
- Homeowner can tap for full details
- Homeowner can add to cart

---

## 🧪 Advanced Testing

### Test 1: Add Multiple Products
1. Add 3 different products with different categories
2. Verify all appear in vendor dashboard
3. Logout and login as homeowner
4. Check all 3 appear in shop

### Test 2: Delete Product
1. Login as vendor
2. Go to vendor dashboard
3. Tap "Delete" on a product
4. Confirm deletion
5. Verify it's removed from dashboard
6. Logout and login as homeowner
7. Verify it's removed from shop

### Test 3: Different Categories
1. Add product in "Cement" category
2. Add product in "Steel" category
3. Add product in "Paint" category
4. Verify all appear with correct categories

### Test 4: Stock Levels
1. Add product with stock > 100 (should show green)
2. Add product with stock 50 (should show yellow)
3. Add product with stock 5 (should show red)
4. Verify color coding works

---

## 🐛 Troubleshooting

### "Failed to create product"
**Check:**
- Backend is running on port 3001
- You're logged in as vendor
- All required fields are filled
- Price is a valid number

### "Image not showing"
**Try:**
- Use a different image
- Check image size (should be < 10MB)
- Use gallery instead of camera
- Use default (leave image blank for now)

### Product doesn't appear in shop
**Check:**
- Refresh shop page (pull down to refresh)
- Check network connection
- Verify backend health: `curl http://localhost:3001/api/health`
- Check backend logs for errors

### "Permission denied" errors
**Grant permissions:**
- Settings → BuildMyHouse → Photos → Allow
- Settings → BuildMyHouse → Camera → Allow

---

## 📊 Test Data Reference

### Existing Vendors (from seed)
```
Vendor 1:
  Email: vendor1@buildmyhouse.com
  Password: password123
  Company: Dangote Cement Nigeria

Vendor 2:
  Email: vendor2@buildmyhouse.com
  Password: password123
  Company: BUA Steel Company

Vendor 3:
  Email: vendor3@buildmyhouse.com
  Password: password123
  Company: BuildCo Supplies
```

### Sample Product Data

```
Product 1:
  Name: Premium Portland Cement
  Brand: Dangote
  Category: cement
  Price: 4500
  Unit: bag (50kg)
  Stock: 500
  Description: High-quality Portland cement suitable for all construction needs

Product 2:
  Name: High Tensile Rebar 12mm
  Brand: BUA Steel
  Category: steel
  Price: 850
  Unit: per meter
  Stock: 2000
  Description: Grade 500 high tensile steel reinforcement bars
```

---

## 🎯 Success Criteria

Your full-stack app is working when:

✅ Vendor can login  
✅ Vendor dashboard loads  
✅ Vendor can add product with image  
✅ Product saves to database  
✅ Product appears in vendor's product list  
✅ Product appears in homeowner's shop  
✅ Homeowner can view product details  
✅ All data matches what vendor entered  
✅ Vendor can delete products  
✅ Changes reflect immediately (real-time)  

---

## 🎊 When This Works...

**You'll have proven:**
- ✅ Complete authentication system
- ✅ Role-based access (vendor vs homeowner)
- ✅ API integration (mobile ↔ backend)
- ✅ Database persistence
- ✅ Image handling
- ✅ Real-time data sync
- ✅ Production-ready full-stack app

**This is a HUGE milestone!** 🚀

---

## 📸 Screenshots to Take

When testing, screenshot:
1. Vendor dashboard showing your products
2. Add product form filled out
3. Success message after adding
4. Shop showing your product
5. Product detail page

These prove the app works end-to-end!

---

## 🚀 Next Steps After Testing

Once this works:
1. **Add more products** to build a real catalog
2. **Test with multiple vendors** 
3. **Move to Phase 4: Payments** (so homeowners can actually purchase)
4. **Add product editing** (update product details)
5. **Add product analytics** (views, purchases)

---

**Ready to test?** Follow the steps above and let me know what happens! 🎯
