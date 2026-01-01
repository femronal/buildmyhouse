# Construction Phases JSON Format

When entering construction phases in the GC app's plan upload form, use the following JSON format:

## Format 1: Direct Array (Recommended)

```json
[
  {
    "name": "Planning and Design",
    "description": "Concept development, architectural design, engineering studies, and feasibility planning.",
    "estimatedDuration": "2-3 months",
    "estimatedCost": 50000
  },
  {
    "name": "Site Preparation and Excavation",
    "description": "Land clearing, excavation, dewatering, and preparation for deep foundations.",
    "estimatedDuration": "1 month",
    "estimatedCost": 30000
  },
  {
    "name": "Foundation and Piling",
    "description": "Installation of deep reinforced concrete piles and construction of the mat foundation.",
    "estimatedDuration": "2 months",
    "estimatedCost": 80000
  },
  {
    "name": "Structural Core Construction",
    "description": "Construction of the reinforced concrete core and floor plates.",
    "estimatedDuration": "6-8 months",
    "estimatedCost": 200000
  },
  {
    "name": "Exterior Cladding",
    "description": "Installation of glass, aluminum, and stainless-steel façade panels.",
    "estimatedDuration": "4-6 months",
    "estimatedCost": 150000
  }
]
```

## Format 2: Nested Object (Also Supported)

```json
{
  "construction_phases": [
    {
      "name": "Planning and Design",
      "description": "Concept development and architectural design",
      "estimatedDuration": "2-3 months",
      "estimatedCost": 50000
    },
    {
      "name": "Foundation",
      "description": "Foundation construction",
      "estimatedDuration": "2 months",
      "estimatedCost": 80000
    }
  ]
}
```

## Field Descriptions

Each phase object must contain:

- **`name`** (string, required): The name of the construction phase
  - Alternative field names accepted: `phase_name`, `phaseName`
  
- **`description`** (string, required): Detailed description of what happens in this phase
  
- **`estimatedDuration`** (string, required): How long this phase is expected to take
  - Format examples: "2-3 months", "6 weeks", "1-2 months"
  - Alternative field names accepted: `time_period`, `timePeriod`
  
- **`estimatedCost`** (number, required): Estimated cost for this phase in the currency unit (typically USD)
  - Must be a number (not a string)
  - Alternative field names accepted: `estimated_cost`

## Example for Small Residential Project

```json
[
  {
    "name": "Site Preparation",
    "description": "Clearing, grading, and preparing the site for construction",
    "estimatedDuration": "1-2 weeks",
    "estimatedCost": 5000
  },
  {
    "name": "Foundation",
    "description": "Excavation and pouring of concrete foundation",
    "estimatedDuration": "2-3 weeks",
    "estimatedCost": 15000
  },
  {
    "name": "Framing",
    "description": "Structural framing of walls, floors, and roof",
    "estimatedDuration": "3-4 weeks",
    "estimatedCost": 25000
  },
  {
    "name": "Electrical and Plumbing",
    "description": "Rough-in of electrical wiring and plumbing systems",
    "estimatedDuration": "2-3 weeks",
    "estimatedCost": 18000
  },
  {
    "name": "Insulation and Drywall",
    "description": "Installation of insulation and drywall",
    "estimatedDuration": "2 weeks",
    "estimatedCost": 12000
  },
  {
    "name": "Interior Finishing",
    "description": "Paint, flooring, fixtures, and final touches",
    "estimatedDuration": "4-6 weeks",
    "estimatedCost": 30000
  },
  {
    "name": "Exterior Finishing",
    "description": "Siding, roofing, windows, and exterior paint",
    "estimatedDuration": "3-4 weeks",
    "estimatedCost": 25000
  },
  {
    "name": "Final Inspection and Handover",
    "description": "Final inspections, cleaning, and project handover",
    "estimatedDuration": "1 week",
    "estimatedCost": 2000
  }
]
```

## Important Notes

1. **JSON must be valid**: Make sure all brackets, braces, and quotes are properly closed
2. **Numbers not strings**: `estimatedCost` must be a number (e.g., `50000` not `"50000"`)
3. **All fields required**: Each phase object must have all four fields
4. **Array format**: The phases should be in an array `[...]` not just objects

## Quick Copy Template

```json
[
  {
    "name": "Phase 1 Name",
    "description": "Description of what happens in this phase",
    "estimatedDuration": "X months/weeks",
    "estimatedCost": 0
  },
  {
    "name": "Phase 2 Name",
    "description": "Description of what happens in this phase",
    "estimatedDuration": "X months/weeks",
    "estimatedCost": 0
  }
]
```

