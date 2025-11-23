import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { authService, generalService, lampService } from "../services";
import { SettingsResponse, StudentClass } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";

type Event = { timeStart: string; timeEnd: string; room: string; course?: string; borderColor?: string; };

type DaySchedule = { day: string; events: Event[]; };

// Color palette for courses (matching classes tab)
const courseColors = [
  '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', 
  '#06b6d4', '#a855f7', '#ef4444', '#84cc16'
];

// Border color classes mapping
const borderColorClasses = [
  'border-starfleetBlue', 'border-thickPink', 'border-princetonOrange', 
  'border-reddishPink', 'border-seljukBlue', 'border-metalDeluxe',
  'border-crystalBell', 'border-mettwurst', 'border-saltBlue', 'border-millionGrey'
];

// Day name mapping from API format to full day names
const dayNameMap: Record<string, string> = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday',
};

// Day order for sorting
const dayOrder: Record<string, number> = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 7,
};

// Convert time string to minutes for sorting
const timeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + parseInt(minutes || '0');
};

// Transform classes to schedule events grouped by day
const transformClassesToSchedule = (classes: StudentClass[]): DaySchedule[] => {
  const dayEventsMap: Record<string, Event[]> = {};

  classes.forEach((cls, index) => {
    const days = cls.day_fld?.split(',').map(d => d.trim()) || [];
    const timeStart = cls.starttime_fld || '';
    const timeEnd = cls.endtime_fld || '';
    const room = cls.room_fld || '';
    const course = cls.subjdesc_fld || '';
    const borderColor = borderColorClasses[index % borderColorClasses.length];

    // Create an event for each day the class meets
    days.forEach(dayAbbr => {
      const fullDayName = dayNameMap[dayAbbr] || dayAbbr;
      
      if (!dayEventsMap[fullDayName]) {
        dayEventsMap[fullDayName] = [];
      }

      dayEventsMap[fullDayName].push({
        timeStart,
        timeEnd,
        room,
        course,
        borderColor,
      });
    });
  });

  // Convert to array and sort events by time within each day
  const schedule: DaySchedule[] = Object.keys(dayEventsMap)
    .map(day => ({
      day,
      events: dayEventsMap[day].sort((a, b) => 
        timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart)
      ),
    }))
    .sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));

  return schedule;
};

export default function Schedule() {
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedule data
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get current user (student ID)
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please login to view your schedule');
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
        const errorMsg = classesResponse.status.msg || 'Failed to load schedule';
        if (classesResponse.status.sys && classesResponse.status.sys.includes('Table')) {
          setError('Service temporarily unavailable. Please try again later.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
        return;
      }

      if (!classesResponse.data || !Array.isArray(classesResponse.data)) {
        setError('No schedule data returned');
        setLoading(false);
        return;
      }

      const classes = classesResponse.data as StudentClass[];
      
      if (classes.length === 0) {
        setError('No classes found for this academic year and semester');
        setLoading(false);
        return;
      }

      // Transform classes to schedule format
      const schedule = transformClassesToSchedule(classes);
      setScheduleData(schedule);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
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
    fetchSchedule();
  }, []);

  return (
    <ScrollView className="flex-1 px-6 mb-2" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} >
      {/* Loading state */}
      {loading && (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#4285F4" />
          <Text className="text-millionGrey text-base mt-4">Loading schedule...</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View className="flex-1 items-center justify-center py-20 px-6">
          <Text className="text-red-600 text-base mb-2 text-center">{error}</Text>
          <Pressable
            onPress={fetchSchedule}
            className="bg-metalDeluxe rounded-full px-6 py-3 mt-4"
          >
            <Text className="text-white text-base">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Schedule */}
      {!loading && !error && scheduleData.map((day) => (
        <View key={day.day}>
          {/* day header */}
          <View className="flex-row items-center">
            <Text className="text-2xl text-twilightZone font-bold tracking-tighter mr-4">
              {day.day}
            </Text>
            <View className="flex-1 border-t border-dashed border-crystalBell" />
          </View>

          {/* class schedule */}
          <View className="flex flex-col gap-4 my-6">
            {day.events.map((event, idx) => (
              <View key={idx} className="flex-row">
                {/* time */}
                <View className={`w-20 border-r-2 ${event.borderColor}`}>
                  <Text className="text-twilightZone text-base font-medium">
                    {event.timeStart}
                  </Text>
                  <Text className="text-twilightZone text-base font-medium">
                    {event.timeEnd}
                  </Text>
                </View>

                {/* room & course */}
                <View className="flex-1 pl-4">
                  <Text className="text-millionGrey text-base flex-shrink">
                    {event.room}
                  </Text>
                  {event.course && (
                    <Text className="text-twilightZone text-base font-medium flex-shrink">
                      {event.course}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Empty state */}
      {!loading && !error && scheduleData.length === 0 && (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-millionGrey text-base">No schedule found.</Text>
        </View>
      )}
    </ScrollView>
  );
}
