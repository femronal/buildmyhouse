# 🏗️ BuildMyHouse - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APPS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Homeowner   │  │ Contractor   │  │   Admin      │      │
│  │     App      │  │     App      │  │   Panel      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ╔════════▼════════╗
                    ║   REST API      ║
                    ║  (NestJS)       ║
                    ║  Port 3001      ║
                    ╚════════╤════════╝
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ╔════▼═════╗      ╔═══════▼════════╗   ╔═════▼══════╗
   ║PostgreSQL║      ║   WebSocket    ║   ║   Redis    ║
   ║ Database ║      ║  (Socket.io)   ║   ║   Cache    ║
   ║Port 5432 ║      ║   Port 3001    ║   ║ Port 6379  ║
   ╚══════════╝      ╚════════════════╝   ╚════════════╝
```

---

## 🗄️ Database Schema

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │───┐
│ email       │   │
│ password    │   │
│ fullName    │   │
│ role        │   │  ┌──────────────┐
│ pictureUrl  │   ├──│  Project     │
│ verified    │   │  ├──────────────┤
└─────────────┘   │  │ id           │
                  │  │ name         │
   ┌──────────────┤  │ address      │───┐
   │              │  │ budget       │   │
   │              │  │ spent        │   │
   │              │  │ progress     │   │
   │              │  │ currentStage │   │
   │              │  └──────────────┘   │
   │              │                     │
   │    ┌─────────┴──────────┐    ┌────▼─────────┐
   │    │  FileAttachment    │    │    Stage     │
   │    ├────────────────────┤    ├──────────────┤
   │    │ id                 │    │ id           │
   │    │ fileName           │    │ name         │
   │    │ fileUrl            │◄───┤ status       │
   │    │ fileType           │    │ order        │
   │    │ projectId          │    │ estimatedCost│
   │    │ stageId            │    │ actualCost   │
   │    │ uploadedById       │    │ startDate    │
   │    └────────────────────┘    │ completionDate│
   │                              └──────────────┘
   │
   │  ┌─────────────┐
   ├──│  Material   │
   │  ├─────────────┤
   │  │ id          │
   │  │ name        │
   │  │ brand       │
   │  │ category    │────┐
   │  │ price       │    │
   │  │ stock       │    │
   │  │ rating      │    │
   │  │ vendorId    │    │
   │  └─────────────┘    │
   │                     │
   │  ┌─────────────┐    │
   └──│ Contractor  │    │
      ├─────────────┤    │
      │ id          │    │
      │ userId      │    │
      │ name        │    │
      │ specialty   │    │   ┌──────────┐
      │ rating      │◄───┴───│  Review  │
      │ hiringFee   │        ├──────────┤
      │ type        │        │ id       │
      │ location    │        │ userId   │
      └─────────────┘        │ rating   │
                             │ comment  │
                             │ materialId│
                             │contractorId│
                             └──────────┘
```

---

## 🔄 Request Flow

### Example: Upload File to Stage

```
┌──────────┐
│  Mobile  │ 1. User selects photo
│   App    │
└────┬─────┘
     │ 2. POST /api/files/upload
     │    (multipart/form-data)
     │    + JWT token
     ▼
┌──────────────┐
│ Files        │ 3. Validate JWT
│ Controller   │ 4. Check permissions
└────┬─────────┘
     │ 5. Call FilesService
     ▼
┌──────────────┐
│ Files        │ 6. Verify project access
│ Service      │ 7. Save file to disk
└────┬─────────┘ 8. Create DB record
     │
     ▼
┌──────────────┐
│  PostgreSQL  │ 9. INSERT file record
└────┬─────────┘
     │ 10. Return file data
     ▼
┌──────────────┐
│  WebSocket   │ 11. Emit file_uploaded event
│  Service     │
└────┬─────────┘
     │ 12. Broadcast to project room
     ▼
┌──────────────┐
│  All Connected│ 13. Update UI
│   Clients    │
└──────────────┘
```

---

## 🔌 API Architecture

### Module Organization

```
app.module.ts
├── AuthModule          (JWT, OAuth, Guards)
├── WebSocketModule     (Real-time events)
├── ProjectsModule      (Project CRUD)
├── StagesModule        (✨ Phase 2 - Stage management)
├── FilesModule         (✨ Phase 2 - File uploads)
├── TimelineModule      (✨ Phase 2 - Timeline tracking)
├── MarketplaceModule   (✨ Phase 3 - Materials, Contractors, Search, Reviews)
├── ChatModule          (Phase 5 - Messaging)
└── PaymentsModule      (Phase 4 - Payments, Invoices)
```

### Dependency Injection Flow

```
StagesController
    │
    ├─> StagesService
    │       │
    │       ├─> PrismaClient (Database)
    │       └─> WebSocketService (Real-time)
    │               │
    │               └─> WebSocketGateway
    │
    ├─> JwtAuthGuard (Authentication)
    │       └─> JwtAuthService
    │
    └─> RolesGuard (Authorization)
            └─> Reflector (Metadata)
```

---

## 📱 Mobile App Architecture

### Navigation Structure

```
Root Layout (_layout.tsx)
│
├── QueryClientProvider (React Query)
│   │
│   └── Stack Navigator
│       │
│       ├── (tabs) - Bottom Tab Navigator
│       │   ├── home.tsx      (Projects list)
│       │   ├── shop.tsx      (Marketplace)
│       │   ├── explore.tsx   (Designs)
│       │   ├── finance.tsx   (Budget tracking)
│       │   └── profile.tsx   (User profile)
│       │
│       ├── dashboard.tsx         (✨ Project dashboard)
│       ├── timeline.tsx          (✨ Stage timeline)
│       ├── stage-detail.tsx      (✨ Stage files & info)
│       ├── material-detail.tsx   (✨ Product details)
│       ├── contractor-detail.tsx (✨ Contractor profile)
│       ├── search.tsx            (✨ Search screen)
│       ├── login.tsx
│       └── ... (other screens)
```

### Data Flow with React Query

```
Component
    │
    ├─> useQuery Hook
    │       │
    │       ├─> API Service
    │       │       │
    │       │       └─> fetch() → Backend API
    │       │
    │       └─> Cache (5min stale time)
    │
    └─> useMutation Hook
            │
            ├─> API Service (POST/PATCH/DELETE)
            │
            └─> onSuccess → Invalidate Queries
                    │
                    └─> Trigger Refetch (UI updates)
```

---

## 🔒 Security Layers

### Backend Security

```
Request → CORS Check → JWT Validation → Role Check → Ownership Check → Process
                                ↓              ↓             ↓
                          JwtAuthGuard   RolesGuard    Service Logic
```

### Authentication Flow

```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT token (payload: userId, email, role)
   ↓
4. Return token + user data
   ↓
5. Mobile stores token (AsyncStorage)
   ↓
6. Include token in all subsequent requests
   ↓
7. Backend verifies token on each request
```

### Authorization Matrix

```
                        Homeowner  Contractor  Vendor  Admin
Create Project             ✅         ✅        ❌      ✅
Manage Stages              ✅         ✅        ❌      ✅
Upload Files               ✅         ✅        ❌      ✅
List Materials             ✅         ✅        ✅      ✅
Create Material            ❌         ❌        ✅      ✅
List Contractors           ✅         ✅        ✅      ✅
Create Contractor Profile  ❌         ✅        ❌      ✅
Write Review               ✅         ✅        ✅      ✅
```

---

## 🗃️ Data Models Relationships

### User-Centric View

```
User
├─> Projects (as homeowner)
├─> Projects (as contractor)
├─> FileAttachments (as uploader)
├─> Reviews (as author)
├─> Materials (as vendor)
├─> Contractor Profile (as user)
└─> Orders (as buyer)
```

### Project-Centric View

```
Project
├─> Stages (ordered)
│   ├─> FileAttachments
│   └─> Payments
├─> FileAttachments (project-level)
├─> Payments (project-level)
├─> Orders (materials/contractors)
└─> Timeline (computed)
```

### Marketplace View

```
Material                    Contractor
├─> Reviews                 ├─> Reviews
├─> OrderItems              ├─> User
└─> Vendor (User)           └─> Projects (count)
```

---

## 🔄 Real-time Architecture

### WebSocket Event Flow

```
Backend Event Emission
    │
    ├─> Stage Updated
    │      │
    │      └─> Emit to project:{projectId}
    │             │
    │             └─> All clients in room receive update
    │                    │
    │                    └─> React Query invalidates cache
    │                           │
    │                           └─> UI re-renders with new data
    │
    ├─> File Uploaded
    │      └─> Same flow as above
    │
    └─> Progress Updated
           └─> Same flow as above
```

### WebSocket Events

```typescript
// Client subscribes
socket.emit('subscribe', { projectId: 'xxx' });

// Server emits events
{
  type: 'stage_change',
  data: {
    event: 'stage_updated',
    stage: { id, name, status, order }
  }
}

// Client receives and updates
queryClient.invalidateQueries(['stages', projectId]);
```

---

## 📦 Package Dependencies

### Backend Critical Packages

```json
{
  "@nestjs/core": "^10.0.0",         // Framework
  "@nestjs/platform-express": "^10.0.0", // HTTP server
  "@nestjs/websockets": "^11.1.9",   // WebSocket
  "@prisma/client": "^5.0.0",        // Database ORM
  "passport-jwt": "^4.0.1",          // JWT auth
  "passport-google-oauth20": "^2.0.0", // OAuth
  "bcrypt": "^5.1.0",                // Password hashing
  "class-validator": "^0.14.3",     // Validation
  "multer": "^1.4.5",                // File uploads
  "socket.io": "^4.5.0",             // WebSocket
  "stripe": "^20.0.0"                // Payments (Phase 4)
}
```

### Mobile Critical Packages

```json
{
  "expo": "^54.0.0",                 // Framework
  "expo-router": "~6.0.15",          // Navigation
  "react-native": "0.81.5",          // UI Framework
  "@tanstack/react-query": "^5.90.0", // Data fetching
  "nativewind": "^4.1.23",           // Styling (Tailwind)
  "expo-image-picker": "latest",     // Photo uploads
  "expo-document-picker": "latest",  // Document uploads
  "expo-auth-session": "^7.0.10",    // OAuth
  "lucide-react-native": "^0.479.0", // Icons
  "date-fns": "latest",              // Date formatting
  "socket.io-client": "^4.8.1"       // WebSocket client
}
```

---

## 🎯 API Endpoint Organization

### By Module

#### AuthModule (`/api/auth`)
```
POST   /login            # Email/password login
POST   /register         # User registration
POST   /google           # Google OAuth (web)
POST   /google/mobile    # Google OAuth (mobile)
GET    /me               # Current user info
```

#### ProjectsModule (`/api/projects`)
```
GET    /                 # List user's projects
GET    /:id              # Get project details
POST   /                 # Create project
PATCH  /:id              # Update project
DELETE /:id              # Delete project
```

#### StagesModule (`/api/projects/:projectId/stages`)
```
GET    /                 # List project stages
GET    /:id              # Get stage details
POST   /                 # Create stage
PATCH  /:id              # Update stage
DELETE /:id              # Delete stage
POST   /reorder          # Reorder stages
```

#### FilesModule (`/api/files`)
```
POST   /upload           # Upload file (multipart)
GET    /project/:id      # List project files
GET    /stage/:id        # List stage files
GET    /:fileName        # Serve file
DELETE /:id              # Delete file
```

#### TimelineModule (`/api/projects/:projectId/timeline`)
```
GET    /                 # Get full timeline
GET    /milestones       # Get milestones
```

#### MarketplaceModule (`/api/marketplace`)
```
Materials:
GET    /materials        # List materials
GET    /materials/:id    # Get material
POST   /materials        # Create (vendor)
PATCH  /materials/:id    # Update (vendor)
DELETE /materials/:id    # Delete (vendor)

Contractors:
GET    /contractors      # List contractors
GET    /contractors/:id  # Get contractor
POST   /contractors/profile  # Create profile
PATCH  /contractors/profile  # Update profile

Search:
GET    /search           # Unified search
GET    /search/suggestions   # Autocomplete
GET    /search/popular   # Popular items

Reviews:
POST   /reviews          # Create review
GET    /reviews/material/:id     # Material reviews
GET    /reviews/contractor/:id   # Contractor reviews
PATCH  /reviews/:id      # Update (author)
DELETE /reviews/:id      # Delete (author)
```

---

## 🎨 Mobile App Component Architecture

### Screen Components

```
Timeline Screen
├── Header (back button, home button)
├── Progress Summary Card
│   ├── Progress percentage
│   ├── Status badge
│   └── Due date
├── Stages List
│   └── Stage Card (clickable if active)
│       ├── Status Icon (check/clock/lock)
│       ├── Stage Name
│       ├── Duration
│       ├── Photo count
│       └── Status Badge
└── Summary Stats Card
    ├── Completed/Total stages
    ├── Cost tracking
    └── Completion rate
```

```
Material Detail Screen
├── Header (back, home)
├── Product Image (full width)
├── Product Info
│   ├── Name & Brand
│   ├── Verified Badge
│   ├── Rating Stars
│   └── Review Count
├── Description Section
├── Details Card
│   ├── Category
│   ├── Unit
│   ├── Stock
│   └── Vendor
├── Reviews Section
│   ├── Review List
│   └── Write Review Button
└── Fixed Bottom Bar
    ├── Price & Quantity
    └── Add to Cart Button
```

---

## 🚀 Performance Optimizations

### Backend
- **Database Indexing** - All foreign keys indexed
- **Query Optimization** - Use `include` to prevent N+1
- **Pagination** - Limit results to 20-100 per page
- **Caching Ready** - Redis integration prepared

### Mobile
- **React Query Caching** - 5 minute stale time
- **Debounced Search** - 300ms delay
- **Lazy Loading** - Pagination support
- **Optimistic Updates** - Instant UI feedback
- **Image Optimization** - Proper resize modes

---

## 🧩 Module Dependencies

```
AppModule
    │
    ├─> ConfigModule (Global)
    │
    ├─> AuthModule
    │   └─> exports: JwtAuthService, JwtAuthGuard, RolesGuard
    │
    ├─> WebSocketModule
    │   └─> exports: WebSocketService
    │
    ├─> ProjectsModule
    │   ├─> imports: AuthModule, WebSocketModule
    │   └─> exports: ProjectsService
    │
    ├─> StagesModule
    │   ├─> imports: AuthModule, WebSocketModule
    │   └─> exports: StagesService
    │
    ├─> FilesModule
    │   ├─> imports: AuthModule, WebSocketModule
    │   └─> exports: FilesService
    │
    ├─> TimelineModule
    │   ├─> imports: AuthModule
    │   └─> exports: TimelineService
    │
    ├─> MarketplaceModule
    │   ├─> imports: AuthModule
    │   └─> exports: Materials, Contractors, Reviews, Search Services
    │
    ├─> ChatModule
    │   └─> Future implementation
    │
    └─> PaymentsModule
        └─> Future implementation
```

---

## 🎭 User Roles & Permissions

```
┌─────────────┐
│    Admin    │ - Full access to everything
└──────┬──────┘
       │
   ┌───┴────────────────────────────┐
   │                                │
┌──▼────────┐                 ┌─────▼──────┐
│ Homeowner │                 │ Contractor │
├───────────┤                 ├────────────┤
│• Create   │                 │• Create    │
│  projects │                 │  profile   │
│• Manage   │                 │• Manage    │
│  stages   │                 │  stages    │
│• Upload   │                 │• Upload    │
│  files    │                 │  files     │
│• Browse   │                 │• Browse    │
│  marketplace│               │  marketplace│
│• Hire     │                 │• Get hired │
│  contractors│               │• Receive   │
│• Buy      │                 │  reviews   │
│  materials│                 │            │
│• Write    │                 │            │
│  reviews  │                 │            │
└───────────┘                 └────────────┘
       │                           │
       └──────────┬────────────────┘
                  │
          ┌───────▼────────┐
          │    Vendor      │
          ├────────────────┤
          │• List products │
          │• Manage stock  │
          │• Set prices    │
          │• Receive orders│
          │• Get reviews   │
          └────────────────┘
```

---

## 💾 Data Storage

### Database (PostgreSQL)
- **Structured data** - Users, projects, stages, reviews
- **Relational integrity** - Foreign keys, cascades
- **Transactions** - ACID compliance
- **Migrations** - Version-controlled schema

### File Storage
- **Current:** Local disk (`apps/backend/uploads/`)
- **Production:** S3, Cloudinary, or Azure Blob
- **Structure:** `/{timestamp}-{random}.{ext}`
- **Serving:** Static file serving via Express

### Cache (Redis) - Ready
- **Session storage**
- **Search results cache**
- **Popular items cache**
- **Rate limiting**

---

## 🌐 Network Architecture

### Development
```
Mobile App (Expo)
    │ HTTP/WebSocket
    ↓
http://localhost:3001/api (Backend)
    │ TCP
    ↓
localhost:5432 (PostgreSQL)
localhost:6379 (Redis)
```

### Production (Future)
```
Mobile App (App Store/Play Store)
    │ HTTPS/WSS
    ↓
https://api.buildmyhouse.com (Load Balancer)
    │
    ├─> API Server 1 (Auto-scaled)
    ├─> API Server 2
    └─> API Server N
          │
          ├─> RDS PostgreSQL (Primary + Replica)
          └─> ElastiCache Redis (Cluster)
```

---

## 📊 Monitoring Points (Future)

### Health Checks
- `GET /api/health` - API server status
- Database connectivity
- Redis connectivity
- WebSocket connections

### Metrics to Track
- API response times
- Database query performance
- WebSocket connection count
- File upload success rate
- Search query performance
- Review submission rate

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/buildmyhouse"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# App
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:19006"

# Future
STRIPE_SECRET_KEY="sk_test_xxx"
PAYSTACK_SECRET_KEY="sk_test_xxx"
AWS_S3_BUCKET="buildmyhouse-uploads"
REDIS_URL="redis://localhost:6379"
```

---

## 🎯 Current Capabilities

### ✅ What Works Now

1. **User Management**
   - Register, login, OAuth
   - Profile with picture
   - Role-based access

2. **Project Management**
   - Create projects with budget
   - Add multiple stages
   - Track progress automatically
   - View timeline

3. **File Management**
   - Upload photos from camera/gallery
   - Upload plans (PDF)
   - Upload documents
   - Organize by project/stage
   - Delete files

4. **Marketplace**
   - Browse 12 materials
   - View 4 contractors
   - Search everything
   - Filter and sort
   - Read reviews
   - Write reviews

5. **Real-time**
   - Live stage updates
   - File upload notifications
   - Progress synchronization

### ⏳ Coming in Phase 4

1. **Payments**
   - Purchase materials
   - Hire contractors
   - Stage-based payments
   - Invoice generation

---

## 🌟 Architecture Highlights

### Scalability
- **Stateless API** - Can scale horizontally
- **Database pooling** - Prisma connection management
- **Pagination** - Handles large datasets
- **Caching ready** - Redis integration prepared

### Maintainability
- **TypeScript** - Full type safety
- **Modular design** - Clear separation of concerns
- **Dependency injection** - Testable code
- **DTOs** - API contract validation

### Security
- **JWT** - Stateless authentication
- **RBAC** - Fine-grained permissions
- **Input validation** - All inputs validated
- **SQL injection proof** - Prisma ORM

### Developer Experience
- **Hot reload** - Backend and mobile
- **Type inference** - Autocomplete everywhere
- **Error handling** - Clear error messages
- **Documentation** - Comprehensive guides

---

## 📈 Growth Path

### Phase 4: Payments
- Add Stripe/Paystack
- Implement escrow
- Generate invoices
- Track financials

### Phase 5: Advanced
- Real-time chat
- Push notifications
- AI-powered BOQ
- Analytics dashboard

### Future Enhancements
- Mobile apps for contractors and vendors
- Admin dashboard (web)
- Public marketplace website
- API for third-party integrations
- Mobile app for iOS/Android stores

---

**Architecture Status: ✅ Solid Foundation**  
**Ready for: Phase 4 and beyond**  
**Scalability: ✅ Horizontal scaling ready**  
**Security: ✅ Production-grade**
