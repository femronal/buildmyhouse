export const milestonePaymentScheduleBuilderPageContent = {
  seo: {
    title: "Milestone Payment Schedule Builder | BuildMyHouse",
    description:
      "Create a simple stage-by-stage payment plan for building or renovating in Nigeria. Control when to pay, what proof to request, and how much buffer to keep for unexpected changes.",
    canonical: "https://buildmyhouse.app/tools/milestone-payment-schedule",
    robots: "index, follow",
  },

  hero: {
    eyebrow: "FREE TOOL",
    title: "Milestone Payment Schedule Builder",
    description:
      "Plan how money should be released stage by stage during your building or renovation project in Nigeria, so you do not keep paying based on pressure, sweet talk, or confusion.",
    primaryCta: {
      label: "Build My Payment Plan",
      href: "#builder",
    },
    secondaryCta: {
      label: "Start a Tracked Project",
      href: "/projects/new",
    },
  },

  intro: {
    paragraphs: [
      "Many diaspora homeowners do not lose money only because a project is bad. They lose money because they pay too early.",
      "This tool helps you create a simple payment schedule that says what stage comes next, how much should be paid at that stage, what proof should exist before payment, and how much money should still remain under your control.",
      "It is not a legal contract. It is a planning tool to help you think with more discipline before money starts moving.",
    ],
  },

  whatThisToolDoes: {
    title: "What this tool helps you do",
    items: [
      "Break your project into payment stages",
      "Assign money to each stage clearly",
      "Add a contingency buffer for unexpected changes",
      "Decide what proof should come before payment",
      "Reduce pressure-based payments",
      "Think more clearly before releasing the next tranche of money",
    ],
  },

  simpleExplanation: {
    title: "In simple terms",
    paragraphs: [
      "This tool helps you answer one important question:",
      "When exactly should I pay, how much should I pay, and what must I see before I pay it?",
      "That way, you are not just sending money because the site looks busy or because someone says, 'we need to move fast.'",
    ],
  },

  builder: {
    id: "builder",
    title: "Build Your Payment Plan",
    fields: [
      {
        name: "projectType",
        label: "Project type",
        type: "select",
        options: ["New build", "Renovation", "Interior design"],
        required: true,
      },
      {
        name: "totalBudget",
        label: "Total project budget",
        type: "number",
        placeholder: "Enter total budget",
        required: true,
      },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        options: ["NGN", "USD", "GBP", "CAD", "EUR"],
        required: true,
      },
      {
        name: "stageCount",
        label: "Number of stages",
        type: "select",
        options: ["3", "4", "5", "6", "7", "8"],
        required: true,
      },
      {
        name: "paymentMode",
        label: "How do you want to assign stage payments?",
        type: "select",
        options: ["Percentage by stage", "Amount by stage"],
        required: true,
      },
      {
        name: "contingencyPercentage",
        label: "Buffer / contingency percentage for unexpected changes",
        type: "number",
        placeholder: "Example: 10",
        helpText:
          "This is the extra percentage you want to reserve for changes, hidden defects, price movement, or unexpected work.",
        required: true,
      },
    ],

    stageFields: {
      title: "Stage details",
      fields: [
        {
          name: "stageName",
          label: "Stage name",
          type: "text",
          placeholder: "Example: Foundation or Bathroom Repairs",
          required: true,
        },
        {
          name: "stageValue",
          label: "Stage payment value",
          type: "number",
          placeholder: "Enter percentage or amount",
          required: true,
        },
        {
          name: "proofRequired",
          label: "Proof required before payment",
          type: "multiselect",
          options: [
            "Photos",
            "Videos",
            "Material list",
            "Stage explanation",
            "Progress update",
            "Homeowner satisfaction confirmed",
          ],
          required: true,
        },
        {
          name: "notes",
          label: "Notes for this stage",
          type: "textarea",
          placeholder: "Optional notes about what must be true before payment",
          required: false,
        },
      ],
    },
  },

  resultSection: {
    title: "Your Payment Schedule",
    description:
      "This section should generate a simple, readable payment plan the user can review, screenshot, or print.",
    outputs: [
      "Project type summary",
      "Total budget",
      "Contingency amount",
      "Usable stage budget after contingency",
      "Stage-by-stage payment table",
      "Proof required before each stage payment",
      "Total allocated amount",
      "Total reserved contingency",
      "Remaining amount after each stage",
    ],
  },

  paymentTableColumns: [
    "Stage",
    "Stage payment",
    "Proof required before payment",
    "Notes",
    "Running total paid",
    "Amount remaining",
  ],

  smartWarnings: {
    title: "Important reminders",
    items: [
      "Do not pay for the next stage just because work is ongoing",
      "If the current stage is not genuinely complete, do not move forward",
      "Contingency money is not free money for random extra requests",
      "If scope changes, review the payment schedule before approving more money",
      "The safest payment plan is the one tied to proof, not pressure",
    ],
  },

  suggestedDefaults: {
    title: "Suggested default stage examples",
    byProjectType: {
      "New build": [
        "Site Preparation & Foundation",
        "Framing & Structural",
        "Rough-in (MEP)",
        "Insulation & Drywall",
        "Interior Finishes",
        "Exterior & Landscaping",
      ],
      Renovation: [
        "Inspection & Strip-out",
        "Repairs & Corrections",
        "Systems Work",
        "Surface Preparation",
        "Finishes & Fittings",
        "Final Checks & Handover",
      ],
      "Interior design": [
        "Planning & Measurement",
        "Procurement",
        "Preparation Works",
        "Installation",
        "Styling & Finishing",
      ],
    },
  },

  whyItMatters: {
    title: "Why this matters for Nigerians abroad",
    paragraphs: [
      "When you are abroad, it is easy for payment requests to come with urgency, family pressure, or emotional language.",
      "A payment schedule gives you something more solid to stand on. Instead of asking, 'Should I send money now?' you can ask, 'Has the current stage earned this payment yet?'",
      "That one shift can save a lot of confusion.",
    ],
  },

  buildMyHouseFit: {
    title: "How this fits into BuildMyHouse",
    paragraphs: [
      "BuildMyHouse is built around stage-based project thinking, clearer communication, notifications, and payment discipline.",
      "This tool is a public planning version of that mindset. It helps you think more clearly before the project begins, and it prepares you for a more structured way of managing progress later.",
    ],
  },

  relatedResources: {
    title: "Helpful resources",
    links: [
      {
        label: "Build in Nigeria from abroad",
        href: "/diaspora/build-in-nigeria-from-abroad",
      },
      {
        label: "Renovate in Nigeria from abroad",
        href: "/diaspora/renovate-in-nigeria-from-abroad",
      },
      {
        label: "Lagos building permits and stage inspections",
        href: "/guides/lagos-building-permits-and-stage-inspections",
      },
      {
        label: "See how remote monitoring works",
        href: "/demo/project-monitoring",
      },
    ],
  },

  cta: {
    title: "When you are ready, move from planning to tracked execution",
    description:
      "Use this builder to create your payment plan. Then use BuildMyHouse when you want clearer stage tracking, project communication, and a more controlled payment flow.",
    primary: {
      label: "Start a Tracked Project",
      href: "/projects/new",
    },
    secondary: {
      label: "See How Remote Monitoring Works",
      href: "/demo/project-monitoring",
    },
  },

  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What is a milestone payment schedule?",
        answer:
          "It is a stage-by-stage plan that says when money should be paid, how much should be paid, and what proof should come before payment.",
      },
      {
        question: "Why should I keep a contingency buffer?",
        answer:
          "Because building and renovation projects in Nigeria can face hidden defects, scope changes, or price movement. A contingency buffer helps you plan for that instead of panicking later.",
      },
      {
        question: "Should I pay the next stage if the current stage is still ongoing?",
        answer:
          "No. If the current stage is not genuinely complete, do not proceed casually to the next payment.",
      },
      {
        question: "Can this tool replace a contract?",
        answer:
          "No. It is a planning and discipline tool. It helps you think clearly about stage payments, but it is not a full legal contract.",
      },
      {
        question: "What should I do after generating my schedule?",
        answer:
          "Use it to guide your project planning, then move into a more structured workflow where stages, communication, and payment logic stay visible throughout the project.",
      },
    ],
  },

  faqSchema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a milestone payment schedule?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It is a stage-by-stage plan that says when money should be paid, how much should be paid, and what proof should come before payment.",
        },
      },
      {
        "@type": "Question",
        name: "Why should I keep a contingency buffer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Because building and renovation projects in Nigeria can face hidden defects, scope changes, or price movement. A contingency buffer helps you plan for that instead of panicking later.",
        },
      },
      {
        "@type": "Question",
        name: "Should I pay the next stage if the current stage is still ongoing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. If the current stage is not genuinely complete, do not proceed casually to the next payment.",
        },
      },
    ],
  },
} as const;
