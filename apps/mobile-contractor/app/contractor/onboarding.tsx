import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUpdateCurrentUser } from "@/hooks/useUpdateCurrentUser";
import { useUploadProfilePicture } from "@/hooks/useUploadProfilePicture";
import { useGCProfile, useUpdateGCProfile, useUpsertVerificationDocument } from "@/hooks/useGCProfile";
import { needsContractorIntroOnboarding } from "@/lib/onboarding";
import { getBackendAssetUrl } from "@/lib/image";
import { useResponsivePadding } from "@/lib/responsive-layout";
import { uploadFile } from "@/utils/fileUpload";
import { api } from "@/lib/api";

type Scope = "repairer" | "upgrader" | "renovator" | "general_contractor";
type Step = "scope" | "work" | "about" | "proof";

const STEPS: Step[] = ["scope", "work", "about", "proof"];

const SCOPES: Array<{ id: Scope; title: string; detail: string }> = [
  {
    id: "repairer",
    title: "Repairs",
    detail: "Leaks, power, roofs, painting, and other jobs that are already broken. No council licence.",
  },
  {
    id: "upgrader",
    title: "Upgrades",
    detail: "Kitchens, bathrooms, floors, lighting, security, and finishing work.",
  },
  {
    id: "renovator",
    title: "Renovation",
    detail: "Changing an existing home, office, or rental. Bigger than a repair, short of a new building.",
  },
  {
    id: "general_contractor",
    title: "Full builds",
    detail: "New houses and turnkey work, from foundation through handover.",
  },
];

const WORK: Record<Scope, string[]> = {
  repairer: [
    "Electrical Fixes",
    "Plumbing Repairs",
    "Roof Leak Repair",
    "Tiling Repair",
    "Painting Touch-Up",
    "Carpentry Repair",
  ],
  upgrader: [
    "Kitchen Upgrade",
    "Bathroom Upgrade",
    "Lighting Upgrade",
    "Security Upgrade",
    "Floor Upgrade",
    "Facade Upgrade",
  ],
  renovator: [
    "Room Renovation",
    "Full Home Renovation",
    "Office Renovation",
    "Rental Renovation",
    "Interior Renovation",
    "Exterior Renovation",
  ],
  general_contractor: [
    "Residential Building",
    "Commercial Building",
    "Turnkey Delivery",
    "Site Supervision",
    "Structural Works",
    "Project Management",
  ],
};

type ProofCard = {
  type: string;
  title: string;
  detail: string;
  allowNa: boolean;
};

const PROOF: Record<Scope, ProofCard[]> = {
  repairer: [
    {
      type: "government_id",
      title: "Government ID",
      detail: "So homeowners know who is coming. A NIN, passport, or driver's licence is enough. No CAC or council papers.",
      allowNa: false,
    },
  ],
  upgrader: [
    {
      type: "government_id",
      title: "Government ID",
      detail: "NIN, passport, or driver's licence.",
      allowNa: false,
    },
    {
      type: "cac_certificate",
      title: "CAC registration",
      detail: "Only if this upgrade business is registered. Skip it if you work under your own name.",
      allowNa: true,
    },
  ],
  renovator: [
    {
      type: "government_id",
      title: "Government ID",
      detail: "NIN, passport, or driver's licence.",
      allowNa: false,
    },
    {
      type: "cac_certificate",
      title: "CAC registration",
      detail: "Only if the renovation business is registered.",
      allowNa: true,
    },
    {
      type: "proof_of_business_address",
      title: "Where you work from",
      detail: "A utility bill or tenancy agreement. Not needed if you work on the client's site.",
      allowNa: true,
    },
  ],
  general_contractor: [
    {
      type: "government_id",
      title: "Government ID",
      detail: "NIN, passport, or driver's licence for the person leading the build.",
      allowNa: false,
    },
    {
      type: "cac_certificate",
      title: "CAC registration",
      detail: "Company or business-name certificate, if you have one.",
      allowNa: true,
    },
    {
      type: "proof_of_business_address",
      title: "Business address",
      detail: "Utility bill or tenancy agreement for the office or yard.",
      allowNa: true,
    },
    {
      type: "professional_license",
      title: "Council registration",
      detail: "CORBON or an equivalent building-council registration. Full builds are the only scope that asks for this.",
      allowNa: false,
    },
  ],
};

function proofLabel(doc?: { status?: string | null; uploaded?: boolean }) {
  if (!doc) return "";
  if (doc.status === "checked") return "Checked by BuildMyHouse";
  if (doc.status === "received" || doc.uploaded) return "Received. Not checked yet.";
  if (doc.status === "says_has") return "You'll send it.";
  if (doc.status === "not_have") return "Don't have it yet";
  if (doc.status === "not_applicable") return "Doesn't apply";
  return "";
}

export default function OnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { horizontalPad, headerPaddingTop } = useResponsivePadding("stack");
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: profileData, isLoading: loadingProfile } = useGCProfile();
  const updateUser = useUpdateCurrentUser();
  const updateGCProfile = useUpdateGCProfile();
  const uploadProfilePicture = useUploadProfilePicture();
  const upsertVerificationDocument = useUpsertVerificationDocument();

  const [step, setStep] = useState<Step>("scope");
  const [scope, setScope] = useState<Scope | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [years, setYears] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(String(currentUser.fullName || ""));
    setEmail(String(currentUser.email || ""));
    setPhone(String(currentUser.phone || ""));
    if (!needsContractorIntroOnboarding(currentUser)) router.replace("/contractor/gc-dashboard");
  }, [currentUser, router]);

  useEffect(() => {
    if (!profileData || hydrated.current) return;
    hydrated.current = true;
    setLocation(String(profileData.location || ""));
    if (profileData.experienceYears) setYears(String(profileData.experienceYears));
    const category = profileData.specialtyCategory;
    if (category === "repairer" || category === "upgrader" || category === "renovator" || category === "general_contractor") {
      setScope(category);
      setTags(profileData.specialtyTags || []);
    }
  }, [profileData]);

  const stepIndex = STEPS.indexOf(step);
  const cards = scope ? PROOF[scope] : [];
  const docs = profileData?.verificationRequiredDocuments || [];
  const photoUrl = useMemo(
    () => getBackendAssetUrl(currentUser?.pictureUrl || profileData?.pictureUrl || ""),
    [currentUser?.pictureUrl, profileData?.pictureUrl],
  );

  const goBack = () => {
    setError("");
    if (stepIndex <= 0) {
      router.replace("/contractor/gc-dashboard");
      return;
    }
    setStep(STEPS[stepIndex - 1]);
  };

  const toggleTag = (tag: string) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const saveScope = () => {
    if (!scope) {
      setError("Choose the kind of work you take on.");
      return;
    }
    setError("");
    setStep("work");
  };

  const saveWork = async () => {
    if (!scope || tags.length === 0) {
      setError("Choose at least one job you can take.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateGCProfile.mutateAsync({ specialtyCategory: scope, specialtyTags: tags });
      setStep("about");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  };

  const saveAbout = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !location.trim()) {
      setError("Name, email, phone, and where you work are required.");
      return;
    }
    const experienceYears = years.trim() ? Number(years) : undefined;
    if (years.trim() && (!Number.isFinite(experienceYears) || (experienceYears as number) < 0)) {
      setError("Years of experience should be a number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await Promise.all([
        updateUser.mutateAsync({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
        updateGCProfile.mutateAsync({
          location: location.trim(),
          ...(scope ? { specialtyCategory: scope, specialtyTags: tags } : {}),
          ...(experienceYears !== undefined ? { experienceYears } : {}),
        }),
      ]);
      setStep("proof");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async (skipped: boolean) => {
    setBusy(true);
    setError("");
    try {
      await updateGCProfile.mutateAsync({
        location: location.trim(),
        professionalOnboardingSkipped: skipped,
        professionalOnboardingCompleted: !skipped,
        ...(scope ? { specialtyCategory: scope, specialtyTags: tags } : {}),
      });
      await updateUser.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        acceptGCTerms: !currentUser?.gcTermsAcceptedAt,
        completeProfileSetup: true,
      });
      router.replace("/contractor/gc-dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish setup.");
    } finally {
      setBusy(false);
    }
  };

  const addPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Allow photo access to add a logo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      setBusy(true);
      await uploadProfilePicture.mutateAsync({
        uri: asset.uri,
        name: asset.fileName || "logo.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that photo.");
    } finally {
      setBusy(false);
    }
  };

  const uploadProof = async (documentType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["application/pdf", "image/*"] });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      setBusy(true);
      const fileUrl = await uploadFile(file.uri, "document", {
        fileName: file.name || `${documentType}.pdf`,
        mimeType: file.mimeType || "application/pdf",
      });
      await upsertVerificationDocument.mutateAsync({ documentType, fileUrl });
      await api.post("/contractors/verification-documents/answer", { documentType, answer: "added" });
      await queryClient.invalidateQueries({ queryKey: ["gc-profile"] });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that file.");
    } finally {
      setBusy(false);
    }
  };

  const answerProof = async (documentType: string, value: string) => {
    try {
      setBusy(true);
      await api.post("/contractors/verification-documents/answer", { documentType, answer: value });
      await queryClient.invalidateQueries({ queryKey: ["gc-profile"] });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that answer.");
    } finally {
      setBusy(false);
    }
  };

  if (loadingUser || loadingProfile) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const titles: Record<Step, string> = {
    scope: "What work do you take?",
    work: "Which jobs can you do?",
    about: "About you",
    proof: scope === "repairer" ? "ID only" : "Proof, if you have it",
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }} className="pb-4">
        <TouchableOpacity onPress={goBack} className="min-h-[44px] justify-center self-start">
          <Text className="text-white" style={{ fontFamily: "Poppins_500Medium" }}>Back</Text>
        </TouchableOpacity>
        <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: "Poppins_500Medium" }}>
          Step {stepIndex + 1} of {STEPS.length}
        </Text>
        <Text className="text-white text-2xl" style={{ fontFamily: "Poppins_700Bold" }}>{titles[step]}</Text>
        <View className="h-1 bg-[#1E3A5F] rounded-full mt-4 overflow-hidden">
          <View className="h-1 bg-[#2563EB]" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: horizontalPad, paddingBottom: 32 }}>
        {step === "scope" ? (
          <View>
            <Text className="text-gray-300 mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
              Homeowners hire for a specific kind of job. Pick the closest match. You can still list the exact work on the next step.
            </Text>
            {SCOPES.map((item) => {
              const selected = scope === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    if (scope !== item.id) {
                      setScope(item.id);
                      setTags([]);
                    }
                    setError("");
                  }}
                  className={`rounded-2xl p-4 mb-3 border ${selected ? "bg-white border-white" : "bg-[#1E3A5F] border-blue-900"}`}
                >
                  <Text className={selected ? "text-black text-lg" : "text-white text-lg"} style={{ fontFamily: "Poppins_700Bold" }}>
                    {item.title}
                  </Text>
                  <Text className={selected ? "text-gray-700 mt-1" : "text-gray-300 mt-1"} style={{ fontFamily: "Poppins_400Regular" }}>
                    {item.detail}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {step === "work" && scope ? (
          <View>
            <Text className="text-gray-300 mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
              Select every job you can actually take. This is what we use to match you.
            </Text>
            <View className="flex-row flex-wrap">
              {WORK[scope].map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className={`rounded-full px-4 py-3 mr-2 mb-2 border ${selected ? "bg-white border-white" : "bg-[#1E3A5F] border-blue-900"}`}
                  >
                    <Text className={selected ? "text-black" : "text-white"} style={{ fontFamily: "Poppins_600SemiBold" }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === "about" ? (
          <View>
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: "Poppins_500Medium" }}>Photo or logo, optional</Text>
            <TouchableOpacity onPress={() => void addPhoto()} className="bg-[#1E3A5F] border border-blue-900 rounded-2xl p-4 mb-4 flex-row items-center">
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} className="w-14 h-14 rounded-full mr-3" />
              ) : (
                <View className="w-14 h-14 rounded-full bg-[#0A1628] mr-3 items-center justify-center">
                  <Text className="text-gray-400 text-xs" style={{ fontFamily: "Poppins_600SemiBold" }}>Logo</Text>
                </View>
              )}
              <Text className="text-white flex-1" style={{ fontFamily: "Poppins_600SemiBold" }}>
                {photoUrl ? "Change photo" : "Add a photo"}
              </Text>
            </TouchableOpacity>
            <Field label="Your name" value={fullName} onChangeText={setFullName} />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Where you work" value={location} onChangeText={setLocation} placeholder="Ikeja, Lagos" />
            <Field label="Years doing this work, optional" value={years} onChangeText={setYears} keyboardType="number-pad" />
          </View>
        ) : null}

        {step === "proof" ? (
          <View>
            <Text className="text-gray-300 mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
              {scope === "repairer"
                ? "Repairers are not asked for a council licence, CAC certificate, or tax papers. An ID is enough, and you can add it later."
                : scope === "general_contractor"
                  ? "Full builds are the only scope that asks about council registration. None of this blocks you from finishing."
                  : "Add what you have. “I don't have this” is a normal answer."}
            </Text>
            {cards.map((card) => {
              const saved = docs.find((doc) => doc.type === card.type);
              const label = proofLabel(saved);
              return (
                <View key={card.type} className="bg-[#1E3A5F] border border-blue-900 rounded-2xl p-4 mb-3">
                  <Text className="text-white text-base" style={{ fontFamily: "Poppins_700Bold" }}>{card.title}</Text>
                  <Text className="text-gray-300 text-sm mt-1 mb-3" style={{ fontFamily: "Poppins_400Regular" }}>{card.detail}</Text>
                  {label ? (
                    <Text className="text-blue-200 text-xs mb-2" style={{ fontFamily: "Poppins_600SemiBold" }}>{label}</Text>
                  ) : null}
                  <Choice label="Add it" onPress={() => void uploadProof(card.type)} />
                  <Choice label="I don't have this" onPress={() => void answerProof(card.type, "not_have")} />
                  {card.allowNa ? <Choice label="Doesn't apply to my work" onPress={() => void answerProof(card.type, "not_applicable")} /> : null}
                </View>
              );
            })}
            <Text className="text-gray-400 text-sm mt-2" style={{ fontFamily: "Poppins_400Regular" }}>
              By finishing you agree to the BuildMyHouse contractor terms. Bank details are asked only after you are approved to be paid.
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text className="text-red-300 mt-3" style={{ fontFamily: "Poppins_500Medium" }}>{error}</Text>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: horizontalPad, paddingBottom: 28 }} className="pt-3 border-t border-blue-900">
        {step === "scope" ? (
          <Primary label="Continue" disabled={busy} onPress={saveScope} />
        ) : null}
        {step === "work" ? (
          <Primary label={busy ? "Saving…" : "Continue"} disabled={busy} onPress={() => void saveWork()} />
        ) : null}
        {step === "about" ? (
          <Primary label={busy ? "Saving…" : "Continue"} disabled={busy} onPress={() => void saveAbout()} />
        ) : null}
        {step === "proof" ? (
          <View>
            <Primary label={busy ? "Saving…" : "Finish"} disabled={busy} onPress={() => void finish(false)} />
            <TouchableOpacity onPress={() => void finish(true)} disabled={busy} className="min-h-[52px] items-center justify-center mt-2">
              <Text className="text-white" style={{ fontFamily: "Poppins_600SemiBold" }}>Skip proof for now</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
}) {
  return (
    <View className="mb-3">
      <Text className="text-gray-400 text-sm mb-1" style={{ fontFamily: "Poppins_500Medium" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#6B7280"
        autoCapitalize={props.keyboardType === "email-address" ? "none" : "words"}
        keyboardType={props.keyboardType || "default"}
        className="bg-[#1E3A5F] text-white rounded-xl px-4 min-h-[52px] border border-blue-900"
        style={{ fontFamily: "Poppins_400Regular" }}
      />
    </View>
  );
}

function Choice(props: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={props.onPress} className="min-h-[44px] justify-center border-t border-blue-900">
      <Text className="text-white" style={{ fontFamily: "Poppins_500Medium" }}>{props.label}</Text>
    </TouchableOpacity>
  );
}

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={props.disabled}
      className="bg-[#2563EB] rounded-full min-h-[56px] items-center justify-center"
      style={{ opacity: props.disabled ? 0.6 : 1 }}
    >
      <Text className="text-white text-base" style={{ fontFamily: "Poppins_600SemiBold" }}>{props.label}</Text>
    </TouchableOpacity>
  );
}
