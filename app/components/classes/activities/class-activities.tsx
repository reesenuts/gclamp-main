import { router, useFocusEffect } from "expo-router";
import { Clock } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { authService, generalService, lampService } from "../../../services";
import { SettingsResponse } from "../../../types/api";
import { getErrorMessage } from "../../../utils/errorHandler";

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
  classcode?: string; // Optional - will be fetched if not provided
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

// Format date from API (MySQL datetime format) to display format
const formatDateFromAPI = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const time = `${displayHours}:${displayMinutes} ${ampm}`;
    
    return `${month} ${day}, ${year}, ${time}`;
  } catch {
    return dateStr;
  }
};

// Determine activity status based on submission data
// submissionMap: Map of actcode_fld (from submissions) -> submission data
// Note: Activities have empty actcode_fld, so we use recno_fld to match with submission's actcode_fld
const determineStatus = (apiActivity: any, submissionMap?: Map<string, any>): ActivityStatus => {
  // Check if there's a submission for this activity
  // Use recno_fld from activity to match with actcode_fld from submission
  // (actcode_fld in activities is empty, but recno_fld contains the actual activity ID)
  const activityId = apiActivity.recno_fld?.toString() || apiActivity.actcode_fld?.toString();
  const submission = submissionMap?.get(activityId);
  const isSubmitted = !!submission;
  
  if (isSubmitted) {
    // Check if submitted late
    if (apiActivity.deadline_fld && submission.datetime_fld) {
      const deadline = new Date(apiActivity.deadline_fld);
      const submitted = new Date(submission.datetime_fld);
      if (submitted > deadline) {
        return 'late';
      }
    }
    return 'done';
  } else if (apiActivity.deadline_fld) {
    const deadline = new Date(apiActivity.deadline_fld);
    const now = new Date();
    if (now > deadline) {
      return 'missing';
    }
  }
  return 'not_started';
};

// Transform API activity to Activity type
// submissionMap: Map of actcode_fld (from submissions) -> submission data
// Note: Activities have empty actcode_fld, so we use recno_fld to match with submission's actcode_fld
const transformActivity = (apiActivity: any, submissionMap?: Map<string, any>): Activity => {
  const status = determineStatus(apiActivity, submissionMap);
  // Use recno_fld from activity to match with actcode_fld from submission
  const activityId = apiActivity.recno_fld?.toString() || apiActivity.actcode_fld?.toString();
  const submission = submissionMap?.get(activityId);
  
  return {
    id: apiActivity.actcode_fld?.toString() || apiActivity.recno_fld?.toString() || '',
    title: apiActivity.title_fld || '',
    description: apiActivity.desc_fld || '',
    dueDate: formatDateFromAPI(apiActivity.deadline_fld || ''),
    points: apiActivity.totalscore_fld || 0,
    status,
    grade: apiActivity.isscored_fld === 1 ? apiActivity.score_fld : undefined,
    submittedDate: submission?.datetime_fld ? formatDateFromAPI(submission.datetime_fld) : undefined,
    postedDate: formatDateFromAPI(apiActivity.datetime_fld || ''),
  };
};

export default function ClassActivities({ courseCode, courseName, classcode }: ClassActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get classcode - either from prop or fetch it
  const [actualClasscode, setActualClasscode] = useState<string | null>(classcode || null);

  // Fetch classcode if not provided
  useEffect(() => {
    const fetchClasscode = async () => {
      if (classcode) {
        setActualClasscode(classcode);
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const settingsResponse = await generalService.getSettings();
        if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) return;

        const settings = settingsResponse.data as SettingsResponse;
        const academicYear = settings.setting?.acadyear_fld || '';
        const semester = settings.setting?.sem_fld || '';

        if (!academicYear || !semester) return;

        const classesResponse = await lampService.getStudentClasses({
          p_id: user.id,
          p_ay: academicYear,
          p_sem: String(semester),
        });

        if (classesResponse.status.rem === 'success' && classesResponse.data) {
          const classes = Array.isArray(classesResponse.data) ? classesResponse.data : [];
          const matchedClass = classes.find((cls: any) => cls.subjcode_fld === courseCode);
          if (matchedClass?.classcode_fld) {
            setActualClasscode(matchedClass.classcode_fld);
          }
        }
      } catch (err) {
        console.error('Error fetching classcode:', err);
      }
    };

    fetchClasscode();
  }, [classcode, courseCode]);

  // Fetch activities (wrapped in useCallback for useFocusEffect)
  const fetchActivities = useCallback(async () => {
    if (!actualClasscode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch activities and submissions in parallel
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please login to view activities');
        setLoading(false);
        return;
      }

      const [activitiesResponse, submissionsResponse] = await Promise.all([
        lampService.getClassActivities({
          p_classcode: actualClasscode,
        }),
        lampService.getAllSubmissions({
          p_classcodes: `(${actualClasscode})`,
          p_id: user.id,
        }),
      ]);

      // Handle "No Records" case for activities
      if (activitiesResponse.status.rem !== 'success') {
        // Check if it's "No Records" - that's okay, just means no activities
        if (activitiesResponse.status.msg?.includes('No Records') || 
            activitiesResponse.status.msg?.includes('no records')) {
          setActivities([]);
          setLoading(false);
          return;
        }
        setError(activitiesResponse.status.msg || 'Failed to load activities');
        setLoading(false);
        return;
      }

      // Handle null data (no activities)
      const apiActivities = activitiesResponse.data && Array.isArray(activitiesResponse.data)
        ? activitiesResponse.data
        : [];

      // Build submission map: actcode_fld -> submission data
      const submissionMap = new Map<string, any>();
      // Handle "No Records" case - that's okay, just means no submissions
      if (submissionsResponse.status.rem === 'success' && submissionsResponse.data) {
        const submissions = Array.isArray(submissionsResponse.data) 
          ? submissionsResponse.data 
          : [];
        
        submissions.forEach((submission: any) => {
          // Submission's actcode_fld contains the activity ID (which matches activity's recno_fld)
          const actcode = submission.actcode_fld?.toString();
          
          if (actcode) {
            // If multiple submissions exist, keep the most recent one
            const existing = submissionMap.get(actcode);
            if (!existing || (submission.datetime_fld && existing.datetime_fld && 
                new Date(submission.datetime_fld) > new Date(existing.datetime_fld))) {
              submissionMap.set(actcode, submission);
            }
          }
        });
      } else if (submissionsResponse.status.msg?.includes('No Records') || 
                 submissionsResponse.status.msg?.includes('no records')) {
        // No submissions - that's fine, just means no activities are submitted yet
        // submissionMap will remain empty
      }

      const transformedActivities = apiActivities.map((activity) => {
        return transformActivity(activity, submissionMap);
      });
      setActivities(transformedActivities);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      const errorMsg = err?.message || err?.data?.message || '';
      if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
        setActivities([]);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [actualClasscode]);

  // Fetch activities when classcode changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Refresh activities when screen comes into focus (e.g., after submitting)
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

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
        classcode, // Pass classcode for fetching comments
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
        {/* Loading state */}
        {loading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4285F4" />
            <Text className="text-millionGrey text-base mt-4">Loading activities...</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View className="items-center justify-center py-20 px-6">
            <Text className="text-red-600 text-base mb-2 text-center">{error}</Text>
            <Pressable
              onPress={() => {
                setError(null);
                setLoading(true);
                // Trigger refetch
                if (actualClasscode) {
                  const fetchActivities = async () => {
                    try {
                      const activitiesResponse = await lampService.getClassActivities({
                        p_classcode: actualClasscode,
                      });
                      if (activitiesResponse.status.rem === 'success') {
                        const apiActivities = activitiesResponse.data && Array.isArray(activitiesResponse.data)
                          ? activitiesResponse.data
                          : [];
                        // Build empty submission map for this refresh (submissions will be fetched separately if needed)
                        const emptySubmissionMap = new Map<string, any>();
                        const transformedActivities = apiActivities.map((activity) => {
                          return transformActivity(activity, emptySubmissionMap);
                        });
                        setActivities(transformedActivities);
                        setError(null);
                      } else if (activitiesResponse.status.msg?.includes('No Records')) {
                        setActivities([]);
                        setError(null);
                      } else {
                        setError(activitiesResponse.status.msg || 'Failed to load activities');
                      }
                    } catch (err: any) {
                      setError(getErrorMessage(err));
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchActivities();
                }
              }}
              className="bg-metalDeluxe rounded-full px-6 py-3 mt-4"
            >
              <Text className="text-white text-base">Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Activities list */}
        {!loading && !error && (
          <>
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

            {/* Empty state */}
            {activities.length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-millionGrey text-base">No activities found.</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

