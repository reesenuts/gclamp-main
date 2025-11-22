import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import ProfileSettings from "./profile-settings";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

// current student data - using real data from codebase
const currentStudent = {
  name: 'PARANTAR, LEE PARKER',
  email: '202211523@gordoncollege.edu.ph',
  studentId: '202211523',
};

// get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

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
              {getInitials(currentStudent.name)}
            </Text>
          </View>
        </Pressable>
      </View>

      <ProfileSettings
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        studentName={currentStudent.name}
        studentEmail={currentStudent.email}
        studentId={currentStudent.studentId}
      />
    </>
  );
}
