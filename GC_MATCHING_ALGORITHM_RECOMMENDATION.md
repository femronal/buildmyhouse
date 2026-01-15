# GC Matching Algorithm Recommendation

## Executive Summary

**Recommended Approach**: **Weighted Multi-Factor Scoring Algorithm** (Enhanced version of your current implementation)

**Not Recommended**: Uber's dispatch algorithm (too different use case)

---

## Why NOT Uber's Algorithm?

### Uber's Algorithm Characteristics:
- **Real-time dispatch**: Matches nearest available driver immediately
- **Single assignment**: One rider → One driver (automatic)
- **Proximity-first**: Distance is the primary factor
- **Time-sensitive**: Driver must accept within seconds
- **High volume, low consideration time**

### Why It Doesn't Fit GC Matching:

1. **Not Real-Time**: Homeowners can wait days/weeks for GC responses
2. **Multiple Options Needed**: Homeowners should see multiple GCs and choose
3. **Multi-Factor Decision**: Not just location - specialty, budget, experience, ratings
4. **GCs Can Reject**: Unlike Uber, GCs review and accept/reject projects
5. **Long-term Relationship**: Projects last months/years, not a 15-minute ride

---

## Recommended Algorithm: Enhanced Weighted Scoring System

### Current Implementation (Good Foundation)
Your current algorithm in `contractors.service.ts` already uses weighted scoring:
- Base score: 70
- Location match: +15 (city) / +10 (state)
- High rating: +5 (4.9+) / +3 (4.7+)
- Experience: +5 (80+ projects) / +3 (50+)
- Verified: +5

### Recommended Enhancements

#### 1. **Additional Matching Factors**

```typescript
// Enhanced scoring factors
interface MatchingFactors {
  // Current factors (keep these)
  location: number;        // 0-25 points (city + state)
  rating: number;          // 0-15 points (rating-based)
  experience: number;      // 0-10 points (project count)
  verified: number;        // 0-5 points
  
  // NEW factors to add
  specialtyMatch: number;  // 0-20 points (residential/commercial match)
  budgetFit: number;       // 0-15 points (GC's typical project size)
  availability: number;    // 0-10 points (current workload)
  responseRate: number;    // 0-5 points (acceptance rate)
  avgProjectDuration: number; // 0-5 points (on-time completion)
}
```

#### 2. **Project Type/Specialty Matching**

Extract from AI analysis:
- Project type (residential, commercial, industrial)
- Project size (sq ft, floors)
- Special requirements (luxury, eco-friendly, etc.)

Match against GC's specialty and past projects.

#### 3. **Budget Range Matching**

```typescript
// GC's typical project range vs project budget
const budgetFit = (gcMinBudget, gcMaxBudget, projectBudget) => {
  if (projectBudget >= gcMinBudget && projectBudget <= gcMaxBudget) {
    return 15; // Perfect fit
  } else if (projectBudget >= gcMinBudget * 0.8 && projectBudget <= gcMaxBudget * 1.2) {
    return 10; // Good fit
  } else if (projectBudget >= gcMinBudget * 0.5) {
    return 5; // Acceptable
  }
  return 0; // Not a fit
};
```

#### 4. **Availability/Workload Score**

```typescript
// Check GC's current active projects
const availabilityScore = (activeProjects: number) => {
  if (activeProjects < 3) return 10;      // Very available
  if (activeProjects < 5) return 7;       // Available
  if (activeProjects < 8) return 4;       // Moderate
  return 0;                                // Overloaded
};
```

#### 5. **Response Rate Score**

Track GC's acceptance rate:
```typescript
const responseRate = (acceptedRequests / totalRequests) * 100;
// Higher acceptance rate = better score
```

#### 6. **Distance Calculation (Haversine Formula)**

For precise location matching:
```typescript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Score based on distance
const distanceScore = (distance) => {
  if (distance < 10) return 25;    // Same city
  if (distance < 25) return 15;    // Nearby
  if (distance < 50) return 10;    // Regional
  return 5;                         // Further away
};
```

---

## Algorithm Implementation Strategy

### Phase 1: Enhanced Scoring (Immediate)
1. Add specialty matching from AI analysis
2. Add budget range matching
3. Improve location matching with coordinates
4. Add availability scoring

### Phase 2: ML-Based Recommendations (Future)
Once you have enough data:
- Use **collaborative filtering** (GCs who worked on similar projects)
- Use **content-based filtering** (project features → GC expertise)
- Train a **gradient boosting model** (XGBoost/LightGBM) to predict match quality

### Phase 3: Real-Time Optimization (Advanced)
- **A/B testing** different scoring weights
- **Multi-armed bandit** to optimize GC recommendations
- **Reinforcement learning** to improve matching over time

---

## Alternative Algorithms to Consider

### 1. **Content-Based Filtering**
- Match project features (size, type, budget) with GC expertise
- Good for: Cold start, niche projects
- Implementation: Cosine similarity between project vectors and GC profile vectors

### 2. **Collaborative Filtering**
- "GCs who worked on similar projects also worked on this type"
- Good for: When you have lots of historical data
- Implementation: Item-based collaborative filtering

### 3. **Hybrid Approach** (Best long-term)
- Combine content-based + collaborative + weighted scoring
- Fallback to weighted scoring when data is sparse
- Use ML when you have sufficient data

---

## Recommended Next Steps

1. **Immediate**: Enhance current scoring with specialty + budget matching
2. **Short-term**: Add availability tracking and response rate metrics
3. **Medium-term**: Implement distance-based scoring with coordinates
4. **Long-term**: Build ML model for personalized recommendations

---

## Code Structure Recommendation

```typescript
class GCMatchingService {
  // Primary matching method
  async matchGCs(projectId: string, limit: number = 5): Promise<ScoredGC[]> {
    const project = await this.getProject(projectId);
    const candidates = await this.getCandidates(project);
    const scored = candidates.map(gc => this.calculateMatchScore(project, gc));
    return this.rankAndLimit(scored, limit);
  }
  
  // Scoring engine
  calculateMatchScore(project: Project, gc: Contractor): Score {
    return {
      location: this.scoreLocation(project, gc),
      specialty: this.scoreSpecialty(project, gc),
      budget: this.scoreBudget(project, gc),
      rating: this.scoreRating(gc),
      experience: this.scoreExperience(gc),
      availability: this.scoreAvailability(gc),
      responseRate: this.scoreResponseRate(gc),
      total: 0 // Sum all scores
    };
  }
  
  // Individual scoring functions
  scoreLocation(project, gc): number { /* ... */ }
  scoreSpecialty(project, gc): number { /* ... */ }
  scoreBudget(project, gc): number { /* ... */ }
  // ... etc
}
```

---

## Conclusion

**Start with Enhanced Weighted Scoring** (Phase 1)
- Builds on your existing code
- Easy to implement and iterate
- Transparent and explainable to users
- Can evolve into ML-based system later

**Don't use Uber's algorithm** - it's designed for a fundamentally different problem.

