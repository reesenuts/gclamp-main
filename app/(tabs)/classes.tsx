import { router } from "expo-router";
import { Building, Clock, MagnifyingGlass, User } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { authService, generalService, lampService } from "../services";
import { SettingsResponse, StudentClass } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";

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

// Color palette for courses
const courseColors = [
  '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', 
  '#06b6d4', '#a855f7', '#ef4444', '#84cc16'
];

// Map API day format to schedule format
const formatDaySchedule = (dayFld: string): string => {
  if (!dayFld) return '';
  
  // API format: "Tue", "Mon,Tue", "Sat", etc.
  // UI format: "T", "MT", "Sat", etc.
  const dayMap: Record<string, string> = {
    'Mon': 'M',
    'Tue': 'T',
    'Wed': 'W',
    'Thu': 'Th',
    'Fri': 'F',
    'Sat': 'Sat',
    'Sun': 'Sun',
  };
  
  return dayFld.split(',').map(day => dayMap[day.trim()] || day.trim()).join('');
};

// Transform API class to Course type
const transformClassToCourse = (cls: StudentClass, index: number): Course => {
  const schedule = formatDaySchedule(cls.day_fld || '');
  const time = `${cls.starttime_fld || ''} - ${cls.endtime_fld || ''}`;
  
  // Extract instructor name (remove title if present)
  const instructor = cls.faculty_fld?.trim() || '';
  
  return {
    id: cls.classcode_fld || '',
    code: cls.subjcode_fld || '',
    name: cls.subjdesc_fld || '',
    instructor,
    schedule,
    time,
    room: cls.room_fld || '',
    color: courseColors[index % courseColors.length],
  };
};

export default function Classes() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes data
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get current user (student ID)
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please login to view your classes');
        setLoading(false);
        return;
      }

      const studentId = user.id;

      // Step 2: Get settings (academic year & semester)
      const settingsResponse = await generalService.getSettings();
      if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) {
        setError('Failed to load settings');
        setLoading(false);
        return;
      }

      const settings = settingsResponse.data as SettingsResponse;
      const activeSetting = settings.setting;
      const academicYear = activeSetting?.acadyear_fld || '';
      const semester = activeSetting?.sem_fld || '';

      if (!academicYear || !semester) {
        setError('Academic year or semester not found');
        setLoading(false);
        return;
      }

      // Step 3: Get student classes
      const classesResponse = await lampService.getStudentClasses({
        p_id: studentId,
        p_ay: academicYear,
        p_sem: String(semester),
      });

      if (classesResponse.status.rem !== 'success') {
        const errorMsg = classesResponse.status.msg || 'Failed to load classes';
        if (classesResponse.status.sys && classesResponse.status.sys.includes('Table')) {
          setError('Service temporarily unavailable. Please try again later.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
        return;
      }

      if (!classesResponse.data || !Array.isArray(classesResponse.data)) {
        setError('No classes data returned');
        setLoading(false);
        return;
      }

      const classes = classesResponse.data as StudentClass[];
      
      if (classes.length === 0) {
        setError('No classes found for this academic year and semester');
        setLoading(false);
        return;
      }

      // Transform and sort classes
      const transformedCourses = classes.map((cls, index) => transformClassToCourse(cls, index));
      const sortedCourses = transformedCourses.sort((a, b) => {
        const dayDiff = getDayOrder(a.schedule) - getDayOrder(b.schedule);
        if (dayDiff !== 0) return dayDiff;
        return getTimeValue(a.time) - getTimeValue(b.time);
      });

      setCourses(sortedCourses);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      if (err?.data?.status?.sys && err.data.status.sys.includes('Table')) {
        setError('Service temporarily unavailable. Please try again later.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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

      {/* Loading state */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4285F4" />
          <Text className="text-millionGrey text-base mt-4">Loading classes...</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-base mb-2 text-center">{error}</Text>
          <Pressable
            onPress={fetchClasses}
            className="bg-metalDeluxe rounded-full px-6 py-3 mt-4"
          >
            <Text className="text-white text-base">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Classes list */}
      {!loading && !error && filteredCourses.length > 0 && (
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
      )}

      {/* Empty state */}
      {!loading && !error && filteredCourses.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-millionGrey text-base">
            {search ? 'No courses found matching your search.' : 'No courses found.'}
          </Text>
        </View>
      )}
    </View>
  );
}
