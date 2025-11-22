import { Image, Pressable, Text, TextInput, View, SafeAreaView } from "react-native";
import { At, LockSimple } from "phosphor-react-native";
import { router } from "expo-router";

export default function Login() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 justify-between">
        {/* logo */}
        <View className="items-center" style={{ marginTop: 60 }}>
          <Image source={require("../assets/images/gc-logo.png")} className="w-28 h-28" resizeMode="contain" />
        </View>

        <View className="flex gap-4 mb-16">
          {/* email */}
          <View className="border border-crystalBell rounded-2xl p-5" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }} >
            <At size={20} color="#191815" weight="regular" style={{ marginRight: 10 }} />
            <TextInput placeholder="Student ID" placeholderTextColor="#7D7C78" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} className="flex-1 font-base text-twilightZone tracking-tight" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }} />
          </View>

          {/* password */}
          <View className="border border-crystalBell rounded-2xl p-5" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }} >
            <LockSimple size={20} color="#191815" weight="regular" style={{ marginRight: 10 }} />
            <TextInput placeholder="Password" placeholderTextColor="#7D7C78" secureTextEntry className="flex-1 font-base text-twilightZone tracking-tight" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }} />
          </View>

          {/* continue */}
          <Pressable onPress={() => router.push("./todolist")} className="bg-metalDeluxe rounded-full p-5 items-center mt-2" >
            <Text className="text-white text-base">Continue</Text>
          </Pressable>

          {/* forgot password */}
          <Pressable onPress={() => router.push("./forgot-password")} className="items-center p-5 mt-4" >
            <Text className="text-metalDeluxe text-base font-medium">
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        {/* terms */}
        <Text className="text-center tracking-tighter text-millionGrey text-base">
          By signing in, you consent to Gordon College processing your data under its{" "}
          <Text onPress={() => {}} className="text-saltBlue underline">
            General Privacy Notice
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}
