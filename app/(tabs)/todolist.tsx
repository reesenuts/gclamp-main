import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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

// course data mapping
const courseData: Record<string, { name: string; color: string }> = {
  'CSP421A': { name: 'CS Thesis Writing 2 (LEC)', color: '#3b82f6' },
  'CSP421L': { name: 'CS Thesis Writing 2 (LAB)', color: '#3b82f6' },
  'CSE412A': { name: 'CS Elective 6 (LEC) - AR/VR Systems', color: '#ec4899' },
  'CSE412L': { name: 'CS Elective 6 (LAB) - AR/VR Systems', color: '#ec4899' },
  'CSE413A': { name: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning', color: '#8b5cf6' },
  'CSE413L': { name: 'CS Elective 7 (LAB) - Artificial Intelligence & Machine Learning', color: '#8b5cf6' },
  'CSC414': { name: 'CS Seminars and Educational Trips', color: '#f59e0b' },
};

// parse date string to extract date and time
const parseDate = (dateStr: string): { date: string; time: string } => {
  // format: "Nov 15, 2025, 11:59 PM"
  const parts = dateStr.split(', ');
  if (parts.length >= 3) {
    const monthDay = parts[0]; // "Nov 15"
    const year = parts[1]; // "2025"
    const time = parts[2]; // "11:59 PM"
    
    // parse month abbreviation and day
    const monthAbbrMap: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const monthDayParts = monthDay.split(' ');
    const monthAbbr = monthDayParts[0]; // "Nov"
    const day = parseInt(monthDayParts[1]); // 15
    const yearNum = parseInt(year); // 2025
    
    // create date object
    const dateObj = new Date(yearNum, monthAbbrMap[monthAbbr] || 0, day);
    
    // check if date is valid
    if (isNaN(dateObj.getTime())) {
      return { date: dateStr, time: time };
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = dayNames[dateObj.getDay()];
    const monthName = monthNames[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    
    return {
      date: `${monthName} ${dayNum}, ${dayName}`,
      time: time,
    };
  }
  return { date: dateStr, time: '' };
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

  // todo items data - aggregated from all courses with mock dates
  const [todos] = useState<TodoItem[]>([
    // CS Thesis Writing 2 (LEC) - CSP421A
    {
      id: 'csp421a-1',
      courseName: 'CS Thesis Writing 2 (LEC)',
      courseCode: 'CSP421A',
      activityName: 'Chapter 3 Draft Submission',
      dueDate: 'Dec 5, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#3b82f6',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 5, 2025, 11:59 PM').date,
      points: 100,
      postedDate: 'Nov 28, 2025, 2:30 PM',
    },
    {
      id: 'csp421a-2',
      courseName: 'CS Thesis Writing 2 (LEC)',
      courseCode: 'CSP421A',
      activityName: 'Chapter 2 Submission',
      dueDate: 'Nov 1, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#3b82f6',
      status: 'completed' as TodoStatus,
      date: parseDate('Nov 1, 2025, 11:59 PM').date,
      points: 100,
      grade: 95,
      submittedDate: 'Nov 1, 2025',
      postedDate: 'Oct 25, 2025, 3:15 PM',
    },
    {
      id: 'csp421a-3',
      courseName: 'CS Thesis Writing 2 (LEC)',
      courseCode: 'CSP421A',
      activityName: 'Literature Review',
      dueDate: 'Oct 20, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#3b82f6',
      status: 'missing' as TodoStatus,
      date: parseDate('Oct 20, 2025, 11:59 PM').date,
      points: 100,
      postedDate: 'Oct 5, 2025, 1:45 PM',
    },
    // CS Thesis Writing 2 (LAB) - CSP421L
    {
      id: 'csp421l-1',
      courseName: 'CS Thesis Writing 2 (LAB)',
      courseCode: 'CSP421L',
      activityName: 'Chapter 3 Draft Submission',
      dueDate: 'Dec 5, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#3b82f6',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 5, 2025, 11:59 PM').date,
      points: 100,
      postedDate: 'Nov 28, 2025, 2:30 PM',
    },
    {
      id: 'csp421l-2',
      courseName: 'CS Thesis Writing 2 (LAB)',
      courseCode: 'CSP421L',
      activityName: 'Chapter 2 Submission',
      dueDate: 'Nov 1, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#3b82f6',
      status: 'completed' as TodoStatus,
      date: parseDate('Nov 1, 2025, 11:59 PM').date,
      points: 100,
      grade: 95,
      submittedDate: 'Nov 1, 2025',
      postedDate: 'Oct 25, 2025, 3:15 PM',
    },
    // CS Elective 6 (LEC) - CSE412A
    {
      id: 'cse412a-1',
      courseName: 'CS Elective 6 (LEC) - AR/VR Systems',
      courseCode: 'CSE412A',
      activityName: 'Midterm Quiz',
      dueDate: 'Dec 10, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#ec4899',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 10, 2025, 11:59 PM').date,
      points: 50,
      postedDate: 'Nov 30, 2025, 9:00 AM',
    },
    {
      id: 'cse412a-2',
      courseName: 'CS Elective 6 (LEC) - AR/VR Systems',
      courseCode: 'CSE412A',
      activityName: 'AR/VR Fundamentals Assignment',
      dueDate: 'Nov 25, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#ec4899',
      status: 'not_started' as TodoStatus,
      date: parseDate('Nov 25, 2025, 11:59 PM').date,
      points: 75,
      postedDate: 'Nov 18, 2025, 2:00 PM',
    },
    // CS Elective 6 (LAB) - CSE412L
    {
      id: 'cse412l-1',
      courseName: 'CS Elective 6 (LAB) - AR/VR Systems',
      courseCode: 'CSE412L',
      activityName: 'AR/VR Project Proposal',
      dueDate: 'Dec 2, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#ec4899',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 2, 2025, 11:59 PM').date,
      points: 100,
      postedDate: 'Nov 20, 2025, 10:00 AM',
    },
    // CS Elective 7 (LEC) - CSE413A
    {
      id: 'cse413a-1',
      courseName: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
      courseCode: 'CSE413A',
      activityName: 'Midterm Quiz',
      dueDate: 'Dec 10, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#8b5cf6',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 10, 2025, 11:59 PM').date,
      points: 50,
      postedDate: 'Nov 30, 2025, 9:00 AM',
    },
    {
      id: 'cse413a-2',
      courseName: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
      courseCode: 'CSE413A',
      activityName: 'Neural Networks Fundamentals',
      dueDate: 'Nov 28, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#8b5cf6',
      status: 'not_started' as TodoStatus,
      date: parseDate('Nov 28, 2025, 11:59 PM').date,
      points: 80,
      postedDate: 'Nov 20, 2025, 3:00 PM',
    },
    {
      id: 'cse413a-3',
      courseName: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
      courseCode: 'CSE413A',
      activityName: 'Research Methodology Assignment',
      dueDate: 'Oct 28, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#8b5cf6',
      status: 'missing' as TodoStatus,
      date: parseDate('Oct 28, 2025, 11:59 PM').date,
      points: 50,
      postedDate: 'Oct 15, 2025, 10:00 AM',
    },
    // CS Elective 7 (LAB) - CSE413L
    {
      id: 'cse413l-1',
      courseName: 'CS Elective 7 (LAB) - Artificial Intelligence & Machine Learning',
      courseCode: 'CSE413L',
      activityName: 'Machine Learning Project',
      dueDate: 'Dec 15, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#8b5cf6',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 15, 2025, 11:59 PM').date,
      points: 150,
      postedDate: 'Nov 25, 2025, 1:00 PM',
    },
    // CS Seminars and Educational Trips - CSC414
    {
      id: 'csc414-1',
      courseName: 'CS Seminars and Educational Trips',
      courseCode: 'CSC414',
      activityName: 'Team Composition for CSC414',
      dueDate: 'Dec 1, 2025, 4:59 PM',
      dueTime: '4:59 PM',
      color: '#f59e0b',
      status: 'not_started' as TodoStatus,
      date: parseDate('Dec 1, 2025, 4:59 PM').date,
      points: 30,
      postedDate: 'Nov 20, 2025, 11:00 AM',
    },
    {
      id: 'csc414-2',
      courseName: 'CS Seminars and Educational Trips',
      courseCode: 'CSC414',
      activityName: 'Seminar Reflection Paper',
      dueDate: 'Nov 22, 2025, 11:59 PM',
      dueTime: '11:59 PM',
      color: '#f59e0b',
      status: 'not_started' as TodoStatus,
      date: parseDate('Nov 22, 2025, 11:59 PM').date,
      points: 50,
      postedDate: 'Nov 10, 2025, 2:00 PM',
    },
  ].map(todo => ({
    ...todo,
    dueTime: parseDate(todo.dueDate).time,
  })));

  // filter todos by active tab
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
          {sortedDates.map((date) => (
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
          {sortedDates.length === 0 && (
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
