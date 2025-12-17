# Marketplace Module

Complete marketplace implementation for materials and contractors with search, reviews, and ratings.

## Features

- ✅ Materials CRUD operations
- ✅ Contractors listing and profiles
- ✅ Reviews and ratings system
- ✅ Search functionality (basic Prisma-based, ready for Meilisearch/Elasticsearch)
- ✅ Pagination and filtering
- ✅ Vendor/contractor ownership verification

## API Endpoints

### Materials

- `GET /api/marketplace/materials` - List all materials (with search/filter)
- `GET /api/marketplace/materials/search` - Search materials
- `GET /api/marketplace/materials/:id` - Get material details
- `GET /api/marketplace/materials/vendor/my` - Get my materials (vendor)
- `POST /api/marketplace/materials` - Create material (vendor only)
- `PATCH /api/marketplace/materials/:id` - Update material (owner only)
- `DELETE /api/marketplace/materials/:id` - Delete material (owner only)

### Contractors

- `GET /api/marketplace/contractors` - List all contractors (with search/filter)
- `GET /api/marketplace/contractors/search` - Search contractors
- `GET /api/marketplace/contractors/:id` - Get contractor details
- `GET /api/marketplace/contractors/profile` - Get my contractor profile
- `POST /api/marketplace/contractors/profile` - Create contractor profile
- `PATCH /api/marketplace/contractors/profile` - Update contractor profile
- `GET /api/marketplace/contractors/user/:userId` - Get contractor by user ID

### Reviews

- `POST /api/marketplace/reviews` - Create review (material or contractor)
- `GET /api/marketplace/reviews/material/:materialId` - Get material reviews
- `GET /api/marketplace/reviews/contractor/:contractorId` - Get contractor reviews
- `PATCH /api/marketplace/reviews/:id` - Update review (owner only)
- `DELETE /api/marketplace/reviews/:id` - Delete review (owner only)

### Search

- `GET /api/marketplace/search` - Unified search (materials + contractors)
- `GET /api/marketplace/search/suggestions?q=query` - Get search suggestions
- `GET /api/marketplace/search/popular` - Get popular items

## Search Parameters

All search endpoints support:

- `query` - Text search query
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `minPrice` - Minimum price filter (materials only)
- `maxPrice` - Maximum price filter (materials only)
- `minRating` - Minimum rating filter
- `category` - Category/type filter (contractors: 'general_contractor' | 'subcontractor')
- `sortBy` - Sort field ('price' | 'rating' | 'reviews' | 'createdAt')
- `sortOrder` - Sort direction ('asc' | 'desc', default: 'desc')

## Example Requests

### Search Materials
```bash
GET /api/marketplace/materials?query=cement&minPrice=10&maxPrice=100&minRating=4&sortBy=rating
```

### Search Contractors
```bash
GET /api/marketplace/contractors?query=plumber&category=subcontractor&minRating=4.5
```

### Create Review
```json
POST /api/marketplace/reviews
{
  "materialId": "material-id",
  "rating": 5,
  "comment": "Great quality material!"
}
```

### Unified Search
```bash
GET /api/marketplace/search?query=cement&page=1&limit=10
```

## Future Enhancements

### Search Integration

For production, consider integrating:

1. **Meilisearch** (Recommended)
   ```bash
   pnpm add meilisearch
   ```
   - Fast, typo-tolerant search
   - Easy to integrate
   - Good for small to medium datasets

2. **Elasticsearch**
   ```bash
   pnpm add @elastic/elasticsearch
   ```
   - More powerful, complex setup
   - Better for large-scale applications
   - Advanced search features

### Implementation Steps

1. Install search engine client
2. Create index/schema for materials and contractors
3. Sync data on create/update/delete
4. Replace Prisma search with search engine queries
5. Add faceted search, filters, and aggregations

## Authentication

Currently, authentication is commented out with TODO markers. When JWT auth is fully implemented:

1. Uncomment `@UseGuards(JwtAuthGuard)` in controllers
2. Replace `req.user?.sub` with actual JWT payload extraction
3. Add role-based access control (RBAC) for vendor/admin operations

## Rating System

- Ratings are automatically calculated from reviews
- Average rating is updated when reviews are created/updated/deleted
- Rating is rounded to 1 decimal place
- Review count is maintained automatically

