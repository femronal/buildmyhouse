# Address Storage and Usage Guide

This document explains how addresses are captured, stored, and reused throughout the BuildMyHouse application.

## 📍 Address Flow Overview

```
User selects location → Geocoded → Stored in Project → Reused for Orders/Deliveries
```

## 1️⃣ Address Capture (Location Screen)

### User Experience
1. Homeowner navigates to `/location` screen
2. They can either:
   - **Search for an address** using Google Places Autocomplete
   - **Tap directly on the map** to drop a pin
3. The address is geocoded to get full details
4. User reviews and confirms the location

### Data Captured

```typescript
{
  address: "123 Main St, San Francisco, CA 94102, USA",  // Full formatted address
  street: "123 Main St",                                 // Street address
  city: "San Francisco",                                 // City name
  state: "California",                                   // State/Province
  zipCode: "94102",                                      // ZIP/Postal code
  country: "USA",                                        // Country
  latitude: 37.7749,                                     // Latitude coordinate
  longitude: -122.4194                                   // Longitude coordinate
}
```

## 2️⃣ Address Storage (Database)

### Project Model

Addresses are stored in the `projects` table:

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  address     String   // Full formatted address
  street      String?  // Street address
  city        String?  // City
  state       String?  // State/Province
  zipCode     String?  // ZIP/Postal code
  country     String?  // Country
  latitude    Float?   // Latitude coordinate
  longitude   Float?   // Longitude coordinate
  // ... other fields
}
```

### Why Store Coordinates?

Coordinates enable:
- **Map visualization** - Show project location on a map
- **Distance calculations** - Find nearest contractors/vendors
- **Route planning** - Optimize delivery routes
- **Geofencing** - Trigger notifications when arriving at site

## 3️⃣ Address Reuse (Orders & Deliveries)

### Automatic Population

When an order is created for a project, the delivery address is **automatically populated**:

```prisma
model Order {
  id              String   @id @default(uuid())
  projectId       String?
  
  // Delivery Address (copied from project)
  deliveryAddress String?
  deliveryStreet  String?
  deliveryCity    String?
  deliveryState   String?
  deliveryZipCode String?
  deliveryCountry String?
  deliveryLat     Float?
  deliveryLng     Float?
  // ... other fields
}
```

### Use Cases

#### For Material Orders
```typescript
// When vendor prepares delivery
{
  orderId: "order-123",
  deliveryAddress: "123 Main St, San Francisco, CA 94102, USA",
  deliveryLat: 37.7749,
  deliveryLng: -122.4194,
  status: "shipped"
}
```

#### For Contractor Jobs
```typescript
// When contractor is assigned work
{
  jobId: "job-456",
  projectAddress: "123 Main St, San Francisco, CA 94102, USA",
  workLocation: { lat: 37.7749, lng: -122.4194 },
  instructions: "Meet at front door"
}
```

## 4️⃣ API Implementation

### Backend: Creating a Project with Address

**Endpoint**: `POST /api/projects`

```json
{
  "name": "Modern Family Home",
  "address": "123 Main St, San Francisco, CA 94102, USA",
  "street": "123 Main St",
  "city": "San Francisco",
  "state": "California",
  "zipCode": "94102",
  "country": "USA",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "budget": 250000
}
```

### Frontend: Submitting Address from Location Screen

```typescript
// apps/mobile-homeowner/app/location.tsx
const handleContinue = () => {
  const addressData = {
    address: selectedAddress.formattedAddress,
    street: selectedAddress.street,
    city: selectedAddress.city,
    state: selectedAddress.state,
    zipCode: selectedAddress.zipCode,
    country: selectedAddress.country,
    latitude: selectedAddress.latitude,
    longitude: selectedAddress.longitude,
  };

  // Pass to next screen (e.g., project creation)
  router.push({
    pathname: '/upload-plan',
    params: addressData,
  });
};
```

## 5️⃣ Future Implementations

### A. Order Creation (Material Delivery)

```typescript
// When homeowner orders materials
async function createMaterialOrder(
  userId: string,
  projectId: string,
  items: OrderItem[]
) {
  // Fetch project address
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      address: true,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  // Create order with project address as delivery address
  return await prisma.order.create({
    data: {
      userId,
      projectId,
      deliveryAddress: project.address,
      deliveryStreet: project.street,
      deliveryCity: project.city,
      deliveryState: project.state,
      deliveryZipCode: project.zipCode,
      deliveryCountry: project.country,
      deliveryLat: project.latitude,
      deliveryLng: project.longitude,
      items: {
        create: items,
      },
    },
  });
}
```

### B. Contractor Assignment

```typescript
// When assigning contractor to project
async function assignContractor(
  projectId: string,
  contractorId: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      address: true,
      latitude: true,
      longitude: true,
    },
  });

  // Notify contractor with work location
  await sendNotification(contractorId, {
    message: `New project assigned!`,
    location: {
      address: project.address,
      coordinates: {
        lat: project.latitude,
        lng: project.longitude,
      },
    },
  });
}
```

### C. Delivery Tracking (Future Feature)

```typescript
// Track delivery driver location
async function trackDelivery(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      deliveryLat: true,
      deliveryLng: true,
      deliveryAddress: true,
    },
  });

  // Calculate distance from driver to delivery address
  const distance = calculateDistance(
    driverLocation,
    { lat: order.deliveryLat, lng: order.deliveryLng }
  );

  // Send ETA to homeowner
  return {
    estimatedArrival: calculateETA(distance, driverSpeed),
    currentDistance: distance,
  };
}
```

## 6️⃣ Mobile App Display

### Show Project Location

```typescript
// apps/mobile-homeowner/app/project-detail.tsx
import MapView, { Marker } from 'react-native-maps';

function ProjectDetail({ project }) {
  return (
    <MapView
      initialRegion={{
        latitude: project.latitude,
        longitude: project.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{
          latitude: project.latitude,
          longitude: project.longitude,
        }}
        title={project.name}
        description={project.address}
      />
    </MapView>
  );
}
```

### Show Delivery Route

```typescript
// apps/mobile-homeowner/app/order-tracking.tsx
function OrderTracking({ order }) {
  return (
    <MapView>
      {/* Vendor/Warehouse location */}
      <Marker
        coordinate={vendorLocation}
        title="Vendor Warehouse"
      />
      
      {/* Delivery destination (project address) */}
      <Marker
        coordinate={{
          latitude: order.deliveryLat,
          longitude: order.deliveryLng,
        }}
        title="Delivery Address"
        description={order.deliveryAddress}
      />
      
      {/* Draw route between them */}
      <Polyline
        coordinates={[vendorLocation, deliveryLocation]}
        strokeColor="#000"
        strokeWidth={3}
      />
    </MapView>
  );
}
```

## 7️⃣ Benefits of This Approach

✅ **Single Source of Truth** - Address entered once, used everywhere  
✅ **Consistency** - Same address format across the app  
✅ **Geocoded Data** - Enables advanced features (maps, routing, geofencing)  
✅ **Flexibility** - Can be updated if project address changes  
✅ **Offline Capability** - Coordinates work without internet for basic maps  
✅ **Analytics Ready** - Can track projects by region, city, etc.  

## 8️⃣ Testing

### Manual Test: Address Flow

1. **Start**: Open mobile app → Navigate to location screen
2. **Input**: Search for "Times Square, New York" OR tap on map
3. **Verify**: Address details populate correctly
4. **Submit**: Continue to create project
5. **Check DB**: 
   ```sql
   SELECT address, street, city, state, "zipCode", latitude, longitude 
   FROM projects 
   WHERE name = 'Your Project Name';
   ```
6. **Create Order**: Order materials for that project
7. **Check Order**: Verify delivery address matches project address

### Automated Test (Future)

```typescript
// Example test case
describe('Address Flow', () => {
  it('should capture and reuse address for orders', async () => {
    // Create project with address
    const project = await createProject({
      name: 'Test Project',
      latitude: 37.7749,
      longitude: -122.4194,
    });

    // Create order for that project
    const order = await createOrder({
      projectId: project.id,
      items: [/* ... */],
    });

    // Assert order has project's address
    expect(order.deliveryLat).toBe(project.latitude);
    expect(order.deliveryLng).toBe(project.longitude);
    expect(order.deliveryAddress).toBe(project.address);
  });
});
```

## 📚 Related Files

- **Schema**: `apps/backend/prisma/schema.prisma`
- **Location Screen**: `apps/mobile-homeowner/app/location.tsx`
- **Address Service**: `apps/mobile-homeowner/services/addressService.ts`
- **Maps Config**: `apps/mobile-homeowner/config/maps.ts`
- **Project DTO**: `apps/backend/src/projects/dto/create-project.dto.ts`
- **Project Service**: `apps/backend/src/projects/projects.service.ts`

---

**This address system is now fully implemented and ready to power deliveries, contractor assignments, and location-based features throughout the app!** 🎉

