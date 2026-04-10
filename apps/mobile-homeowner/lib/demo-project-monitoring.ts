type DemoStageMaterial = {
  name: string;
  supplier: string;
  quantity: string;
  brand: string;
  price: number;
  imageUrl: string;
};

type DemoChatMessage = {
  sender: 'homeowner' | 'gc';
  message: string;
  date: string;
};

type DemoStageFile = {
  id: string;
  name: string;
  uploadedAt: string;
  previewImageUrl: string;
};

type DemoTeamMember = {
  name: string;
  role: string;
};

export type DemoStage = {
  id: string;
  order: number;
  name: string;
  duration: string;
  budget: number;
  status: 'in_progress' | 'locked';
  locked: boolean;
  paymentStatus?: string;
  completionRule?: string;
  materials?: DemoStageMaterial[];
  files?: DemoStageFile[];
  team?: DemoTeamMember[];
  chat?: DemoChatMessage[];
  notifications?: string[];
};

export type ProjectMonitoringDemoData = {
  project: {
    name: string;
    location: string;
    progressLabel: string;
  };
  stages: DemoStage[];
  trustPoints: string[];
};

export const projectMonitoringDemoData: ProjectMonitoringDemoData = {
  project: {
    name: "Daddy Obinna Redesign",
    location: "University of Lagos Cricket Oval, Ransome Kuti Road, Shomolu, Lagos State, Nigeria",
    progressLabel: "0/6 Complete",
  },

  stages: [
    {
      id: "stage-1",
      order: 1,
      name: "Site Preparation & Foundation",
      duration: "2 months",
      budget: 330000,
      status: "in_progress",
      locked: false,
      paymentStatus: "approved_work_in_progress",
      completionRule:
        "GC executes stage work. Homeowner follows progress and satisfaction is confirmed before stage completion/payment flow continues.",
      materials: [
        {
          name: "Cement",
          supplier: "Mr Adewale Cements Store",
          quantity: "50 bags",
          brand: "Dangote",
          price: 500000,
          imageUrl:
            "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=60",
        },
        {
          name: "Transportation",
          supplier: "Mr Stevens of GiG",
          quantity: "5 pieces",
          brand: "God Is Good Trucks",
          price: 150000,
          imageUrl:
            "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=60",
        },
      ],
      files: [
        {
          id: "file-1",
          name: "Foundation Layout Drawing.png",
          uploadedAt: "Apr 5",
          previewImageUrl:
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=60",
        },
        {
          id: "file-2",
          name: "Permit Acknowledgement.pdf",
          uploadedAt: "Apr 5",
          previewImageUrl:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=60",
        },
      ],
      team: [
        { name: "Adewale A.", role: "GC" },
        { name: "Fatima O.", role: "Site Supervisor" },
      ],
      chat: [
        {
          sender: "homeowner",
          message: "Hello, when are we starting?",
          date: "Apr 5",
        },
        {
          sender: "gc",
          message: "We have started already by getting the necessary permits from",
          date: "Apr 5",
        },
        {
          sender: "gc",
          message: "the local government.",
          date: "Apr 5",
        },
        {
          sender: "homeowner",
          message: "Okay",
          date: "Apr 5",
        },
      ],
      notifications: [
        "New item added to Site Preparation & Foundation",
        "New chat message from your GC",
        "Payment approved. Work in progress",
      ],
    },

    {
      id: "stage-2",
      order: 2,
      name: "Framing & Structural",
      duration: "6–8 weeks",
      budget: 440000,
      status: "locked",
      locked: true,
    },
    {
      id: "stage-3",
      order: 3,
      name: "Rough-in (MEP)",
      duration: "4–5 weeks",
      budget: 400000,
      status: "locked",
      locked: true,
    },
    {
      id: "stage-4",
      order: 4,
      name: "Insulation & Drywall",
      duration: "3–4 weeks",
      budget: 300000,
      status: "locked",
      locked: true,
    },
    {
      id: "stage-5",
      order: 5,
      name: "Interior Finishes",
      duration: "6–8 weeks",
      budget: 550000,
      status: "locked",
      locked: true,
    },
    {
      id: "stage-6",
      order: 6,
      name: "Exterior & Landscaping",
      duration: "3–4 weeks",
      budget: 220000,
      status: "locked",
      locked: true,
    },
  ],

  trustPoints: [
    "Each stage is visible and ordered clearly",
    "The GC adds items and updates inside the active stage",
    "The homeowner receives notifications when something changes",
    "Chat is tied to the project workflow",
    "The homeowner influences payment progression through satisfaction confirmation",
  ],
};

