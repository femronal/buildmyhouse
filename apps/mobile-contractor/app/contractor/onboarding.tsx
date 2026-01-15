import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Upload, Camera, FileText, CheckCircle, User, Building, Phone, Mail, MapPin } from "lucide-react-native";
import { useState } from "react";

const accountTypeLabels = {
  gc: "General Contractor",
};

const requiredDocs = {
  gc: ["Government ID", "Contractor License", "Business Registration", "Insurance Certificate", "Portfolio"],
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'gc' }>();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    address: "",
    specialty: "",
  });
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const accountType = 'gc';
  const docs = requiredDocs[accountType as keyof typeof requiredDocs] || requiredDocs.gc;

  const handleDocUpload = (docName: string) => {
    if (!uploadedDocs.includes(docName)) {
      setUploadedDocs([...uploadedDocs, docName]);
    }
  };

  const handleSubmit = () => {
    router.push(`/contractor/verification?type=${accountType}`);
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text 
            className="text-white text-xl"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {accountTypeLabels[accountType as keyof typeof accountTypeLabels]} Registration
          </Text>
          <Text 
            className="text-gray-400 text-sm"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Step {step} of 3
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="px-6 mb-6">
        <View className="h-2 bg-[#1E3A5F] rounded-full overflow-hidden">
          <View 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <View className="pb-8">
            <Text 
              className="text-white text-lg mb-6"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Personal & Business Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Full Name</Text>
              <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
                <User size={20} color="#3B82F6" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#6B7280"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Business Name</Text>
              <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
                <Building size={20} color="#3B82F6" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter business name"
                  placeholderTextColor="#6B7280"
                  value={formData.businessName}
                  onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Email Address</Text>
              <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
                <Mail size={20} color="#3B82F6" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter email address"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Phone Number</Text>
              <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
                <Phone size={20} color="#3B82F6" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter phone number"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Business Address</Text>
              <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
                <MapPin size={20} color="#3B82F6" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter business address"
                  placeholderTextColor="#6B7280"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>
            </View>

            {accountType === 'sub' && (
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Specialty</Text>
                <View className="flex-row flex-wrap">
                  {['Electrical', 'Plumbing', 'Masonry', 'Carpentry', 'HVAC', 'Roofing', 'Painting', 'Tiling'].map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      onPress={() => setFormData({ ...formData, specialty: spec })}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${formData.specialty === spec ? 'bg-blue-600' : 'bg-[#1E3A5F]'}`}
                    >
                      <Text className={`text-sm ${formData.specialty === spec ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{spec}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <View className="pb-8">
            <Text 
              className="text-white text-lg mb-2"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Upload Required Documents
            </Text>
            <Text 
              className="text-gray-400 text-sm mb-6"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              All documents must be clear and valid
            </Text>

            {docs.map((doc, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDocUpload(doc)}
                className={`rounded-2xl p-4 mb-3 flex-row items-center border ${
                  uploadedDocs.includes(doc) 
                    ? 'bg-green-900/30 border-green-700' 
                    : 'bg-[#1E3A5F] border-blue-900'
                }`}
              >
                <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                  uploadedDocs.includes(doc) ? 'bg-green-600' : 'bg-blue-600/30'
                }`}>
                  {uploadedDocs.includes(doc) ? (
                    <CheckCircle size={24} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <FileText size={24} color="#3B82F6" strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1 ml-4">
                  <Text 
                    className="text-white text-base"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {doc}
                  </Text>
                  <Text 
                    className="text-gray-400 text-xs"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {uploadedDocs.includes(doc) ? 'Uploaded' : 'Tap to upload'}
                  </Text>
                </View>
                {!uploadedDocs.includes(doc) && (
                  <Upload size={20} color="#3B82F6" strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}

            <View className="bg-blue-900/30 rounded-xl p-4 mt-4 flex-row items-start border border-blue-800">
              <Camera size={20} color="#3B82F6" strokeWidth={2} />
              <Text 
                className="text-gray-400 text-xs ml-3 flex-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                You can take photos of your documents or upload existing files. Ensure all text is clearly visible.
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <View className="pb-8">
            <Text 
              className="text-white text-lg mb-6"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Review Your Application
            </Text>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <Text className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Account Type</Text>
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{accountTypeLabels[accountType as keyof typeof accountTypeLabels]}</Text>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <Text className="text-gray-400 text-xs mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>Personal Information</Text>
              <View className="mb-2">
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Full Name</Text>
                <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{formData.fullName || 'Not provided'}</Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Business Name</Text>
                <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{formData.businessName || 'Not provided'}</Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Email</Text>
                <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{formData.email || 'Not provided'}</Text>
              </View>
              <View>
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Phone</Text>
                <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{formData.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <Text className="text-gray-400 text-xs mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>Documents Uploaded</Text>
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{uploadedDocs.length} / {docs.length}</Text>
              <View className="h-2 bg-blue-900 rounded-full mt-2 overflow-hidden">
                <View className="h-full bg-blue-600 rounded-full" style={{ width: `${(uploadedDocs.length / docs.length) * 100}%` }} />
              </View>
            </View>

            <View className="bg-yellow-900/30 rounded-xl p-4 flex-row items-start border border-yellow-700">
              <Text className="text-yellow-500 text-xs flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                By submitting, you agree to our Terms of Service and Privacy Policy. Your application will be reviewed within 2-3 business days.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={() => step < 3 ? setStep(step + 1) : handleSubmit()}
          className="bg-blue-600 rounded-full py-4 px-8"
        >
          <Text 
            className="text-white text-center text-lg"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {step < 3 ? 'Continue' : 'Submit Application'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
