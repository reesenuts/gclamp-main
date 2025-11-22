import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { authService, generalService, lampService } from "../services";
import { SettingsResponse, StudentClass, TodoListItem } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";

type TodoStatus = 'not_started' | 'missing' | 'completed';

type TodoItem = {
  id: string;
  courseName: string;
  courseCode: string;
  activityName: string;
  dueDate: string;
  dueTime: string;
  color: string;
  status: TodoStatus;
  date: string; // date for grouping (e.g., "November 15, Saturday")
  points: number;
  grade?: number;
  submittedDate?: string;
  postedDate?: string;
};

// map activity status to todo status
const mapStatus = (status: string): TodoStatus => {
  switch (status) {
    case 'not_started':
      return 'not_started';
    case 'missing':
      return 'missing';
    case 'late':
      return 'missing';
    case 'done':
      return 'completed';
    default:
      return 'not_started';
  }
};

export default function ToDoList() {
  // active tab state
  const [activeTab, setActiveTab] = useState<TodoStatus>('not_started');
  
  // API data states
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Course mapping for colors (will be populated from classes)
  const [courseDataMap, setCourseDataMap] = useState<Record<string, { name: string; color: string }>>({});
  
  // Color palette for courses
  const courseColors = [
    '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', 
    '#06b6d4', '#a855f7', '#ef4444', '#84cc16'
  ];

  // map todo status to activity status
  const mapTodoStatusToActivityStatus = (status: TodoStatus): string => {
    switch (status) {
      case 'not_started':
        return 'not_started';
      case 'missing':
        return 'missing';
      case 'completed':
        return 'done';
      default:
        return 'not_started';
    }
  };

  // Format date from API (MySQL datetime format) to display format
  const formatDateFromAPI = (dateStr: string): { date: string; time: string; formatted: string } => {
    if (!dateStr) return { date: '', time: '', formatted: '' };
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { date: dateStr, time: '', formatted: dateStr };
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      const dayNum = date.getDate();
      const year = date.getFullYear();
      
      // Format time
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      const time = `${displayHours}:${displayMinutes} ${ampm}`;
      
      // Format date for grouping
      const dateForGrouping = `${monthName} ${dayNum}, ${dayName}`;
      
      // Format for display (e.g., "Nov 15, 2025, 11:59 PM")
      const monthAbbr = monthName.substring(0, 3);
      const formatted = `${monthAbbr} ${dayNum}, ${year}, ${time}`;
      
      return {
        date: dateForGrouping,
        time,
        formatted
      };
    } catch (e) {
      return { date: dateStr, time: '', formatted: dateStr };
    }
  };

  // Transform API todo item to TodoItem
  const transformTodoItem = (apiTodo: TodoListItem, classInfo?: StudentClass): TodoItem => {
    const classcode = apiTodo.classcode_fld || '';
    const courseInfo = courseDataMap[classcode] || {
      name: apiTodo.subjdesc_fld || classcode,
      color: courseColors[Math.abs(classcode.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % courseColors.length]
    };
    
    // Determine status based on submission
    let status: TodoStatus = 'not_started';
    if (apiTodo.issubmitted_fld === 1) {
      status = 'completed';
    } else if (apiTodo.deadline_fld) {
      const deadline = new Date(apiTodo.deadline_fld);
      const now = new Date();
      if (now > deadline) {
        status = 'missing';
      }
    }
    
    const deadlineDate = formatDateFromAPI(apiTodo.deadline_fld || '');
    const postedDate = formatDateFromAPI(apiTodo.datetime_fld || '');
    const submittedDate = apiTodo.datetime_submitted ? formatDateFromAPI(apiTodo.datetime_submitted).formatted : undefined;
    
    return {
      id: apiTodo.actcode_fld || '',
      courseName: courseInfo.name,
      courseCode: apiTodo.subjcode_fld || classcode,
      activityName: apiTodo.title_fld || '',
      dueDate: deadlineDate.formatted,
      dueTime: deadlineDate.time,
      color: courseInfo.color,
      status,
      date: deadlineDate.date,
      points: apiTodo.totalscore_fld || 0,
      grade: apiTodo.isscored_fld === 1 ? apiTodo.score_fld : undefined,
      submittedDate,
      postedDate: postedDate.formatted,
    };
  };

  // Fetch todo list data
  const fetchTodoList = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get current user (student ID)
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please login to view your todo list');
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
        p_sem: String(semester), // Ensure semester is a string
      });

      if (classesResponse.status.rem !== 'success') {
        // Check if it's a database/system error
        const errorMsg = classesResponse.status.msg || 'Failed to load classes';
        // Don't expose SQL errors to users, show generic message
        if (classesResponse.status.sys && classesResponse.status.sys.includes('Table')) {
          setError('Service temporarily unavailable. Please try again later.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
        return;
      }

      // Check if data exists and is an array
      if (!classesResponse.data) {
        setError('No classes data returned');
        setLoading(false);
        return;
      }

      const classes = Array.isArray(classesResponse.data) 
        ? classesResponse.data as StudentClass[]
        : [];

      if (classes.length === 0) {
        setError('No classes found for this academic year and semester');
        setLoading(false);
        return;
      }
      
      // Step 4: Build course data map and extract class codes
      const courseMap: Record<string, { name: string; color: string }> = {};
      const classCodes: string[] = [];

      classes.forEach((cls, index) => {
        const classcode = cls.classcode_fld;
        if (classcode) {
          classCodes.push(classcode);
          courseMap[classcode] = {
            name: cls.subjdesc_fld || cls.subjcode_fld || classcode,
            color: courseColors[index % courseColors.length],
          };
        }
      });

      setCourseDataMap(courseMap);

      // Step 5: Format class codes as "(40292, 40297, 40298)"
      const formattedClassCodes = `(${classCodes.join(', ')})`;

      // Step 6: Get todo list
      const todoResponse = await lampService.getTodoList({
        p_classcodes: formattedClassCodes,
        p_id: studentId,
      });

      if (todoResponse.status.rem !== 'success' || !todoResponse.data) {
        setError('No todos found');
        setLoading(false);
        return;
      }

      const apiTodos = todoResponse.data as TodoListItem[];
      
      // Step 7: Transform API data to TodoItem format
      const transformedTodos = apiTodos.map(todo => {
        const classInfo = classes.find(c => c.classcode_fld === todo.classcode_fld);
        return transformTodoItem(todo, classInfo);
      });

      setTodos(transformedTodos);
    } catch (err: any) {
      console.error('Error fetching todo list:', err);
      
      // Check if it's a database/system error (don't expose SQL errors to users)
      if (err?.data?.status?.sys && err.data.status.sys.includes('Table')) {
        setError('Service temporarily unavailable. Please try again later.');
      } else {
        // Use the error handler utility to get user-friendly message
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, []);

  // handle todo click - navigate to activity detail
  const handleTodoClick = (todo: TodoItem) => {
    router.push({
      pathname: '/components/classes/activities/activity-detail',
      params: {
        activityId: todo.id,
        title: todo.activityName,
        activityName: todo.activityName,
        dueDate: todo.dueDate,
        points: todo.points.toString(),
        status: mapTodoStatusToActivityStatus(todo.status),
        grade: todo.grade?.toString() || '',
        submittedDate: todo.submittedDate || '',
        postedDate: todo.postedDate || '',
        courseCode: todo.courseCode,
        courseName: todo.courseName,
      }
    });
  };

  // Filter todos by active tab
  const filteredTodos = todos.filter(todo => todo.status === activeTab);

  // group todos by date
  const groupedTodos = filteredTodos.reduce((acc, todo) => {
    if (!acc[todo.date]) {
      acc[todo.date] = [];
    }
    acc[todo.date].push(todo);
    return acc;
  }, {} as Record<string, TodoItem[]>);

  // sort dates
  const sortedDates = Object.keys(groupedTodos).sort((a, b) => {
    // format: "November 15, Saturday"
    const datePartA = a.split(',')[0]; // "November 15"
    const datePartB = b.split(',')[0]; // "November 15"
    
    // parse month name and day
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const partsA = datePartA.split(' ');
    const partsB = datePartB.split(' ');
    
    const monthA = monthNames.indexOf(partsA[0]);
    const dayA = parseInt(partsA[1]);
    const monthB = monthNames.indexOf(partsB[0]);
    const dayB = parseInt(partsB[1]);
    
    // compare dates (using 2025 as year for comparison)
    const dateA = new Date(2025, monthA, dayA);
    const dateB = new Date(2025, monthB, dayB);
    
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <View className="flex-1 bg-white">
      {/* tabs */}
      <View className="flex-row px-6 pb-0 border-b border-crystalBell">
        <Pressable
          onPress={() => setActiveTab('not_started')}
          className="flex-1 items-center pb-3"
        >
          <Text className={`text-base font-semibold ${activeTab === 'not_started' ? 'text-seljukBlue' : 'text-millionGrey'}`}>
            Not Started
          </Text>
          <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${activeTab === 'not_started' ? 'bg-seljukBlue' : ''}`} />
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('missing')}
          className="flex-1 items-center pb-3"
        >
          <Text className={`text-base font-semibold ${activeTab === 'missing' ? 'text-seljukBlue' : 'text-millionGrey'}`}>
            Missings
          </Text>
          <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${activeTab === 'missing' ? 'bg-seljukBlue' : ''}`} />
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('completed')}
          className="flex-1 items-center pb-3"
        >
          <Text className={`text-base font-semibold ${activeTab === 'completed' ? 'text-seljukBlue' : 'text-millionGrey'}`}>
            Completed
          </Text>
          <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${activeTab === 'completed' ? 'bg-seljukBlue' : ''}`} />
        </Pressable>
      </View>

      {/* todo list */}
      <ScrollView className="flex-1 mb-2" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Loading state */}
          {loading && (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#4285F4" />
              <Text className="text-millionGrey text-base mt-4">Loading todos...</Text>
            </View>
          )}

          {/* Error state */}
          {!loading && error && (
            <View className="items-center justify-center py-20">
              <Text className="text-red-600 text-base mb-2">{error}</Text>
              <Pressable
                onPress={fetchTodoList}
                className="bg-metalDeluxe rounded-full px-6 py-3 mt-4"
              >
                <Text className="text-white text-base">Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Todo list */}
          {!loading && !error && sortedDates.map((date) => (
            <View key={date} className="mb-6">
              {/* date header - red for missing tab */}
              <Text className={`text-sm font-semibold mb-2 ${activeTab === 'missing' ? 'text-mettwurst' : 'text-millionGrey'}`}>
                {date}
              </Text>
              
              {/* todos for this date */}
              {groupedTodos[date].map((todo) => {
                // determine if completed task was on-time or late
                // for completed tasks, check if submitted on time
                let isOnTime = false;
                let isLate = false;
                if (todo.status === 'completed') {
                  // if grade exists and is good, assume on-time; if grade is low, might be late
                  // for simplicity, if submittedDate exists, show as on-time
                  isOnTime = !!todo.submittedDate && (todo.grade === undefined || todo.grade >= 70);
                  isLate = !!todo.submittedDate && !isOnTime;
                }
                
                return (
                  <Pressable
                    key={todo.id}
                    onPress={() => handleTodoClick(todo)}
                    className="flex-row mb-3 bg-white rounded-xl border border-crystalBell p-4"                  >
                    {/* colored vertical line */}
                    <View
                      className="w-1 rounded-full mr-4"
                      style={{ backgroundColor: todo.color }}
                    />
                    
                    {/* todo content */}
                    <View className="flex-1 mr-3">
                      <Text className="text-twilightZone font-semibold text-base">
                        {todo.courseName}
                      </Text>
                      <Text className="text-millionGrey text-sm">
                        {todo.activityName}
                      </Text>
                    </View>
                    
                    {/* time and status on the right */}
                    <View className="items-end justify-center">
                      <Text className="text-millionGrey text-xs font-medium mb-1">
                        {todo.dueTime}
                      </Text>
                      {/* status badge for completed items */}
                      {todo.status === 'completed' && (
                        <Text className={`text-xs font-semibold ${isLate ? 'text-mettwurst' : 'text-seljukBlue'}`}>
                          {isLate ? 'Late' : 'On-Time'}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* empty state */}
          {!loading && !error && sortedDates.length === 0 && (
            <View className="items-center justify-center py-10">
              <Text className="text-millionGrey text-base">
                No {activeTab === 'not_started' ? 'tasks' : activeTab === 'missing' ? 'missing tasks' : 'completed tasks'} found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
