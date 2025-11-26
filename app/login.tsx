import { router } from "expo-router";
import { At, LockSimple } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { authService } from "./services";
import { setupFCM } from "./utils/fcmSetup";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Validation
    if (!username.trim()) {
      setError("Please enter your Student ID");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await authService.login({
        username: username.trim(),
        password,
        device: "mobile",
      });

      // Setup FCM after successful login
      setupFCM().catch((error) => {
        console.error('Failed to setup FCM after login:', error);
      });

      // Success - navigate to app
      router.push("./todolist");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 justify-between">
        {/* logo */}
        <View className="items-center" style={{ marginTop: 60 }}>
          <Image source={require("../assets/images/gc-logo.png")} className="w-28 h-28" resizeMode="contain" />
        </View>

        <View className="flex gap-4 mb-16">
          {/* error message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* email */}
          <View className="border border-crystalBell rounded-2xl p-5" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }} >
            <At size={20} color="#191815" weight="regular" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Student ID"
              placeholderTextColor="#7D7C78"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              className="flex-1 font-base text-twilightZone tracking-tight"
              style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }}
            />
          </View>

          {/* password */}
          <View className="border border-crystalBell rounded-2xl p-5" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }} >
            <LockSimple size={20} color="#191815" weight="regular" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#7D7C78"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={handleLogin}
              className="flex-1 font-base text-twilightZone tracking-tight"
              style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }}
            />
          </View>

          {/* continue */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-full p-5 items-center mt-2 ${loading ? "bg-millionGrey" : "bg-metalDeluxe"}`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base">Continue</Text>
            )}
          </Pressable>

          {/* forgot password */}
          <Pressable
            onPress={() => router.push("./forgot-password")}
            disabled={loading}
            className="items-center p-5 mt-4"
          >
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
