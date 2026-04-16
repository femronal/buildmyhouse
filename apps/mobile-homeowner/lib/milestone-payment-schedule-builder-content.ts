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
      "Plan how money should be released stage by stage during your building or renovation project in Nigeria, so you do not keep sending money because of pressure, sweet talk, or confusion.",
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
      "Many Nigerians abroad do not lose money only because a project is bad. They lose money because they release payment too early.",
      "This tool helps you build a simple stage-by-stage payment plan showing what comes next, how much to pay, what proof of work to request, and how much money should still remain under your control.",
      "It is not a legal contract. It is a practical planning tool to help you think clearly before money starts moving.",
    ],
  },

  whatThisToolDoes: {
    title: "What this tool helps you do",
    items: [
      "Break your project into payment stages",
      "Assign money to each stage clearly",
      "Add a contingency buffer for unexpected changes",
      "Decide what proof of work should come before payment",
      "Reduce pressure-based payment requests",
      "Think clearly before releasing money for the next stage",
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
        label: "Total project budget (overall money for this project)",
        type: "number",
        placeholder: "Enter your full project budget",
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
        label: "How do you want to set stage payments?",
        type: "select",
        options: ["Percentage by stage", "Amount by stage"],
        required: true,
      },
      {
        name: "contingencyPercentage",
        label: "Contingency percentage (money to keep aside for surprises)",
        type: "number",
        placeholder: "Example: 10",
        helpText:
          "This is the percentage you want to keep aside for hidden defects, price changes, or extra work you did not expect at first.",
        required: true,
      },
    ],

    stageFields: {
      title: "Stage-by-stage details",
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
          label: "Money for this stage",
          type: "number",
          placeholder: "Enter percentage or amount for this stage",
          required: true,
        },
        {
          name: "proofRequired",
          label: "Proof required before payment",
          type: "multiselect",
          options: [
            "Photos/Videos",
            "Material list",
            "Stage explanation",
            "Progress update",
            "Homeowner satisfaction confirmed",
            "Receipts/Invoices",
            "Artisan lists",
          ],
          required: true,
        },
        {
          name: "notes",
          label: "Notes for this stage (optional)",
          type: "textarea",
          placeholder: "Example: Do not release this payment until foundation digging, concrete work, and site photos are confirmed.",
          required: false,
        },
      ],
    },
  },

  resultSection: {
    title: "Your Payment Schedule",
    description:
      "This section shows your stage payment plan in a clear format you can review, save, and share.",
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
    "Money for this stage",
    "Proof of work before payment",
    "Notes",
    "Total paid so far",
    "Money left after this payment",
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
        "Wall/Ceiling Preparation",
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
