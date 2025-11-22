import { router } from "expo-router";
import { Building, Clock, MagnifyingGlass, User } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Course = { id: string; code: string; name: string; instructor: string; schedule: string; time: string; room: string; color: string; };

const getDayOrder = (schedule: string): number => {
  const dayMap: { [key: string]: number } = { 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5, 'Sat': 6, 'Sun': 7 };
  
  if (schedule.includes('M')) return 1;
  if (schedule.startsWith('T') && !schedule.startsWith('Th')) return 2;
  if (schedule.includes('W')) return 3;
  if (schedule.includes('Th')) return 4;
  if (schedule.includes('F')) return 5;
  if (schedule.includes('Sat')) return 6;
  if (schedule.includes('Sun')) return 7;
  return 8;
};

const getTimeValue = (time: string): number => {
  const [timeStr] = time.split(' - ');
  const [hour, minute] = timeStr.split(':');
  const isPM = timeStr.includes('PM');
  let hours = parseInt(hour);
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return hours * 60 + parseInt(minute);
};

const coursesData: Course[] = [
  { id: '40922', code: 'CSP421A', name: 'CS Thesis Writing 2 (LEC)', instructor: 'Erlinda Abarintos', schedule: 'T', time: '4:00 PM - 5:00 PM', room: 'GC Main 508', color: '#3b82f6', },
  { id: '40923', code: 'CSP421L', name: 'CS Thesis Writing 2 (LAB)', instructor: 'Erlinda Abarintos', schedule: 'MT', time: '6:00 PM - 9:00 PM', room: 'GC Main 508', color: '#3b82f6', },
  { id: '40924', code: 'CSE412A', name: 'CS Elective 6 (LEC) - AR/VR Systems', instructor: 'Loudel Manaloto', schedule: 'Th', time: '4:00 PM - 6:00 PM', room: 'GC Main 411', color: '#ec4899', },
  { id: '40925', code: 'CSE412L', name: 'CS Elective 6 (LAB) - AR/VR Systems', instructor: 'Loudel Manaloto', schedule: 'F', time: '9:00 AM - 12:00 PM', room: 'GC Main 507', color: '#ec4899', },
  { id: '40926', code: 'CSE413A', name: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning', instructor: 'Melner Balce', schedule: 'MT', time: '5:00 PM - 6:00 PM', room: 'GC Main 505', color: '#8b5cf6', },
  { id: '40927', code: 'CSE413L', name: 'CS Elective 7 (LAB) - Artificial Intelligence & Machine Learning', instructor: 'Melner Balce', schedule: 'Sat', time: '7:00 AM - 10:00 AM', room: 'GC Main 519', color: '#8b5cf6', },
  { id: '40928', code: 'CSC414', name: 'CS Seminars and Educational Trips', instructor: 'Erlinda Abarintos', schedule: 'F', time: '5:00 PM - 8:00 PM', room: 'GC Main 508', color: '#f59e0b', },
];

const courses = coursesData.sort((a, b) => {
  const dayDiff = getDayOrder(a.schedule) - getDayOrder(b.schedule);
  if (dayDiff !== 0) return dayDiff;
  return getTimeValue(a.time) - getTimeValue(b.time);
});

export default function Classes() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(search.toLowerCase()) ||
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-6">
        <View className="mb-4 rounded-full" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, backgroundColor: isFocused ? "#FFFFFF" : "#F9F9F9", borderWidth: 1, borderColor: isFocused ? "#EFEFEF" : "transparent", }} >
          <MagnifyingGlass size={20} color={isFocused ? "#191815" : "#999999"} weight="regular" style={{ marginRight: 10 }} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search" placeholderTextColor={isFocused ? "#191815" : "#999999"} className="flex-1 font-base" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false, color: "#191815", }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
        </View>
      </View>

      {filteredCourses.length > 0 ? (
        <ScrollView className="flex-1 px-6 mb-2" showsVerticalScrollIndicator={false} >
          <View className="py-4">
            {filteredCourses.map((course) => (
              <Pressable key={course.id} className="mb-4 rounded-2xl bg-white border border-crystalBell active:opacity-80" onPress={() => router.push({ pathname: '/components/classes/class-details', params: { code: course.code, name: course.name, instructor: course.instructor, schedule: course.schedule, time: course.time, room: course.room, color: course.color, }})}>
                <View className="p-4">
                  <View className="flex-row items-stretch">
                    <View className="w-1 rounded-full mr-3" style={{ backgroundColor: course.color }} />
                    <View className="flex-1">
                      <Text className="text-millionGrey text-sm font-medium">
                        {course.code}
                      </Text>
                      <Text className="text-twilightZone text-lg font-semibold" numberOfLines={1} ellipsizeMode="tail">
                        {course.name}
                      </Text>
                    </View>
                  </View>
                </View>

               <View className="p-4 flex-1 justify-end gap-1">
                 <View className="flex-row items-center">
                   <User size={16} color="#999999" weight="regular" />
                   <Text className="text-millionGrey text-sm ml-2">
                     {course.instructor}
                   </Text>
                 </View>

                 <View className="flex-row items-center">
                   <Clock size={16} color="#999999" weight="regular" />
                   <Text className="text-millionGrey text-sm ml-2">
                     {course.schedule} • {course.time}
                   </Text>
                 </View>

                 <View className="flex-row items-center">
                   <Building size={16} color="#999999" weight="regular" />
                   <Text className="text-millionGrey text-sm ml-2">
                     {course.room}
                   </Text>
                 </View>
               </View>
            </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-millionGrey text-base">No courses found.</Text>
        </View>
      )}
    </View>
  );
}
