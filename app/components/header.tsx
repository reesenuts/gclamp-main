import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { authService } from "../services";
import { User } from "../types/api";
import ProfileSettings from "./profile-settings";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

// get initials from name
const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  // Get user display data with fallbacks
  const userName = user?.fullname || '';
  const userEmail = user?.emailadd || '';
  const userId = user?.id || '';

  return (
    <>
      <View className="flex-row justify-between items-start p-6">
        <View>
          <Text className="text-4xl text-twilightZone font-bold tracking-tighter">{title}</Text>
          {subtitle && (
            <Text className="text-xl text-millionGrey font-semibold">{subtitle}</Text>
          )}
        </View>

        <Pressable
          onPress={() => setIsProfileModalVisible(true)}
          className="active:opacity-80"
        >
          <View className="w-12 h-12 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center">
            <Text className="text-metalDeluxe font-bold text-base">
              {getInitials(userName)}
            </Text>
          </View>
        </Pressable>
      </View>

      <ProfileSettings
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        studentName={userName}
        studentEmail={userEmail}
        studentId={userId}
      />
    </>
  );
}
