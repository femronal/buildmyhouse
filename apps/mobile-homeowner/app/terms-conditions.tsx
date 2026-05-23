import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { cardShadowStyle } from "@/lib/card-styles";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-lg text-black mb-3" style={{ fontFamily: "Poppins_700Bold" }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function TermsConditionsScreen() {
  const router = useRouter();
  const sections: Array<{ title: string; body: string }> = [
    {
      title: "BuildMyHouse Terms of Service & Platform Policies",
      body: "Last Updated: May 2026\n\nThese Terms of Service and Platform Policies (\"Terms\") govern the use of BuildMyHouse by all users, including homeowners, property owners, clients, contractors, subcontractors, interior designers, renovation specialists, consultants, and all other users accessing the platform.\n\nBy accessing, registering for, or using BuildMyHouse, you agree to be legally bound by these Terms.",
    },
    {
      title: "PART A — HOMEOWNER TERMS & POLICIES",
      body: "",
    },
    {
      title: "1. Overview",
      body: "BuildMyHouse (\"BMH\", \"we\", \"our\", or \"the Platform\") is a remote property project management and coordination platform that helps users manage property-related work in Nigeria through structured workflows, verified contractor access, stage-based approvals, communication tools, and project monitoring systems.\n\nBuildMyHouse is not:\n- a construction company,\n- an engineering consultancy,\n- an architecture firm,\n- an insurer,\n- a financial institution,\n- or a direct employer of contractors.\n\nBuildMyHouse provides software, operational coordination tools, verification systems, communication systems, and project management workflows intended to improve visibility, structure, accountability, and remote execution.",
    },
    {
      title: "2. Eligibility",
      body: "To use BuildMyHouse as a homeowner or property client, you must:\n- be at least 18 years old,\n- have the legal authority to manage or commission property work,\n- provide accurate registration information,\n- maintain updated contact information,\n- and comply with all applicable laws.\n\nBuildMyHouse reserves the right to suspend or terminate accounts containing false, misleading, incomplete, or fraudulent information.",
    },
    {
      title: "3. Nature of the Platform",
      body: "BuildMyHouse helps homeowners:\n- request repair, renovation, interior, or construction projects,\n- receive contractor matches,\n- monitor project stages,\n- communicate with contractors,\n- approve milestones,\n- upload project-related materials,\n- and manage payments tied to stage progression.\n\nBuildMyHouse does not guarantee:\n- project profitability,\n- specific investment returns,\n- property appreciation,\n- exact timelines,\n- or uninterrupted project execution.\n\nAll construction, repair, renovation, and property-related work inherently carries risk.",
    },
    {
      title: "4. Contractor Verification Disclaimer",
      body: "BuildMyHouse may verify contractors through:\n- identity checks,\n- business documentation,\n- interviews,\n- portfolio reviews,\n- references,\n- certifications,\n- and platform activity.\n\nHowever, verification does not constitute:\n- a warranty,\n- insurance coverage,\n- legal endorsement,\n- engineering certification,\n- or a guarantee of performance.\n\nHomeowners acknowledge that all projects involve independent third parties and real-world operational variables.",
    },
    {
      title: "5. Project Scope & Stage-Based Workflow",
      body: "BuildMyHouse uses a structured stage-based workflow system.\n\nUsers agree that:\n- project stages must be clearly defined,\n- approvals should occur per stage,\n- payments should correspond to approved milestones,\n- and work progression may be paused pending approvals, clarification, disputes, or operational review.\n\nBuildMyHouse strongly recommends that homeowners do not release funds outside approved workflows.",
    },
    {
      title: "6. Payment Terms",
      body: "By using BuildMyHouse:\n- homeowners authorize payment processing through approved payment providers,\n- homeowners agree that platform fees may apply,\n- homeowners acknowledge that refunds may not be automatic,\n- and homeowners understand that approved payments may become irreversible once released to contractors.\n\nBuildMyHouse may hold, delay, review, or suspend payments where:\n- fraud is suspected,\n- disputes arise,\n- stage evidence is incomplete,\n- suspicious activity occurs,\n- or platform policies are violated.\n\nBuildMyHouse reserves the right to introduce escrow, milestone holding systems, verification holds, or dispute review processes.",
    },
    {
      title: "7. Site Inspections & Physical Access",
      body: "Homeowners acknowledge that:\n- physical inspections may be required,\n- contractors may need access to the property,\n- site conditions may affect pricing or timelines,\n- and project estimates may change after inspection.\n\nHomeowners are responsible for:\n- securing lawful access to the property,\n- ensuring safe working conditions,\n- and providing accurate project information.",
    },
    {
      title: "8. Communication Policy",
      body: "All users agree to communicate respectfully and professionally.\n\nUsers may not:\n- harass,\n- threaten,\n- abuse,\n- discriminate against,\n- impersonate,\n- or manipulate other users.\n\nBuildMyHouse reserves the right to monitor platform communications for:\n- fraud prevention,\n- trust and safety,\n- dispute resolution,\n- moderation,\n- and operational quality assurance.",
    },
    {
      title: "9. Off-Platform Transactions",
      body: "Homeowners acknowledge that BuildMyHouse's systems, protections, monitoring tools, and support processes apply primarily to projects managed through the platform.\n\nBuildMyHouse shall not be responsible for:\n- private side agreements,\n- direct off-platform payments,\n- external arrangements,\n- or informal transactions outside platform workflows.\n\nUsers understand that bypassing platform systems may reduce or eliminate eligibility for support, moderation, dispute review, or operational assistance.",
    },
    {
      title: "10. Project Delays & Operational Risk",
      body: "Homeowners acknowledge that projects may experience delays due to:\n- weather,\n- supply chain interruptions,\n- material shortages,\n- labor availability,\n- permit issues,\n- inspection outcomes,\n- government actions,\n- security concerns,\n- site conditions,\n- or unforeseen circumstances.\n\nBuildMyHouse does not guarantee uninterrupted or delay-free execution.",
    },
    {
      title: "11. Disputes",
      body: "Where disputes arise between homeowners and contractors, BuildMyHouse may:\n- review communications,\n- examine uploaded evidence,\n- request additional documentation,\n- temporarily pause workflows,\n- restrict platform actions,\n- or recommend resolution pathways.\n\nBuildMyHouse reserves discretion regarding:\n- platform moderation,\n- trust and safety decisions,\n- account restrictions,\n- or operational intervention.\n\nBuildMyHouse is not obligated to act as a formal court, arbitrator, or legal adjudicator.",
    },
    {
      title: "12. Intellectual Property",
      body: "All BuildMyHouse branding, systems, workflows, interfaces, software, content, operational methods, and designs remain the intellectual property of BuildMyHouse.\n\nUsers may not:\n- copy,\n- reverse engineer,\n- resell,\n- reproduce,\n- or exploit platform systems without written authorization.",
    },
    {
      title: "13. Privacy & Data Usage",
      body: "By using BuildMyHouse, homeowners consent to the collection and processing of:\n- account information,\n- project data,\n- uploaded files,\n- communications,\n- payment-related information,\n- and operational records.\n\nData may be used for:\n- project coordination,\n- trust and safety,\n- verification,\n- analytics,\n- fraud prevention,\n- customer support,\n- and service improvement.\n\nBuildMyHouse will take commercially reasonable measures to protect user data but cannot guarantee absolute security.",
    },
    {
      title: "14. Account Suspension & Termination",
      body: "BuildMyHouse reserves the right to suspend, restrict, or terminate accounts where users:\n- violate platform rules,\n- engage in fraud,\n- abuse contractors or staff,\n- manipulate payment systems,\n- upload false information,\n- or create operational, legal, or safety risks.",
    },
    {
      title: "15. Limitation of Liability",
      body: "To the maximum extent permitted by law, BuildMyHouse shall not be liable for:\n- indirect damages,\n- lost profits,\n- project losses,\n- construction defects,\n- contractor negligence,\n- site accidents,\n- property damage,\n- emotional distress,\n- or investment losses.\n\nUse of the platform is at the user's own risk.",
    },
    {
      title: "16. Governing Law",
      body: "These Terms shall be governed by and interpreted under the laws of the Federal Republic of Nigeria.",
    },
    {
      title: "PART B — GENERAL CONTRACTOR TERMS & POLICIES",
      body: "",
    },
    {
      title: "1. Overview",
      body: "These terms govern all contractors, builders, artisans, renovation specialists, interior designers, consultants, subcontractors, and service providers (\"General Contractors\" or \"GCs\") using BuildMyHouse.\n\nBy registering as a GC, you agree to comply with all BuildMyHouse operational standards, trust policies, communication requirements, verification procedures, and platform rules.",
    },
    {
      title: "2. Independent Contractor Relationship",
      body: "General Contractors using BuildMyHouse are independent service providers.\n\nNothing in these Terms creates:\n- employment,\n- partnership,\n- agency,\n- joint venture,\n- or franchise relationships between BuildMyHouse and contractors.\n\nContractors remain solely responsible for:\n- labor,\n- workmanship,\n- taxes,\n- licensing,\n- insurance,\n- permits,\n- subcontractors,\n- compliance,\n- and operational execution.",
    },
    {
      title: "3. Verification Requirements",
      body: "To access projects, contractors may be required to submit:\n- government-issued identification,\n- CAC registration,\n- tax documentation,\n- certifications,\n- insurance records,\n- business information,\n- references,\n- portfolio evidence,\n- and additional documentation requested by BuildMyHouse.\n\nBuildMyHouse may:\n- approve,\n- reject,\n- suspend,\n- or revoke verification status at its discretion.\n\nVerification status may change based on:\n- project performance,\n- disputes,\n- complaints,\n- safety concerns,\n- communication quality,\n- documentation issues,\n- or policy violations.",
    },
    {
      title: "4. Contractor Responsibilities",
      body: "General Contractors agree to:\n- provide accurate information,\n- communicate professionally,\n- complete stages honestly,\n- upload truthful progress evidence,\n- respect project scope,\n- avoid misleading homeowners,\n- comply with timelines reasonably,\n- and maintain professional conduct.\n\nContractors may not:\n- falsify updates,\n- pressure homeowners for unauthorized payments,\n- manipulate stage approvals,\n- submit fraudulent documentation,\n- or misrepresent qualifications.",
    },
    {
      title: "5. Platform Conduct Standards",
      body: "Contractors acknowledge that BuildMyHouse operates through structured workflows.\n\nContractors agree that:\n- stages must be clearly defined,\n- milestone requests must reflect actual progress,\n- evidence uploads should accurately reflect current site conditions,\n- and homeowners must have reasonable visibility into work progression.\n\nBuildMyHouse may review:\n- uploaded photos,\n- videos,\n- stage submissions,\n- communications,\n- and operational behavior.",
    },
    {
      title: "6. Project Acceptance",
      body: "BuildMyHouse does not guarantee:\n- project assignments,\n- revenue,\n- minimum earnings,\n- or project volume.\n\nProject matching may depend on:\n- location,\n- specialization,\n- verification status,\n- homeowner preferences,\n- platform ratings,\n- availability,\n- responsiveness,\n- and historical performance.",
    },
    {
      title: "7. Payments & Fees",
      body: "Contractors agree that:\n- BuildMyHouse may charge platform fees,\n- payouts may be delayed for review,\n- milestone payments may require homeowner approval,\n- and payment release may depend on compliance with platform procedures.\n\nBuildMyHouse reserves the right to:\n- hold payments,\n- reverse pending disbursements,\n- investigate suspicious activity,\n- or suspend financial activity where fraud or disputes are suspected.",
    },
    {
      title: "8. Off-Platform Solicitation",
      body: "Contractors may not:\n- aggressively solicit homeowners away from the platform,\n- pressure users into untracked payments,\n- or deliberately bypass BuildMyHouse systems after platform introductions.\n\nBuildMyHouse reserves the right to:\n- suspend contractors,\n- remove verification,\n- reduce visibility,\n- or terminate accounts involved in platform circumvention.",
    },
    {
      title: "9. Site Safety & Compliance",
      body: "Contractors are solely responsible for:\n- workplace safety,\n- labor practices,\n- site supervision,\n- equipment handling,\n- permits,\n- insurance,\n- and regulatory compliance.\n\nBuildMyHouse is not responsible for:\n- injuries,\n- site accidents,\n- labor disputes,\n- permit failures,\n- equipment losses,\n- or contractor operational negligence.",
    },
    {
      title: "10. Intellectual Property & Portfolio Usage",
      body: "By using BuildMyHouse, contractors grant BuildMyHouse a limited license to use:\n- project photos,\n- uploaded content,\n- reviews,\n- ratings,\n- and project-related materials\n\nfor:\n- platform operations,\n- marketing,\n- trust-building,\n- case studies,\n- and service improvement.\n\nContractors must only upload materials they have lawful rights to use.",
    },
    {
      title: "11. Ratings & Reputation",
      body: "Contractors acknowledge that:\n- homeowner feedback,\n- ratings,\n- dispute history,\n- communication quality,\n- responsiveness,\n- and project completion history\n\nmay affect platform visibility and eligibility.\n\nBuildMyHouse may internally maintain trust and reliability scoring systems.",
    },
    {
      title: "12. Suspension & Removal",
      body: "BuildMyHouse reserves the right to suspend, restrict, or permanently remove contractors where:\n- fraud is suspected,\n- repeated complaints occur,\n- stage evidence is manipulated,\n- communication becomes abusive,\n- platform rules are violated,\n- or trust and safety risks arise.\n\nVerification can be revoked at any time.",
    },
    {
      title: "13. Limitation of Liability",
      body: "To the fullest extent permitted by law, BuildMyHouse shall not be liable for:\n- lost profits,\n- project cancellations,\n- indirect damages,\n- business interruption,\n- homeowner decisions,\n- economic losses,\n- or disputes between independent parties.\n\nContractors use the platform at their own risk.",
    },
    {
      title: "14. Confidentiality",
      body: "Contractors agree not to:\n- misuse homeowner data,\n- disclose private project information,\n- share sensitive materials,\n- or exploit platform relationships improperly.",
    },
    {
      title: "15. Governing Law",
      body: "These Terms shall be governed by the laws of the Federal Republic of Nigeria.",
    },
    {
      title: "FINAL PLATFORM ACKNOWLEDGEMENT",
      body: "By using BuildMyHouse, all users acknowledge that:\n- construction and property work involve operational uncertainty,\n- BuildMyHouse provides workflow structure and coordination systems,\n- users remain responsible for independent decisions,\n- and successful project outcomes depend on multiple real-world factors beyond software alone.\n\nBy clicking \"I Agree,\" users confirm that they:\n- have read these Terms,\n- understand these Terms,\n- and agree to be legally bound by them.",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
          Terms & Conditions
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={cardShadowStyle} className="bg-gray-100 rounded-2xl p-4 mb-6 border border-gray-200">
          <Text className="text-gray-600 text-sm" style={{ fontFamily: "Poppins_400Regular" }}>
            Full platform terms for homeowners and contractors.
          </Text>
        </View>

        {sections.map((section) => (
          <Section key={section.title} title={section.title}>
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              {section.body || " "}
            </Text>
          </Section>
        ))}
      </ScrollView>
    </View>
  );
}
