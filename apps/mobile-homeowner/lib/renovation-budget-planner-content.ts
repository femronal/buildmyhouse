export const renovationBudgetPlannerPageContent = {
  seo: {
    title: "Renovation Budget Planner | BuildMyHouse",
    description:
      "Estimate your renovation budget in Nigeria by room, work type, finish level, and location. A simple planning tool for diaspora homeowners who want to renovate with more control.",
    canonical: "https://buildmyhouse.app/tools/renovation-budget-planner",
    robots: "index, follow",
  },

  hero: {
    eyebrow: "FREE TOOL",
    title: "Renovation Budget Planner",
    description:
      "Get a rough idea of what your renovation in Nigeria may cost before the project starts expanding emotionally, stage by stage, and financially.",
    primaryCta: {
      label: "Estimate My Renovation Budget",
      href: "#planner",
    },
    secondaryCta: {
      label: "Start Your Renovation Project",
      href: "/projects/new?type=renovation",
    },
  },

  coverImage: {
    src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
    alt: "Modern home renovation planning scene with tools, interior finishes, and construction materials",
  },

  intro: {
    paragraphs: [
      "Many diaspora homeowners do not start with a bad renovation plan. They start with no real budget framework at all.",
      "They know they want to renovate the kitchen, bathrooms, roof, paint, maybe electricals, maybe plumbing, maybe ceilings, maybe exterior. But they do not know what those decisions are likely to mean financially before work begins.",
      "That is how many renovations in Nigeria start feeling small and end up becoming much bigger than expected.",
      "This planner helps you get a rough budget direction before money starts moving too casually.",
    ],
  },

  whatThisToolDoes: {
    title: "What this tool helps you do",
    items: [
      "Estimate renovation cost by room or space",
      "Separate lighter upgrades from deeper work",
      "Compare basic, mid-range, and premium finish levels",
      "See how location can affect cost",
      "Add contingency for hidden defects or surprises",
      "Get a clearer rough budget before speaking to contractors",
    ],
  },

  simpleExplanation: {
    title: "In simple terms",
    paragraphs: [
      "This tool helps you answer a simple question:",
      "If I want to renovate this house in Nigeria, roughly how much money should I prepare before the project starts stretching beyond control?",
      "It is not a final contractor quote. It is a planning tool to help you think with more sense before renovation decisions start multiplying.",
    ],
  },

  planner: {
    id: "planner",
    title: "Plan Your Renovation Budget",
    fields: [
      {
        name: "propertyType",
        label: "Property type",
        type: "select",
        options: ["Bungalow", "Duplex", "Flat/Apartment", "Family house", "Rental property"],
        required: true,
      },
      {
        name: "location",
        label: "Project location",
        type: "select",
        options: ["Lagos", "Abuja", "Other Nigeria"],
        required: true,
      },
      {
        name: "sizeBand",
        label: "Property size",
        type: "select",
        options: ["Small", "Medium", "Large"],
        required: true,
      },
      {
        name: "finishLevel",
        label: "Finish level",
        type: "select",
        options: ["Basic", "Mid-range", "Premium"],
        required: true,
      },
      {
        name: "contingencyPercentage",
        label: "Contingency percentage",
        type: "number",
        placeholder: "Example: 10",
        helpText:
          "This is money to keep aside for hidden defects, scope changes, material movement, or unexpected repairs.",
        required: true,
      },
    ],

    spaces: {
      title: "Choose the areas you want to renovate",
      options: [
        "Living room",
        "Kitchen",
        "Bathrooms",
        "Bedrooms",
        "Roofing/Ceiling",
        "Electrical",
        "Plumbing",
        "Windows/Doors",
        "Exterior",
        "Compound/Landscaping",
      ],
    },

    workTypePerSpace: {
      title: "Type of work in each selected area",
      options: ["Repairs", "Upgrade", "Full redo"],
      helpText:
        "Repairs means fixing what is bad. Upgrade means improving what is already there. Full redo means deeper work or starting that area almost afresh.",
    },
  },

  resultSection: {
    title: "Your Renovation Budget Estimate",
    description:
      "This section should show a simple room-by-room estimate and a total budget range the user can review, save, and share.",
    outputs: [
      "Property summary",
      "Selected spaces",
      "Work type per space",
      "Estimated cost per space",
      "Estimated subtotal",
      "Contingency amount",
      "Total estimated renovation budget",
      "High-cost warning areas",
    ],
  },

  summaryBox: {
    title: "Your Budget Summary",
    emptyState:
      "Your renovation budget estimate will appear here after you choose your property details, spaces, and work type.",
  },

  smartWarnings: {
    title: "Important reminders",
    items: [
      "This is a rough planning guide, not a final contractor quote",
      "Old houses can reveal hidden defects once work starts",
      "Kitchen, bathroom, roof, plumbing, and electrical work usually push costs up faster",
      "Lagos projects often cost more than many other states",
      "If the scope keeps expanding, your budget must be reviewed before you keep approving more work",
    ],
  },

  suggestedGuidance: {
    title: "Areas that usually consume more money",
    items: [
      "Kitchen",
      "Bathrooms",
      "Roofing and ceiling correction",
      "Electrical rewiring",
      "Plumbing correction",
      "Exterior structural fixes",
    ],
  },

  whyItMatters: {
    title: "Why this matters for Nigerians abroad",
    paragraphs: [
      "When you are abroad, renovation requests can start sounding urgent very quickly.",
      "One person says the bathroom needs more work. Another says the kitchen walls are bad. Another says the roof cannot wait. If you started with no rough budget structure, every new request starts sounding like the only thing that matters.",
      "A simple planner does not solve everything, but it gives you a better starting point.",
    ],
  },

  buildMyHouseFit: {
    title: "How this fits into BuildMyHouse",
    paragraphs: [
      "BuildMyHouse is designed around clearer scope, stage thinking, project visibility, and more disciplined decision-making.",
      "This budget planner is a public planning tool that helps you think more clearly before renovation starts, so later project tracking and payment control can make more sense.",
    ],
  },

  relatedResources: {
    title: "Helpful resources",
    links: [
      {
        label: "Download the renovation scope worksheet",
        href: "/downloads/remote-renovation-scope-worksheet",
      },
      {
        label: "Build a milestone payment schedule",
        href: "/tools/milestone-payment-schedule",
      },
      {
        label: "Renovate in Nigeria from abroad",
        href: "/diaspora/renovate-in-nigeria-from-abroad",
      },
      {
        label: "Lagos building permits and stage inspections",
        href: "/guides/lagos-building-permits-and-stage-inspections",
      },
    ],
  },

  cta: {
    title: "When you are ready, move from rough estimate to structured renovation",
    description:
      "Use this planner to get a budget direction first. Then use BuildMyHouse when you want clearer scope, stage tracking, communication, and more controlled renovation execution.",
    primary: {
      label: "Start Your Renovation Project",
      href: "/projects/new?type=renovation",
    },
    secondary: {
      label: "Download the Scope Worksheet",
      href: "/downloads/remote-renovation-scope-worksheet",
    },
  },

  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "Is this a final renovation quote?",
        answer:
          "No. This is a rough planning estimate to help you think clearly before the project starts.",
      },
      {
        question: "Why does location matter?",
        answer:
          "Because labour, logistics, and material realities can vary. Lagos and Abuja are often more expensive than many other locations.",
      },
      {
        question: "Why should I add contingency?",
        answer:
          "Because renovation can uncover hidden problems after work begins, especially in older properties.",
      },
      {
        question: "Which rooms usually cost more to renovate?",
        answer:
          "Kitchen, bathrooms, roofing, plumbing, and electrical work usually consume more money than lighter cosmetic areas.",
      },
      {
        question: "What should I do after using this planner?",
        answer:
          "Use it as your rough planning guide, then move into clearer scope planning, stage budgeting, and structured project execution.",
      },
    ],
  },

  faqSchema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this a final renovation quote?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. This is a rough planning estimate to help you think clearly before the project starts.",
        },
      },
      {
        "@type": "Question",
        name: "Why should I add contingency?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Because renovation can uncover hidden problems after work begins, especially in older properties.",
        },
      },
      {
        "@type": "Question",
        name: "Which rooms usually cost more to renovate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kitchen, bathrooms, roofing, plumbing, and electrical work usually consume more money than lighter cosmetic areas.",
        },
      },
    ],
  },
} as const;
