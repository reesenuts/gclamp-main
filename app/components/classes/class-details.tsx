import { router, useLocalSearchParams } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService, generalService, lampService } from "../../services";
import { SettingsResponse, StudentClass } from "../../types/api";
import { getErrorMessage } from "../../utils/errorHandler";
import ClassActivities from "./activities/class-activities";
import ClassFeed from "./class-feed/class-feed";
import ClassStudents from "./class-list";
import ClassNavbar from "./class-navbar";
import ClassResources from "./class-resources";

type TabType = 'feed' | 'activities' | 'resources' | 'classlist' | 'details';

type CourseDetails = {
  classCode: string;
  courseCode: string;
  courseDescription: string;
  lecUnits: number;
  labUnits: number;
  rleUnits: number;
  day: string;
  time: string;
  block: string;
  room: string;
  faculty: string;
  facultyEmail: string;
};

export default function ClassDetail() {
  const params = useLocalSearchParams();
  // get initial tab from params or default to 'feed'
  const initialTab = (params.initialTab as TabType) || 'feed';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

  // update tab when initialTab param changes
  useEffect(() => {
    if (params.initialTab) {
      setActiveTab(params.initialTab as TabType);
    }
  }, [params.initialTab]);

  const course = {
    code: params.code as string,
    name: params.name as string,
    instructor: params.instructor as string,
    schedule: params.schedule as string,
    time: params.time as string,
    room: params.room as string,
    classcode: params.classcode as string,
  };

  // Format day schedule (e.g., "Mon,Tue" -> "MT")
  const formatDaySchedule = (dayStr: string): string => {
    if (!dayStr) return '';
    const dayMap: { [key: string]: string } = {
      'Mon': 'M',
      'Tue': 'T',
      'Wed': 'W',
      'Thu': 'Th',
      'Fri': 'F',
      'Sat': 'S',
      'Sun': 'Su',
    };
    return dayStr.split(',').map(d => dayMap[d.trim()] || d.trim()).join('');
  };

  // Format time (e.g., "4:00 PM" -> "4:00 PM - 5:00 PM")
  const formatTimeRange = (start: string, end: string): string => {
    if (!start || !end) return start || end || '';
    return `${start} - ${end}`;
  };

  // Transform API class data to CourseDetails
  const transformClassToDetails = (classData: StudentClass): CourseDetails => {
    return {
      classCode: classData.classcode_fld || '',
      courseCode: classData.subjcode_fld || '',
      courseDescription: classData.subjdesc_fld || '',
      lecUnits: parseFloat(classData.lecunits_fld?.toString() || '0') || 0,
      labUnits: parseFloat(classData.labunits_fld?.toString() || '0') || 0,
      rleUnits: parseFloat(classData.rleunits_fld?.toString() || '0') || 0,
      day: formatDaySchedule(classData.day_fld || ''),
      time: formatTimeRange(classData.starttime_fld || '', classData.endtime_fld || ''),
      block: classData.block_fld || '',
      room: classData.room_fld || '',
      faculty: classData.faculty_fld || '',
      facultyEmail: classData.email_fld || '',
    };
  };

  // Fetch class details from API
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!course.classcode || activeTab !== 'details') {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get current user (student ID)
        const user = await authService.getCurrentUser();
        if (!user) {
          setError('Please login to view class details');
          setLoading(false);
          return;
        }

        // Get settings (academic year & semester)
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

        // Get student classes
        const classesResponse = await lampService.getStudentClasses({
          p_id: user.id,
          p_ay: academicYear,
          p_sem: String(semester),
        });

        if (classesResponse.status.rem !== 'success' || !classesResponse.data) {
          setError(classesResponse.status.msg || 'Failed to load class details');
          setLoading(false);
          return;
        }

        const classes = Array.isArray(classesResponse.data) ? classesResponse.data : [];
        
        // Find the class matching the classcode
        const matchedClass = classes.find((cls: StudentClass) => 
          cls.classcode_fld?.toString() === course.classcode
        );

        if (matchedClass) {
          const details = transformClassToDetails(matchedClass);
          setCourseDetails(details);
        } else {
          setError('Class details not found');
        }
      } catch (err: any) {
        console.error('Error fetching class details:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when details tab is active
    if (activeTab === 'details') {
      fetchClassDetails();
    }
  }, [course.classcode, activeTab]);

  // render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <ClassFeed 
          courseCode={course.code}
          classcode={params.classcode as string}
          instructor={course.instructor}
          highlightPostId={params.highlightPostId as string}
          highlightCommentId={params.highlightCommentId as string}
          highlightReplyId={params.highlightReplyId as string}
        />;
      case 'activities':
        return <ClassActivities courseCode={course.code} courseName={course.name} classcode={params.classcode as string} />;
      case 'resources':
        return <ClassResources courseCode={course.code} classcode={params.classcode as string} />;
      case 'classlist':
        return <ClassStudents instructor={course.instructor} classcode={params.classcode as string} />;
      case 'details':
        return (
          <ScrollView className="flex-1 bg-white mb-2" showsVerticalScrollIndicator={false}>
            <View className="px-6 py-8">
              {loading ? (
                <View className="items-center justify-center py-20">
                  <ActivityIndicator size="large" color="#4285F4" />
                  <Text className="text-millionGrey mt-4">Loading class details...</Text>
                </View>
              ) : error ? (
                <View className="items-center justify-center py-20">
                  <Text className="text-red-600 text-base text-center mb-4">{error}</Text>
                </View>
              ) : courseDetails ? (
                <View>
                  {/* class information section */}
                  <View className="mb-6">
                    <Text className="text-millionGrey text-sm font-medium mb-2">Class Information</Text>
                    <View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Course Name</Text>
                        <Text className="text-moonBase text-base">{courseDetails.courseDescription}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Course Code</Text>
                        <Text className="text-moonBase text-base">{courseDetails.courseCode}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Class Code</Text>
                        <Text className="text-moonBase text-base">{courseDetails.classCode}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Units</Text>
                        <Text className="text-moonBase text-base">
                          {[
                            courseDetails.lecUnits > 0 && `${courseDetails.lecUnits} Lec`,
                            courseDetails.labUnits > 0 && `${courseDetails.labUnits} Lab`,
                            courseDetails.rleUnits > 0 && `${courseDetails.rleUnits} RLE`
                          ].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl">
                        <Text className="text-millionGrey text-sm">Block</Text>
                        <Text className="text-moonBase text-base">{courseDetails.block}</Text>
                      </View>
                    </View>
                  </View>

                  {/* schedule section */}
                  <View className="mb-6">
                    <Text className="text-millionGrey text-sm font-medium mb-2">Schedule</Text>
                    <View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Day</Text>
                        <Text className="text-moonBase text-base">{courseDetails.day}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Time</Text>
                        <Text className="text-moonBase text-base">{courseDetails.time}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl">
                        <Text className="text-millionGrey text-sm">Room</Text>
                        <Text className="text-moonBase text-base">{courseDetails.room}</Text>
                      </View>
                    </View>
                  </View>

                  {/* faculty section */}
                  <View>
                    <Text className="text-millionGrey text-sm font-medium mb-2">Faculty</Text>
                    <View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl mb-2">
                        <Text className="text-millionGrey text-sm">Name</Text>
                        <Text className="text-moonBase text-base">{courseDetails.faculty}</Text>
                      </View>
                      <View className="border border-crystalBell bg-crystalBell/20 px-4 py-2 rounded-2xl">
                        <Text className="text-millionGrey text-sm">Email</Text>
                        <Text className="text-seljukBlue text-base">{courseDetails.facultyEmail}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                // fallback when course details not found
                <View>
                  {/* no details found message */}
                  <View className="mb-6">
                    <View className="border border-crystalBell bg-crystalBell/20 px-4 py-3 rounded-2xl">
                      <Text className="text-millionGrey text-base font-medium">No details found</Text>
                      <Text className="text-millionGrey text-sm">Course details are not available for this class</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* header with back button */}
      <View className="px-4 pt-4 pb-4 bg-white border-b border-crystalBell">
        <Pressable onPress={() => router.back()} className="flex-row items-center" >
          <CaretLeft size={24} color="#191815" weight="regular" />
          <Text className="text-twilightZone text-lg font-semibold ml-3 flex-1" numberOfLines={1}>
            {course.name}
          </Text>
        </Pressable>
      </View>

      {/* main content area */}
      <View className="flex-1 bg-white">
        {renderContent()}
      </View>

      {/* bottom navigation */}
      <ClassNavbar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

