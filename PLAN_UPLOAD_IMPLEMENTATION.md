# Plan Upload & GC Matching - Implementation Summary 📋

## ✅ **What We Built**

A complete end-to-end system for:
1. Uploading architectural plans (PDF only)
2. AI analysis of plans using OpenAI
3. Smart GC recommendation
4. Request/accept workflow
5. Project activation

---

## 🗂️ **Database Schema**

### **Project Model** (Enhanced)
```prisma
model Project {
  // ... existing fields ...
  planPdfUrl          String?       // URL to uploaded PDF
  planFileName        String?       // Original filename
  aiAnalysis          Json?         // AI-generated analysis
  aiProcessedAt       DateTime?     // When AI processing completed
  projectRequests     ProjectRequest[]
}
```

### **ProjectRequest Model** (New)
```prisma
model ProjectRequest {
  id                String   @id @default(uuid())
  projectId         String
  contractorId      String
  status            String   @default("pending") // pending | accepted | rejected
  
  // GC's edited estimates
  estimatedBudget   Float?
  estimatedDuration String?
  gcNotes           String?
  
  sentAt            DateTime @default(now())
  respondedAt       DateTime?
}
```

---

## 📱 **Frontend - Mobile App**

### **1. Upload Plan Screen** (`upload-plan.tsx`)
**Features:**
- ✅ PDF-only file picker (using `expo-document-picker`)
- ✅ Merge files instruction message
- ✅ Project name & budget input
- ✅ Address carried over from location screen
- ✅ Upload progress indicator
- ✅ Form validation

**Flow:**
```
User selects PDF → Fills form → Uploads → AI processes → Navigate to summary
```

### **2. House Summary Screen** (`house-summary.tsx`)
**Features:**
- ✅ Display AI analysis:
  - Project overview (bedrooms, bathrooms, sqft, floors)
  - Estimated cost & duration
  - Construction phases (6 phases with costs/timelines)
  - Materials list
  - Rooms & features
- ✅ Recommended GCs section:
  - Top 3 matches with scores (95%, 90%, 88%)
  - GC details (rating, reviews, experience, location)
  - Multi-select cards
- ✅ Send request button
- ✅ Status tracking:
  - **None**: Show "Send Request" button
  - **Pending**: Show waiting message
  - **Accepted**: Enable "Start Building" button
- ✅ Locked "Start Building" until GC accepts

**User Actions:**
1. Review AI analysis
2. Select 2-3 GCs
3. Send requests
4. Wait for GC acceptance
5. Click "Start Building" (once unlocked)

---

## 🔧 **Backend - NestJS API**

### **Modules Created:**

#### **1. OpenAI Module** (`src/openai/`)
**Files:**
- `openai.service.ts` - AI analysis service
- `openai.module.ts` - Module definition

**Key Functions:**
```typescript
analyzePlan(pdfText, projectName, budget)
  → Returns: PlanAnalysis {
      projectType, estimatedBudget, estimatedDuration,
      squareFootage, floors, bedrooms, bathrooms,
      rooms[], materials[], features[],
      phases[{ name, description, duration, cost }],
      confidence, notes
    }

extractTextFromPdf(pdfBuffer)
  → Returns: extracted text (placeholder for now)

getMockAnalysis()
  → Returns: mock data for testing without OpenAI API key
```

**Environment:**
- Requires `OPENAI_API_KEY` in `.env`
- Falls back to mock data if key not set

#### **2. Plans Module** (`src/plans/`)
**Files:**
- `plans.service.ts` - Business logic
- `plans.controller.ts` - HTTP endpoints
- `plans.module.ts` - Module definition
- `dto/upload-plan.dto.ts` - Validation

**Endpoints:**
```typescript
POST /api/plans/upload
  - Auth: JWT (homeowner only)
  - Body: UploadPlanDto + PDF file
  - Returns: { project, aiAnalysis }

GET /api/plans/:projectId/analysis
  - Auth: JWT
  - Returns: Project with AI analysis
```

**Upload Flow:**
1. Validate PDF file (max 50MB)
2. Save to `./uploads/plans/` (TODO: S3 in production)
3. Extract text from PDF
4. Call OpenAI for analysis
5. Create project with analysis
6. Return analysis to frontend

#### **3. Contractors Module** (`src/contractors/`)
**Files:**
- `contractors.service.ts` - GC matching logic
- `contractors.controller.ts` - HTTP endpoints
- `contractors.module.ts` - Module definition

**Key Functions:**

```typescript
recommendGCs(projectId, limit=3)
  Matching criteria:
  - Type: general_contractor
  - Verified: true
  - Rating: ≥ 4.5
  - Location: Same city/state as project
  
  Scoring (max 100):
  - Base: 70 points
  - City match: +15 points
  - State match: +10 points
  - Rating ≥4.9: +5 points
  - Projects ≥80: +5 points
  
  Returns: Top 3 GCs sorted by score

sendProjectRequests(projectId, contractorIds[])
  - Creates ProjectRequest for each GC
  - Status: 'pending'
  - TODO: Send email/push notifications

getPendingRequests(contractorId)
  - Returns all pending requests for a GC
  - Includes project details & homeowner info

acceptRequest(requestId, contractorId, estimates)
  - Updates request status: 'accepted'
  - Assigns GC to project
  - Rejects other pending requests
  - TODO: Notify homeowner

rejectRequest(requestId, contractorId, reason)
  - Updates request status: 'rejected'
```

**Endpoints:**
```typescript
GET /api/contractors/recommend/:projectId
  - Auth: JWT (homeowner)
  - Returns: Top 3 recommended GCs

POST /api/contractors/requests/send
  - Auth: JWT (homeowner)
  - Body: { projectId, contractorIds[] }
  - Returns: Created requests

GET /api/contractors/requests/pending
  - Auth: JWT (general_contractor)
  - Returns: Pending requests for this GC

POST /api/contractors/requests/:requestId/accept
  - Auth: JWT (general_contractor)
  - Body: { estimatedBudget?, estimatedDuration?, gcNotes? }
  - Returns: Updated request

POST /api/contractors/requests/:requestId/reject
  - Auth: JWT (general_contractor)
  - Body: { reason? }
  - Returns: Updated request
```

---

## 🔄 **Complete Flow**

### **Phase 1: Plan Upload & AI Analysis**

```
┌─────────────────┐
│  Homeowner      │
└────────┬────────┘
         │
         │ 1. Select location
         ▼
┌─────────────────┐
│ Location Screen │
└────────┬────────┘
         │
         │ 2. Upload PDF plan
         ▼
┌─────────────────┐
│ Upload Screen   │
└────────┬────────┘
         │
         │ 3. POST /api/plans/upload
         ▼
┌─────────────────┐
│  Backend API    │
└────────┬────────┘
         │
         │ 4. Process with OpenAI
         ▼
┌─────────────────┐
│  AI Analysis    │
└────────┬────────┘
         │
         │ 5. Create project + analysis
         ▼
┌─────────────────┐
│   Database      │
└────────┬────────┘
         │
         │ 6. Return analysis
         ▼
┌─────────────────┐
│ Summary Screen  │
└─────────────────┘
```

### **Phase 2: GC Recommendation & Request**

```
┌─────────────────┐
│ Summary Screen  │
└────────┬────────┘
         │
         │ 1. GET /api/contractors/recommend/:projectId
         ▼
┌─────────────────┐
│ GC Algorithm    │ Match by location, rating, specialty
└────────┬────────┘
         │
         │ 2. Return top 3 GCs with scores
         ▼
┌─────────────────┐
│ Display GCs     │ User selects 2-3
└────────┬────────┘
         │
         │ 3. POST /api/contractors/requests/send
         ▼
┌─────────────────┐
│ Create Requests │ status: 'pending'
└────────┬────────┘
         │
         │ 4. Notify GCs (TODO)
         ▼
┌─────────────────┐
│   GC Inbox      │
└─────────────────┘
```

### **Phase 3: GC Review & Accept** (Partially implemented)

```
┌─────────────────┐
│  GC Dashboard   │ (TODO: Frontend)
└────────┬────────┘
         │
         │ 1. GET /api/contractors/requests/pending
         ▼
┌─────────────────┐
│ Pending List    │
└────────┬────────┘
         │
         │ 2. View project details + AI analysis
         ▼
┌─────────────────┐
│ Request Detail  │ (TODO: Frontend)
└────────┬────────┘
         │
         │ 3. Edit estimates (optional)
         │ 4. POST /api/contractors/requests/:id/accept
         ▼
┌─────────────────┐
│ Accept Request  │
└────────┬────────┘
         │
         │ 5. Assign GC to project
         │ 6. Reject other pending requests
         ▼
┌─────────────────┐
│ Notify Homeowner│ (TODO)
└────────┬────────┘
         │
         │ 7. Status: 'accepted'
         ▼
┌─────────────────┐
│ Unlock "Start   │
│ Building" button│
└─────────────────┘
```

### **Phase 4: Project Activation**

```
┌─────────────────┐
│ Start Building  │ Button now enabled
└────────┬────────┘
         │
         │ 1. User clicks button
         ▼
┌─────────────────┐
│ Payment Modal   │ (Optional: 50% down payment)
└────────┬────────┘
         │
         │ 2. Process payment
         ▼
┌─────────────────┐
│ Update Project  │ status: 'active'
└────────┬────────┘
         │
         │ 3. Navigate to dashboard
         ▼
┌─────────────────┐
│ Project Active  │
└─────────────────┘
```

---

## 📦 **Dependencies Installed**

### Backend:
```json
{
  "openai": "^6.14.0",
  "multer": "^2.0.2",
  "@types/multer": "^2.0.0"
}
```

### Frontend:
```json
{
  "expo-document-picker": "^14.0.8" (already installed)
}
```

---

## 🗂️ **File Structure**

```
apps/backend/src/
├── openai/
│   ├── openai.service.ts      ✅ AI analysis
│   └── openai.module.ts       ✅
├── plans/
│   ├── plans.service.ts       ✅ Upload & process
│   ├── plans.controller.ts    ✅ API endpoints
│   ├── plans.module.ts        ✅
│   └── dto/
│       └── upload-plan.dto.ts ✅ Validation
├── contractors/
│   ├── contractors.service.ts ✅ GC matching & requests
│   ├── contractors.controller.ts ✅ API endpoints
│   └── contractors.module.ts  ✅
└── uploads/
    └── plans/                 ✅ PDF storage

apps/mobile-homeowner/app/
├── upload-plan.tsx            ✅ PDF upload screen
└── house-summary.tsx          ✅ AI analysis + GC selection
```

---

## ✅ **What's Complete**

### Backend:
- ✅ Database schema (Project + ProjectRequest)
- ✅ OpenAI service (with mock fallback)
- ✅ File upload (PDF, 50MB limit)
- ✅ GC recommendation algorithm
- ✅ Send request API
- ✅ Accept/reject request API
- ✅ Pending requests API

### Frontend:
- ✅ Upload plan screen (PDF-only)
- ✅ House summary screen
- ✅ AI analysis display
- ✅ GC recommendation cards
- ✅ Multi-select functionality
- ✅ Send request button
- ✅ Status tracking (none/pending/accepted)
- ✅ Locked "Start Building" button

---

## 🚧 **What's Remaining (TODO)**

### High Priority:
1. **GC Dashboard Frontend**
   - Pending requests list
   - Request detail screen
   - Accept/reject buttons
   - Edit estimates form

2. **Notifications**
   - Email to GCs when request sent
   - Push notification to homeowner when GC accepts
   - WebSocket real-time updates

3. **File Storage**
   - Replace local storage with S3/Cloud Storage
   - Generate signed URLs for PDF access

4. **PDF Text Extraction**
   - Install `pdf-parse` package
   - Implement actual text extraction
   - Send to OpenAI Vision API for better analysis

### Medium Priority:
5. **Project Activation**
   - Update project status to 'active'
   - Create initial stages from AI phases
   - Payment integration

6. **GC Profile Pages**
   - View GC portfolio
   - Past projects
   - Reviews

### Low Priority:
7. **Enhanced Matching**
   - Budget range matching
   - Availability checking
   - Portfolio similarity

8. **Analytics**
   - Track GC response times
   - Acceptance rates
   - Match quality metrics

---

## 🧪 **Testing the Flow**

### **1. Upload Plan (Homeowner)**
```bash
# Start backend
cd apps/backend
pnpm start:dev

# Start mobile app
cd apps/mobile-homeowner
pnpm start
```

**Steps:**
1. Login as homeowner
2. Navigate to location screen
3. Select address
4. Upload PDF plan
5. Fill project name & budget
6. Click "Process Plan with AI"

**Expected Result:**
- Loading indicator shows
- AI processes (or uses mock data)
- Navigates to house summary
- Shows AI analysis & recommended GCs

### **2. Send Requests (Homeowner)**
**Steps:**
1. On house summary screen
2. Review AI analysis
3. Select 2-3 GCs
4. Click "Send Request to X GCs"

**Expected Result:**
- Requests created in database
- Status changes to "pending"
- "Start Building" button stays locked

### **3. Accept Request (GC)** - API Only (Frontend TODO)
```bash
# Get pending requests
curl -X GET http://localhost:3001/api/contractors/requests/pending \
  -H "Authorization: Bearer GC_JWT_TOKEN"

# Accept request
curl -X POST http://localhost:3001/api/contractors/requests/REQUEST_ID/accept \
  -H "Authorization: Bearer GC_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedBudget": 275000,
    "estimatedDuration": "7 months",
    "gcNotes": "Looks good, I can start in 2 weeks"
  }'
```

**Expected Result:**
- Request status → 'accepted'
- Project assigned to GC
- Other requests → 'rejected'
- Homeowner's "Start Building" button unlocks

---

## 🔒 **Security Considerations**

1. **File Upload:**
   - ✅ PDF-only validation
   - ✅ 50MB size limit
   - ✅ Unique filenames
   - ⚠️ TODO: Virus scanning
   - ⚠️ TODO: S3 with signed URLs

2. **Authorization:**
   - ✅ JWT authentication
   - ✅ Role-based access (homeowner/GC)
   - ✅ Project ownership checks

3. **API Keys:**
   - ✅ OpenAI key in environment variables
   - ✅ Not committed to git

---

## 💰 **Cost Considerations**

### OpenAI API:
- **Model**: GPT-4 Turbo
- **Cost**: ~$0.01-0.03 per analysis
- **Fallback**: Mock data (free)

### File Storage:
- **Current**: Local disk (free, not scalable)
- **Production**: S3 (~$0.023/GB/month)

---

## 🎯 **Next Steps**

1. **Build GC Dashboard** (Frontend)
2. **Implement Notifications** (Email/Push)
3. **Test End-to-End** with real accounts
4. **Deploy to Staging**
5. **Get Real Contractor Feedback**

---

## 📚 **Related Documentation**

- `GOOGLE_MAPS_IMPLEMENTATION.md` - Location selection
- `VENDOR_TESTING_GUIDE.md` - Material marketplace
- `START_BACKEND.md` - Backend setup

---

**Status: ~80% Complete** 🚀
**Ready for Phase 3: GC Dashboard Implementation**


