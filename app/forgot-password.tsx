import { View, Text, Image, TextInput, Pressable } from "react-native";
import { At } from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function App() {
  return (
    <SafeAreaView className="flex-1 p-6 bg-white">
      <View className="flex-1 justify-between">
        {/* logo */}
        <View className="" style={{ marginTop: 10 }}>
          <Image source={require("../assets/images/gc-logo.png")} className="w-16 h-16" resizeMode="contain" />
          <Text className="text-5xl text-twilightZone font-bold tracking-tighter mb-2" style={{ marginTop: 90 }}>Forgot Password</Text>
          <Text className="text-base text-millionGrey">
            Don’t worry. we’ll help you reset it. Just enter your email to get started.
          </Text>
        </View>

        <View className="flex gap-4 mb-48">
          {/* email */}
          <View className="border border-crystalBell rounded-2xl p-5" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }} >
            <At size={20} color="#7D7C78" weight="regular" style={{ marginRight: 10 }} />
            <TextInput placeholder="studentID@gordoncollege.edu.ph" placeholderTextColor="#7D7C78" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} className="flex-1 font-base text-twilightZone tracking-tight" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }} />
          </View>

          {/* continue */}
          <Pressable className="bg-mercury rounded-full p-5 items-center mt-2">
            <Text className="text-moonBase text-base">Continue</Text>
          </Pressable>

          {/* back to login */}
          <Pressable onPress={() => router.push("./")} className="items-center p-5 mt-12">
            <Text className="text-metalDeluxe text-base font-medium">
              Go back to Login
            </Text>
          </Pressable>

        </View>

        {/* terms */}
        <Text className="text-center tracking-tighter text-millionGrey text-base">
          © 2025 Gordon College MIS Unit. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}
