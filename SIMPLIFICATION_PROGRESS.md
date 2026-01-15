# Simplification Progress

## ✅ Completed

### 1. Database Schema
- ✅ Added `StageTeamMember` model (team members with photos, invoices, rates)
- ✅ Added `StageMaterial` model (materials with receipts, photos, supplier info)
- ✅ Added `StageMedia` model (photos/videos per stage)
- ✅ Added `StageDocument` model (receipts/invoices/contracts per stage)
- ✅ Migration generated and applied
- ✅ Prisma client generated

### 2. Backend DTOs
- ✅ `CreateStageTeamMemberDto`
- ✅ `CreateStageMaterialDto`
- ✅ `CreateStageMediaDto`
- ✅ `CreateStageDocumentDto`

### 3. Backend Service Methods
- ✅ `addStageTeamMember`, `getStageTeamMembers`, `updateStageTeamMember`, `deleteStageTeamMember`
- ✅ `addStageMaterial`, `getStageMaterials`, `updateStageMaterial`, `deleteStageMaterial`
- ✅ `addStageMedia`, `getStageMedia`, `updateStageMedia`, `deleteStageMedia`
- ✅ `addStageDocument`, `getStageDocuments`, `updateStageDocument`, `deleteStageDocument`
- ✅ `validateStageCompletion` - Validates required documentation before stage completion
- ✅ Updated `updateStageStatus` to call validation before marking as completed
- ✅ Updated `getProject` to include stage documentation (teamMembers, materials, media, documents)

### 4. Backend Controller Endpoints
- ✅ POST/GET/PATCH/DELETE `/projects/:projectId/stages/:stageId/team-members`
- ✅ POST/GET/PATCH/DELETE `/projects/:projectId/stages/:stageId/materials`
- ✅ POST/GET/PATCH/DELETE `/projects/:projectId/stages/:stageId/media`
- ✅ POST/GET/PATCH/DELETE `/projects/:projectId/stages/:stageId/documents`
- ✅ Removed `subcontractor` role from stage update endpoint

### 5. Stage Completion Validation
- ✅ Validates at least one team member with photo and invoice
- ✅ Validates at least one material with receipt and photo
- ✅ Validates at least one process photo
- ✅ Validates at least one process video
- ✅ Throws `BadRequestException` with detailed error messages if validation fails

## 🔄 In Progress / Next Steps

### Frontend Changes Needed:

#### GC App:
1. Remove subcontractor assignment UI from `gc-project-detail.tsx`
2. Remove vendor dashboard/screens
3. Add team member management UI per stage
4. Add material tracking UI per stage
5. Add media upload UI (photos/videos) per stage
6. Add receipt/invoice upload UI per stage
7. Update stage completion flow to show validation errors
8. Remove sub-GC/vendor navigation items

#### Homeowner App:
1. Remove sub-GC/vendor references
2. Enhance stage view to show teams, materials, media, receipts
3. Add download/export functionality for receipts

#### Backend Cleanup (Optional - can do later):
1. Remove/comment out subcontractor assignment endpoints
2. Remove vendor-related endpoints
3. Keep ProjectRequest model but mark as deprecated


