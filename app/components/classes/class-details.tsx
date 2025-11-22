import { router, useLocalSearchParams } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClassActivities from "./activities/class-activities";
import ClassFeed from "./class-feed/class-feed";
import ClassStudents from "./class-list";
import ClassNavbar from "./class-navbar";
import ClassResources from "./class-resources";

type TabType = 'feed' | 'activities' | 'resources' | 'classlist' | 'details';

// course details data
const courseDetailsData: { [key: string]: {
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
} } = {
  'CSP421A': {
    classCode: '40922',
    courseCode: 'CSP421A',
    courseDescription: 'CS Thesis Writing 2 (LEC)',
    lecUnits: 1.0,
    labUnits: 0.0,
    rleUnits: 0.0,
    day: 'T',
    time: '4:00 PM - 5:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 508',
    faculty: 'Dr. Erlinda Abarintos',
    facultyEmail: 'abarintos.erlinda@gordoncollege.edu.ph',
  },
  'CSP421L': {
    classCode: '40923',
    courseCode: 'CSP421L',
    courseDescription: 'CS Thesis Writing 2 (LAB)',
    lecUnits: 0.0,
    labUnits: 2.0,
    rleUnits: 0.0,
    day: 'MT',
    time: '6:00 PM - 9:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 508',
    faculty: 'Dr. Erlinda Abarintos',
    facultyEmail: 'abarintos.erlinda@gordoncollege.edu.ph',
  },
  'CSE412A': {
    classCode: '40924',
    courseCode: 'CSE412A',
    courseDescription: 'CS Elective 6 (LEC) - AR/VR Systems',
    lecUnits: 2.0,
    labUnits: 0.0,
    rleUnits: 0.0,
    day: 'Th',
    time: '4:00 PM - 6:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 411',
    faculty: 'Mr. Loudel Manaloto',
    facultyEmail: 'manaloto.loudel@gordoncollege.edu.ph',
  },
  'CSE412L': {
    classCode: '40925',
    courseCode: 'CSE412L',
    courseDescription: 'CS Elective 6 (LAB) - AR/VR Systems',
    lecUnits: 0.0,
    labUnits: 1.0,
    rleUnits: 0.0,
    day: 'F',
    time: '9:00 AM - 12:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 507',
    faculty: 'Mr. Loudel Manaloto',
    facultyEmail: 'manaloto.loudel@gordoncollege.edu.ph',
  },
  'CSE413A': {
    classCode: '40926',
    courseCode: 'CSE413A',
    courseDescription: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
    lecUnits: 2.0,
    labUnits: 0.0,
    rleUnits: 0.0,
    day: 'MT',
    time: '5:00 PM - 6:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 505',
    faculty: 'Mr. Melner Balce',
    facultyEmail: 'balce.melner@gordoncollege.edu.ph',
  },
  'CSE413L': {
    classCode: '40927',
    courseCode: 'CSE413L',
    courseDescription: 'CS Elective 7 (LAB) - Artificial Intelligence & Machine Learning',
    lecUnits: 0.0,
    labUnits: 1.0,
    rleUnits: 0.0,
    day: 'Sat',
    time: '7:00 AM - 10:00 AM',
    block: 'BSCS 4A',
    room: 'GC Main 519',
    faculty: 'Mr. Melner Balce',
    facultyEmail: 'balce.melner@gordoncollege.edu.ph',
  },
  'CSC414': {
    classCode: '40928',
    courseCode: 'CSC414',
    courseDescription: 'CS Seminars and Educational Trips',
    lecUnits: 3.0,
    labUnits: 0.0,
    rleUnits: 0.0,
    day: 'F',
    time: '5:00 PM - 8:00 PM',
    block: 'BSCS 4A',
    room: 'GC Main 508',
    faculty: 'Dr. Erlinda Abarintos',
    facultyEmail: 'abarintos.erlinda@gordoncollege.edu.ph',
  },
};

export default function ClassDetail() {
  const params = useLocalSearchParams();
  // get initial tab from params or default to 'feed'
  const initialTab = (params.initialTab as TabType) || 'feed';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

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
  };

  // get course details from data or null
  const courseDetails = courseDetailsData[course.code] || null;

  // render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <ClassFeed 
          courseCode={course.code} 
          instructor={course.instructor}
          highlightPostId={params.highlightPostId as string}
          highlightCommentId={params.highlightCommentId as string}
          highlightReplyId={params.highlightReplyId as string}
        />;
      case 'activities':
        return <ClassActivities courseCode={course.code} courseName={course.name} />;
      case 'resources':
        return <ClassResources courseCode={course.code} />;
      case 'classlist':
        return <ClassStudents instructor={course.instructor} />;
      case 'details':
        return (
          <ScrollView className="flex-1 bg-white mb-2" showsVerticalScrollIndicator={false}>
            <View className="px-6 py-8">
              {courseDetails ? (
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

