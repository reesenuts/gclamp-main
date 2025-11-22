import { router } from "expo-router";
import { Camera, SignOut, User, X } from "phosphor-react-native";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../services";

type ProfileSettingsProps = {
  visible: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  studentId: string;
};

// get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// convert uppercase name to normal case
const toNormalCase = (name: string) => {
  return name
    .split(',')
    .map(part => 
      part.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(', ');
};

export default function ProfileSettings({
  visible,
  onClose,
  studentName,
  studentEmail,
  studentId,
}: ProfileSettingsProps) {
  // handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear authentication tokens and user data
              await authService.logout();
              onClose();
              // Navigate to login screen
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate even if logout fails
              onClose();
              router.replace('/');
            }
          },
        },
      ]
    );
  };

  // handle account settings
  const handleAccountSettings = () => {
    Alert.alert('Account Settings', 'Account settings feature coming soon!');
  };

  // handle change avatar
  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Avatar change feature coming soon!');
  };

  const displayName = toNormalCase(studentName);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        {/* header */}
        <View className="pt-6 px-6 pb-4 bg-white border-b border-crystalBell">
          <View className="flex-row justify-between items-center">
            <Text className="text-twilightZone text-lg font-semibold">
              Profile Settings
            </Text>
            <Pressable onPress={onClose}>
              <X size={20} color="#191815" weight="regular" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* profile section */}
            <View className="items-center mb-8">
              {/* avatar */}
              <Pressable
                onPress={handleChangeAvatar}
                className="w-24 h-24 rounded-full bg-millionGrey/10 border-2 border-crystalBell items-center justify-center mb-4"
              >
                <Text className="text-metalDeluxe font-bold text-3xl">
                  {getInitials(studentName)}
                </Text>
                {/* camera icon overlay */}
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-seljukBlue border-2 border-white items-center justify-center">
                  <Camera size={14} color="#FFFFFF" weight="regular" />
                </View>
              </Pressable>
              <Text className="text-twilightZone text-xl font-semibold mb-1">
                {displayName}
              </Text>
              <Text className="text-millionGrey text-sm">{studentEmail}</Text>
              <Text className="text-millionGrey text-xs mt-1">Student ID: {studentId}</Text>
            </View>

            {/* settings options */}
            <View>
              {/* account settings */}
              <Pressable
                onPress={handleAccountSettings}
                className="flex-row items-center bg-white rounded-2xl border border-crystalBell p-4 mb-2 active:opacity-80"
              >
                <View className="w-10 h-10 rounded-full bg-seljukBlue/10 items-center justify-center mr-4">
                  <User size={20} color="#4285F4" weight="regular" />
                </View>
                <View className="flex-1">
                  <Text className="text-twilightZone font-semibold text-base">
                    Account Settings
                  </Text>
                  <Text className="text-millionGrey text-xs mt-0.5">
                    Manage your account information
                  </Text>
                </View>
              </Pressable>

              {/* change avatar */}
              <Pressable
                onPress={handleChangeAvatar}
                className="flex-row items-center bg-white rounded-2xl border border-crystalBell p-4 mb-2 active:opacity-80"
              >
                <View className="w-10 h-10 rounded-full bg-seljukBlue/10 items-center justify-center mr-4">
                  <Camera size={20} color="#4285F4" weight="regular" />
                </View>
                <View className="flex-1">
                  <Text className="text-twilightZone font-semibold text-base">
                    Change Avatar
                  </Text>
                  <Text className="text-millionGrey text-xs mt-0.5">
                    Update your profile picture
                  </Text>
                </View>
              </Pressable>

              {/* logout */}
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center bg-white rounded-2xl border border-mettwurst/50 p-4 mb-2 active:opacity-80"
              >
                <View className="w-10 h-10 rounded-full bg-mettwurst/10 items-center justify-center mr-4">
                  <SignOut size={20} color="#DC2626" weight="regular" />
                </View>
                <View className="flex-1">
                  <Text className="text-mettwurst font-semibold text-base">
                    Logout
                  </Text>
                  <Text className="text-millionGrey text-xs mt-0.5">
                    Sign out of your account
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

