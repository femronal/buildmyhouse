import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUpdateCurrentUser } from "@/hooks/useUpdateCurrentUser";
import { useUploadProfilePicture } from "@/hooks/useUploadProfilePicture";
import { useGCProfile, useUpdateGCProfile, useUpsertVerificationDocument } from "@/hooks/useGCProfile";
import { needsContractorIntroOnboarding } from "@/lib/onboarding";
import { uploadFile } from "@/utils/fileUpload";
import { api } from "@/lib/api";

type Step = "about" | "proof";

const PROOF = [
  { type: "cac_certificate", title: "Is your business registered with CAC?", allowNa: true },
  { type: "government_id", title: "Do you have a government ID?", allowNa: false },
  { type: "proof_of_business_address", title: "Do you have proof of where you work from?", allowNa: true },
  { type: "professional_license", title: "Registered with CORBON?", allowNa: false, council: true },
];

function proofLabel(doc: { status?: string; uploaded?: boolean }) {
  if (doc.status === "checked") return "Checked by BuildMyHouse";
  if (doc.status === "received" || doc.uploaded) return "Received. Not checked yet.";
  if (doc.status === "says_has") return "You'll send it.";
  if (doc.status === "not_have") return "Don't have yet";
  if (doc.status === "not_applicable") return "Doesn't apply";
  return "";
}

export default function OnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: profileData, isLoading: loadingProfile } = useGCProfile();
  const updateUser = useUpdateCurrentUser();
  const updateGCProfile = useUpdateGCProfile();
  const uploadProfilePicture = useUploadProfilePicture();
  const upsertVerificationDocument = useUpsertVerificationDocument();
  const [step, setStep] = useState<Step>("about");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setFullName(String(currentUser.fullName || ""));
    setEmail(String(currentUser.email || ""));
    setPhone(String(currentUser.phone || ""));
    if (!needsContractorIntroOnboarding(currentUser)) router.replace("/contractor/gc-dashboard");
  }, [currentUser, router]);

  useEffect(() => {
    if (profileData) setLocation(String(profileData.location || ""));
  }, [profileData]);

  const docs = (profileData?.verificationRequiredDocuments || []) as Array<{ type: string; status?: string; uploaded?: boolean }>;
  const showCouncil = profileData?.specialtyCategory === "general_contractor";
  const cards = PROOF.filter((item) => !item.council || showCouncil);

  const saveAbout = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !location.trim()) {
      setError("Name, email, phone and business location are required.");
      return;
    }
    setError("");
    await Promise.all([
      updateUser.mutateAsync({ fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim() }),
      updateGCProfile.mutateAsync({ location: location.trim() }),
    ]);
    setStep("proof");
  };

  const finish = async (skipped: boolean) => {
    await Promise.all([
      updateGCProfile.mutateAsync({
        professionalOnboardingSkipped: skipped,
        professionalOnboardingCompleted: !skipped,
      }),
      updateUser.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        acceptGCTerms: !currentUser?.gcTermsAcceptedAt,
        completeProfileSetup: true,
      }),
    ]);
    router.replace("/contractor/gc-dashboard");
  };

  const refreshProof = async () => {
    await queryClient.invalidateQueries({ queryKey: ["gc-profile"] });
  };

  const upload = async (documentType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["application/pdf", "image/*"] });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      const fileUrl = await uploadFile(file.uri, "document", { fileName: file.name || `${documentType}.pdf`, mimeType: file.mimeType || "application/pdf" });
      await upsertVerificationDocument.mutateAsync({ documentType, fileUrl });
      await api.post("/contractors/verification-documents/answer", { documentType, answer: "added" });
      await refreshProof();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that file.");
    }
  };

  const answer = async (documentType: string, value: string) => {
    try {
      await api.post("/contractors/verification-documents/answer", { documentType, answer: value });
      await refreshProof();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that answer.");
    }
  };

  if (loadingUser || loadingProfile) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}><ActivityIndicator /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", minHeight: "100%" }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#E5E7EB" }}>
        <TouchableOpacity onPress={() => (step === "proof" ? setStep("about") : router.replace("/contractor/gc-dashboard"))} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 22 }}>{step === "about" ? "About you" : "Proof (optional)"}</Text>
        <View style={{ height: 4, backgroundColor: "#E5E7EB", marginTop: 8 }}>
          <View style={{ width: step === "about" ? "50%" : "100%", height: 4, backgroundColor: "#16A34A" }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {step === "about" ? (
          <View>
            <Text>Photo or logo (Optional)</Text>
            <TouchableOpacity onPress={async () => {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) return;
              const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
              if (result.canceled) return;
              const asset = result.assets?.[0];
              if (!asset?.uri) return;
              await uploadProfilePicture.mutateAsync({ uri: asset.uri, name: asset.fileName || "logo.jpg", type: asset.mimeType || "image/jpeg" });
            }} style={buttonOutline}>
              <Text>Add a photo</Text>
            </TouchableOpacity>
            <Text>Your name (Required)</Text>
            <TextInput value={fullName} onChangeText={setFullName} style={field} />
            <Text>Email (Required)</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={field} />
            <Text>Phone (Required)</Text>
            <TextInput value={phone} onChangeText={setPhone} style={field} />
            <Text>Business location (Required)</Text>
            <TextInput value={location} onChangeText={setLocation} style={field} />
            {error ? <Text style={{ color: "#991B1B" }}>{error}</Text> : null}
          </View>
        ) : (
          <View>
            {error ? <Text style={{ color: "#991B1B", marginTop: 8 }}>{error}</Text> : null}
            {cards.map((card) => {
              const saved = docs.find((doc) => doc.type === card.type);
              return (
                <View key={card.type} style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 12, marginBottom: 12 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold" }}>{card.title}</Text>
                  {saved ? <Text style={{ color: saved.status === "checked" ? "#16A34A" : "#4B5563" }}>{proofLabel(saved)}</Text> : null}
                  <TouchableOpacity onPress={() => upload(card.type)} style={choice}><Text>Add it</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => answer(card.type, "not_have")} style={choice}><Text>I don't have this</Text></TouchableOpacity>
                  {card.allowNa ? <TouchableOpacity onPress={() => answer(card.type, "not_applicable")} style={choice}><Text>Doesn't apply to my work</Text></TouchableOpacity> : null}
                </View>
              );
            })}
            <Text style={{ color: "#4B5563", marginTop: 8 }}>
              By continuing you agree to the BuildMyHouse contractor terms.
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: "#E5E7EB" }}>
        {step === "about" ? (
          <TouchableOpacity onPress={() => void saveAbout()} style={black}><Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Continue</Text></TouchableOpacity>
        ) : (
          <View style={{ gap: 8 }}>
            <TouchableOpacity onPress={() => void finish(false)} style={black}><Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Finish</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => void finish(true)} style={buttonOutline}><Text>Skip for now</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const field = { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, minHeight: 48, paddingHorizontal: 12, marginVertical: 8 };
const black = { backgroundColor: "#000", borderRadius: 999, minHeight: 56, alignItems: "center" as const, justifyContent: "center" as const };
const buttonOutline = { borderWidth: 1, borderColor: "#000", borderRadius: 999, minHeight: 56, alignItems: "center" as const, justifyContent: "center" as const, marginVertical: 8 };
const choice = { minHeight: 44, justifyContent: "center" as const };
