# 🏪 Marketplace API Guide

## Quick Start

### Starting the Services

```bash
# Terminal 1: Start PostgreSQL (if using Docker)
docker-compose up postgres

# Terminal 2: Start Backend
cd apps/backend
pnpm dev

# Terminal 3: Start Mobile App
cd apps/mobile-homeowner
pnpm start
```

### Database Setup

```bash
cd apps/backend

# Run migrations
pnpm prisma:migrate dev

# Seed marketplace data
pnpm prisma:seed
```

## 📡 API Endpoints

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.buildmyhouse.com/api`

### Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🧱 Materials API

### List Materials
```http
GET /marketplace/materials?query=cement&category=cement&minPrice=1000&maxPrice=10000&minRating=4&sortBy=rating&sortOrder=desc&page=1&limit=20
```

**Query Parameters:**
- `query` (optional) - Search in name and brand
- `category` (optional) - Filter by category
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `minRating` (optional) - Minimum rating (0-5)
- `sortBy` (optional) - Sort field: `price`, `rating`, `reviews`, `createdAt`
- `sortOrder` (optional) - `asc` or `desc`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Premium Portland Cement",
      "brand": "Dangote",
      "description": "High-quality cement...",
      "category": "cement",
      "price": 4500,
      "unit": "bag (50kg)",
      "stock": 500,
      "rating": 4.8,
      "reviews": 234,
      "verified": true,
      "imageUrl": "https://...",
      "vendor": {
        "id": "uuid",
        "fullName": "Dangote Cement Nigeria"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Material Details
```http
GET /marketplace/materials/:id
```

**Response:** Single material object with full details including reviews

### Create Material (Vendor/Admin Only)
```http
POST /marketplace/materials
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Cement",
  "brand": "Dangote",
  "description": "High-quality cement for all construction needs",
  "category": "cement",
  "price": 4500,
  "unit": "bag (50kg)",
  "stock": 500,
  "imageUrl": "https://...",
  "verified": true
}
```

---

## 👷 Contractors API

### List Contractors
```http
GET /marketplace/contractors?query=electrical&category=subcontractor&minRating=4.5&sortBy=rating&page=1&limit=20
```

**Query Parameters:**
- `query` (optional) - Search in name and specialty
- `category` (optional) - Filter by type: `general_contractor` or `subcontractor`
- `minRating` (optional) - Minimum rating (0-5)
- `sortBy` (optional) - Sort field: `rating`, `reviews`, `projects`, `createdAt`
- `sortOrder` (optional) - `asc` or `desc`
- `page`, `limit` - Pagination

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Okafor Electrical Services",
      "specialty": "Electrical Installation & Wiring",
      "description": "Licensed electrician with expertise...",
      "location": "Port Harcourt, Nigeria",
      "rating": 4.7,
      "reviews": 124,
      "projects": 178,
      "verified": true,
      "imageUrl": "https://...",
      "hiringFee": 150000,
      "type": "subcontractor",
      "user": {
        "id": "uuid",
        "email": "contractor@example.com",
        "phone": "+234 809 345 6789"
      }
    }
  ],
  "pagination": {...}
}
```

### Get Contractor Details
```http
GET /marketplace/contractors/:id
```

**Response:** Single contractor with full details including reviews

### Get My Contractor Profile (Contractor Only)
```http
GET /marketplace/contractors/profile
Authorization: Bearer <token>
```

### Create Contractor Profile (Contractor Only)
```http
POST /marketplace/contractors/profile
Authorization: Bearer <token>

{
  "name": "My Construction Company",
  "specialty": "Residential Building",
  "description": "15 years of experience...",
  "location": "Lagos, Nigeria",
  "hiringFee": 250000,
  "type": "general_contractor",
  "imageUrl": "https://..."
}
```

---

## 🔍 Search API

### Unified Search
```http
GET /marketplace/search?query=cement&limit=20
```

**Response:**
```json
{
  "materials": {
    "data": [...],
    "pagination": {...}
  },
  "contractors": {
    "data": [...],
    "pagination": {...}
  }
}
```

### Search Suggestions (Autocomplete)
```http
GET /marketplace/search/suggestions?query=cem&limit=5
```

**Response:**
```json
{
  "materials": [
    {
      "id": "uuid",
      "name": "Premium Cement",
      "brand": "Dangote"
    }
  ],
  "contractors": [...]
}
```

### Popular Items
```http
GET /marketplace/search/popular?limit=10
```

---

## ⭐ Reviews API

### Create Review
```http
POST /marketplace/reviews
Authorization: Bearer <token>

{
  "materialId": "uuid",  // OR contractorId
  "rating": 5,
  "comment": "Excellent quality cement, highly recommended!"
}
```

**Validation:**
- Must provide either `materialId` OR `contractorId` (not both)
- Rating: 1-5 (required)
- Comment: optional string
- One review per user per item

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "materialId": "uuid",
  "rating": 5,
  "comment": "Excellent quality...",
  "createdAt": "2024-01-15T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "fullName": "John Doe"
  }
}
```

### Get Material Reviews
```http
GET /marketplace/reviews/material/:materialId?page=1&limit=20
```

### Get Contractor Reviews
```http
GET /marketplace/reviews/contractor/:contractorId?page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great service!",
      "user": {
        "id": "uuid",
        "fullName": "Jane Smith"
      },
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### Update Review (Author Only)
```http
PATCH /marketplace/reviews/:id
Authorization: Bearer <token>

{
  "rating": 4,
  "comment": "Updated comment"
}
```

### Delete Review (Author Only)
```http
DELETE /marketplace/reviews/:id
Authorization: Bearer <token>
```

---

## 🎨 Material Categories

Available categories:
- `cement` - Cement and concrete
- `steel` - Steel and reinforcement
- `wood` - Wood and timber products
- `paint` - Paints and coatings
- `plumbing` - Plumbing supplies
- `electrical` - Electrical materials
- `tiles` - Tiles and ceramics
- `fixtures` - Fixtures and fittings
- `other` - Other materials

---

## 🛡️ Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 🔄 Real-time Features (Coming Soon)

Marketplace will integrate with WebSocket for:
- Live stock updates
- New review notifications
- Price change alerts
- New contractor availability

---

## 📝 Usage Examples

### Example: Search and Purchase Flow

```typescript
// 1. Search for materials
const materials = await api.get('/marketplace/materials?query=cement&limit=10');

// 2. View material details
const material = await api.get(`/marketplace/materials/${materials.data[0].id}`);

// 3. Read reviews
const reviews = await api.get(`/marketplace/reviews/material/${material.id}`);

// 4. Add your review
await api.post('/marketplace/reviews', {
  materialId: material.id,
  rating: 5,
  comment: "Excellent product!"
});

// 5. Purchase (integrate with payments API)
// Coming in Phase 4
```

### Example: Hire Contractor Flow

```typescript
// 1. Search contractors
const contractors = await api.get('/marketplace/contractors?category=general_contractor');

// 2. View contractor profile
const contractor = await api.get(`/marketplace/contractors/${contractors.data[0].id}`);

// 3. Check reviews
const reviews = await api.get(`/marketplace/reviews/contractor/${contractor.id}`);

// 4. Hire contractor (integrate with payments)
// Coming in Phase 4
```

---

## 🧪 Test Data

After seeding, you'll have:
- 12 materials across all categories
- 4 contractors (2 GCs, 2 Subs)
- 3 vendor accounts
- All items verified and rated

**Test Vendor Login:**
- Email: `vendor1@buildmyhouse.com`
- Password: `password123`

---

## 🚀 Mobile App Integration

Import hooks in your components:

```typescript
import { 
  useMaterials, 
  useContractor,
  useSearch,
  useCreateReview 
} from '@/hooks/useMarketplace';

function MyComponent() {
  const { data: materials, isLoading } = useMaterials({ 
    category: 'cement',
    limit: 10 
  });
  
  const createReview = useCreateReview();
  
  const handleReview = async () => {
    await createReview.mutateAsync({
      materialId: 'xxx',
      rating: 5,
      comment: 'Great!'
    });
  };
}
```

---

## 💡 Tips

1. **Search Performance:** For production, consider Elasticsearch or Meilisearch
2. **File Storage:** Migrate from local disk to S3/Cloudinary for images
3. **Caching:** Add Redis for popular items and search results
4. **Analytics:** Track popular searches and conversion rates
5. **Recommendations:** Build ML-based product recommendations
