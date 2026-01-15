# App Simplification Plan: Remove Sub-GC/Vendor, Enhance GC Documentation

## Goal
Simplify the app to only Homeowner and GC apps, with detailed GC documentation requirements for stages (teams, materials, receipts, photos, videos).

## Scope of Changes

### 1. Database Schema Updates
- Add `StageTeamMember` model (team members per stage)
- Add `StageMaterial` model (materials per stage)
- Add `StageMedia` model (photos/videos per stage)
- Add `StageDocument` model (receipts/invoices per stage)
- Keep existing models but mark sub-GC/vendor features as deprecated

### 2. Backend Changes
- Remove/disable subcontractor assignment endpoints
- Remove/disable vendor-related endpoints
- Add endpoints for stage documentation (teams, materials, media, documents)
- Update stage completion validation logic
- Keep ProjectRequest model but mark as deprecated (for future use)

### 3. Frontend - GC App Changes
- Remove subcontractor assignment UI
- Remove vendor dashboard/screens
- Add team member management UI per stage
- Add material tracking UI per stage
- Add media upload UI (photos/videos) per stage
- Add receipt/invoice upload UI per stage
- Update stage completion validation

### 4. Frontend - Homeowner App Changes
- Remove sub-GC/vendor references
- Enhance stage view to show teams, materials, media, receipts
- Add download/export functionality for receipts and reports

## Implementation Order
1. Database schema (new models)
2. Backend API endpoints (documentation management)
3. GC app UI (remove sub-GC/vendor, add documentation)
4. Homeowner app UI (enhanced stage views)
5. Cleanup (remove unused code)


