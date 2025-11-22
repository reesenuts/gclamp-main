import { router } from "expo-router";
import { Clock } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type ActivityStatus = 'done' | 'missing' | 'not_started' | 'late';

type Activity = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: ActivityStatus;
  grade?: number;
  submittedDate?: string;
  postedDate?: string;
};

type ClassActivitiesProps = {
  courseCode: string;
  courseName: string;
};

const getStatusConfig = (status: ActivityStatus) => {
  switch (status) {
    case 'done':
      return {
        label: 'DONE',
        bgColor: 'bg-dewMist',
        textColor: 'text-preciousOxley',
      };
    case 'missing':
      return {
        label: 'MISSING',
        bgColor: 'bg-ladyAnne',
        textColor: 'text-mettwurst',
      };
    case 'not_started':
      return {
        label: 'NOT STARTED',
        bgColor: 'bg-beryl',
        textColor: 'text-wet',
      };
    case 'late':
      return {
        label: 'LATE',
        bgColor: 'bg-ladyAnne',
        textColor: 'text-mettwurst',
      };
  }
};

export default function ClassActivities({ courseCode, courseName }: ClassActivitiesProps) {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      title: 'Chapter 3 Draft Submission',
      description: 'Submit your Chapter 3 draft for review',
      dueDate: 'Nov 15, 2025, 11:59 PM',
      points: 100,
      status: 'not_started',
      postedDate: 'Nov 10, 2025, 2:30 PM',
    },
    {
      id: '2',
      title: 'Midterm Quiz',
      description: 'Online quiz covering topics 1-5',
      dueDate: 'Nov 20, 2025, 11:59 PM',
      points: 50,
      status: 'not_started',
      postedDate: 'Nov 12, 2025, 9:00 AM',
    },
    {
      id: '3',
      title: 'Chapter 2 Submission',
      description: 'Final Chapter 2 submission',
      dueDate: 'Nov 1, 2025, 11:59 PM',
      points: 100,
      status: 'done',
      grade: 95,
      submittedDate: 'Nov 1, 2025',
      postedDate: 'Oct 25, 2025, 3:15 PM',
    },
    {
      id: '4',
      title: 'Research Methodology Assignment',
      description: 'Complete the research methodology worksheet',
      dueDate: 'Oct 28, 2025, 11:59 PM',
      points: 50,
      status: 'late',
      grade: 40,
      submittedDate: 'Oct 30, 2025',
      postedDate: 'Oct 15, 2025, 10:00 AM',
    },
    {
      id: '5',
      title: 'Literature Review',
      description: 'Submit literature review section',
      dueDate: 'Oct 20, 2025, 11:59 PM',
      points: 100,
      status: 'missing',
      postedDate: 'Oct 5, 2025, 1:45 PM',
    },
  ]);

  const handleActivityClick = (activity: Activity) => {
    router.push({
      pathname: '/components/classes/activities/activity-detail',
      params: {
        activityId: activity.id,
        title: activity.title,
        description: activity.description,
        dueDate: activity.dueDate,
        points: activity.points.toString(),
        status: activity.status,
        grade: activity.grade?.toString() || '',
        submittedDate: activity.submittedDate || '',
        postedDate: activity.postedDate || '',
        courseCode,
        courseName,
      }
    });
  };

  const upcomingActivities = activities.filter(a => a.status === 'not_started');
  const completedActivities = activities.filter(a => a.status === 'done' || a.status === 'late');
  const missingActivities = activities.filter(a => a.status === 'missing');

  const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
  const earnedPoints = activities
    .filter(a => a.grade !== undefined)
    .reduce((sum, a) => sum + (a.grade || 0), 0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* missing activities */}
        {missingActivities.length > 0 && (
          <View className="mb-6">
            <Text className="text-mettwurst text-sm font-semibold mb-3">
              MISSING ({missingActivities.length})
            </Text>
            {missingActivities.map((activity) => {
              const statusConfig = getStatusConfig(activity.status);
              return (
                <Pressable 
                  key={activity.id} 
                  onPress={() => handleActivityClick(activity)} 
                  className="bg-white rounded-2xl border border-crystalBell p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                      <Text className="text-twilightZone font-semibold text-base mb-2">
                        {activity.title}
                      </Text>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#7D7C78" weight="regular" />
                        <Text className="text-moonBase text-sm ml-1">
                          {activity.dueDate}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View className={`${statusConfig.bgColor} px-3 py-1 rounded-full`}>
                        <Text className={`${statusConfig.textColor} text-xs font-semibold`}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* upcoming activities */}
        {upcomingActivities.length > 0 && (
          <View className="mb-6">
            <Text className="text-wet text-sm font-semibold mb-3">
              UPCOMING ({upcomingActivities.length})
            </Text>
            {upcomingActivities.map((activity) => {
              const statusConfig = getStatusConfig(activity.status);
              return (
                <Pressable 
                  key={activity.id} 
                  onPress={() => handleActivityClick(activity)} 
                  className="bg-white rounded-2xl border border-crystalBell p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                      <Text className="text-twilightZone font-semibold text-base mb-2">
                        {activity.title}
                      </Text>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#999999" weight="regular" />
                        <Text className="text-millionGrey text-sm ml-1">
                          {activity.dueDate}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View className={`${statusConfig.bgColor} px-3 py-1 rounded-full`}>
                        <Text className={`${statusConfig.textColor} text-xs font-semibold`}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* completed activities */}
        {completedActivities.length > 0 && (
          <View>
            <Text className="text-wet text-sm font-semibold mb-3">
              COMPLETED ({completedActivities.length})
            </Text>
            {completedActivities.map((activity) => {
              const statusConfig = getStatusConfig(activity.status);
              return (
                <Pressable 
                  key={activity.id} 
                  onPress={() => handleActivityClick(activity)} 
                  className="bg-white rounded-2xl border border-crystalBell p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                      <Text className="text-twilightZone font-semibold text-base mb-2">
                        {activity.title}
                      </Text>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#999999" weight="regular" />
                        <Text className="text-millionGrey text-sm ml-1">
                          {activity.submittedDate}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View className={`${statusConfig.bgColor} px-3 py-1 rounded-full`}>
                        <Text className={`${statusConfig.textColor} text-xs font-semibold`}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

