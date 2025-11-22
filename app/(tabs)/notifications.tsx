import { router } from "expo-router";
import { Books, ChatCircle, FolderSimple, Heart, Newspaper } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type NotificationType = 'activity' | 'resource' | 'post' | 'like' | 'comment' | 'reply';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  author: string;
  courseCode?: string;
  courseName?: string;
  timestamp: string;
  isRead: boolean;
  link?: {
    type: 'activity' | 'resource' | 'feed' | 'class';
    id?: string;
    courseCode?: string;
    postId?: string;
    commentId?: string;
    replyId?: string;
  };
};

// convert uppercase name to normal case (first name last name format, no comma)
const toNormalCase = (name: string) => {
  const parts = name.split(',');
  if (parts.length === 2) {
    // reverse order: lastname, firstname -> firstname lastname
    const firstName = parts[1].trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const lastName = parts[0].trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `${firstName} ${lastName}`;
  }
  // fallback for names without comma
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// notifications data - based on real data from codebase
const notificationsData: Notification[] = [
  // activity notifications
  {
    id: '1',
    type: 'activity',
    title: 'New Activity Posted',
    message: 'Chapter 3 Draft Submission has been posted',
    author: 'Erlinda Abarintos',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '2 hours ago',
    isRead: false,
    link: { type: 'activity', id: '1', courseCode: 'CSP421A' },
  },
  {
    id: '2',
    type: 'activity',
    title: 'New Activity Posted',
    message: 'Midterm Quiz has been posted',
    author: 'Melner Balce',
    courseCode: 'CSE413A',
    courseName: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
    timestamp: '5 hours ago',
    isRead: false,
    link: { type: 'activity', id: '2', courseCode: 'CSE413A' },
  },
  {
    id: '3',
    type: 'activity',
    title: 'New Activity Posted',
    message: 'AR/VR Fundamentals Assignment has been posted',
    author: 'Loudel Manaloto',
    courseCode: 'CSE412A',
    courseName: 'CS Elective 6 (LEC) - AR/VR Systems',
    timestamp: '1 day ago',
    isRead: true,
    link: { type: 'activity', id: '3', courseCode: 'CSE412A' },
  },
  // resource notifications
  {
    id: '4',
    type: 'resource',
    title: 'New Resource Uploaded',
    message: 'Week_8_Presentation.pdf has been uploaded',
    author: 'Erlinda Abarintos',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '3 hours ago',
    isRead: false,
    link: { type: 'resource', courseCode: 'CSP421A' },
  },
  {
    id: '5',
    type: 'resource',
    title: 'New Resource Uploaded',
    message: 'Research_Methodology_Worksheet.docx has been uploaded',
    author: 'Melner Balce',
    courseCode: 'CSE413A',
    courseName: 'CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning',
    timestamp: '6 hours ago',
    isRead: false,
    link: { type: 'resource', courseCode: 'CSE413A' },
  },
  // feed post notifications
  {
    id: '6',
    type: 'post',
    title: 'New Post in Class Feed',
    message: "Don't forget to submit your Chapter 3 draft by Friday, 11:59 PM...",
    author: 'Erlinda Abarintos',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '4 hours ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '1' },
  },
  {
    id: '7',
    type: 'post',
    title: 'New Post in Class Feed',
    message: 'New learning materials have been uploaded. Please review the presentation slides...',
    author: 'Erlinda Abarintos',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '1 day ago',
    isRead: true,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '2' },
  },
  // like/react notifications
  {
    id: '8',
    type: 'like',
    title: 'Reacted to Your Post',
    message: 'Alberto, Sean Rad reacted to your post',
    author: 'ALBERTO, SEAN RAD',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '30 minutes ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '3' },
  },
  {
    id: '9',
    type: 'like',
    title: 'Reacted to Your Comment',
    message: 'Apo, Eunille Jan reacted to your comment',
    author: 'APO, EUNILLE JAN',
    courseCode: 'CSE412A',
    courseName: 'CS Elective 6 (LEC) - AR/VR Systems',
    timestamp: '2 hours ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSE412A', postId: '3', commentId: '3-1' },
  },
  // comment notifications
  {
    id: '10',
    type: 'comment',
    title: 'Commented on Post',
    message: 'Thank you for the reminder, Ma\'am!',
    author: 'AGUILAR, ZALDY',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '1 hour ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '1', commentId: '1-1' },
  },
  {
    id: '11',
    type: 'comment',
    title: 'Commented on Post',
    message: 'I\'ve started some research. Let\'s meet this weekend!',
    author: 'BANLUTA, CHRISTIAN DAVE',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '3 hours ago',
    isRead: true,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '3', commentId: '3-1' },
  },
  {
    id: '12',
    type: 'comment',
    title: 'Commented on Your Post',
    message: 'Great work on the midterm exams! The average score was 85%...',
    author: 'Erlinda Abarintos',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '1 day ago',
    isRead: true,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '4', commentId: '4-1' },
  },
  // reply notifications
  {
    id: '13',
    type: 'reply',
    title: 'Replied to Your Comment',
    message: 'I\'ll check the lab computers and get back to you.',
    author: 'BELEN, KENT HAROLD',
    courseCode: 'CSE412A',
    courseName: 'CS Elective 6 (LEC) - AR/VR Systems',
    timestamp: '45 minutes ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSE412A', postId: '3', commentId: '3-1', replyId: '3-1-reply-1' },
  },
  {
    id: '14',
    type: 'reply',
    title: 'Replied to Your Comment',
    message: 'Will definitely visit this week.',
    author: 'BENEDICTO, BERNARD ADRIANNE',
    courseCode: 'CSP421A',
    courseName: 'CS Thesis Writing 2 (LEC)',
    timestamp: '5 hours ago',
    isRead: false,
    link: { type: 'feed', courseCode: 'CSP421A', postId: '1', commentId: '1-1', replyId: '1-1-reply-1' },
  },
];

// get icon for notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'activity':
      return Books;
    case 'resource':
      return FolderSimple;
    case 'post':
      return Newspaper;
    case 'like':
      return Heart;
    case 'comment':
      return ChatCircle;
    case 'reply':
      return ChatCircle;
    default:
      return FolderSimple;
  }
};

// get icon color for notification type
const getNotificationIconColor = (type: NotificationType) => {
  switch (type) {
    case 'activity':
      return '#4285F4';
    case 'resource':
      return '#10B981';
    case 'post':
      return '#3B82F6';
    case 'like':
      return '#EC4899';
    case 'comment':
      return '#8B5CF6';
    case 'reply':
      return '#8B5CF6';
    default:
      return '#999999';
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData);

  // handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));

    // navigate based on notification type and link
    if (notification.link) {
      const { type, courseCode, id } = notification.link;
      
      // activity notifications -> go directly to activity detail
      if (notification.type === 'activity' && type === 'activity' && id) {
        router.push({
          pathname: '/components/classes/activities/activity-detail' as any,
          params: {
            activityId: id,
            title: notification.message,
            description: notification.message,
            dueDate: '',
            points: '0',
            status: 'not_started',
            courseCode: courseCode || '',
            courseName: notification.courseName || '',
          }
        });
        return;
      }
      
      // resource notifications -> go to resources tab
      if (notification.type === 'resource' && type === 'resource') {
        router.push({
          pathname: '/components/classes/class-details' as any,
          params: {
            code: courseCode || '',
            name: notification.courseName || '',
            instructor: notification.author,
            schedule: '',
            time: '',
            room: '',
            color: '#3b82f6',
            initialTab: 'resources',
          }
        });
        return;
      }
      
      // post, comment, reply, like notifications -> go to feed tab
      if (notification.type === 'post' || notification.type === 'comment' || 
          notification.type === 'reply' || notification.type === 'like') {
        router.push({
          pathname: '/components/classes/class-details' as any,
          params: {
            code: courseCode || '',
            name: notification.courseName || '',
            instructor: notification.author,
            schedule: '',
            time: '',
            room: '',
            color: '#3b82f6',
            initialTab: 'feed',
            highlightPostId: notification.link.postId || '',
            highlightCommentId: notification.link.commentId || '',
            highlightReplyId: notification.link.replyId || '',
          }
        });
        return;
      }
      
      // fallback: navigate to class details
      if (type === 'class') {
        router.push({
          pathname: '/components/classes/class-details' as any,
          params: {
            code: courseCode || '',
            name: notification.courseName || '',
            instructor: notification.author,
            schedule: '',
            time: '',
            room: '',
            color: '#3b82f6',
          }
        });
      } else if (type === 'feed') {
        router.push({
          pathname: '/components/classes/class-details' as any,
          params: {
            code: courseCode || '',
            name: notification.courseName || '',
            instructor: notification.author,
            schedule: '',
            time: '',
            room: '',
            color: '#3b82f6',
            initialTab: 'feed',
            highlightPostId: notification.link.postId || '',
            highlightCommentId: notification.link.commentId || '',
            highlightReplyId: notification.link.replyId || '',
          }
        });
      } else if (type === 'activity' && id) {
        router.push({
          pathname: '/components/classes/activities/activity-detail' as any,
          params: {
            activityId: id,
            title: notification.message,
            description: notification.message,
            dueDate: '',
            points: '0',
            status: 'not_started',
            courseCode: courseCode || '',
            courseName: notification.courseName || '',
          }
        });
      } else if (type === 'resource') {
        router.push({
          pathname: '/components/classes/class-details' as any,
          params: {
            code: courseCode || '',
            name: notification.courseName || '',
            instructor: notification.author,
            schedule: '',
            time: '',
            room: '',
            color: '#3b82f6',
            initialTab: 'resources',
          }
        });
      }
    }
  };

  // unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // group notifications by time
  const groupNotifications = () => {
    // new = all unread notifications
    const newNotifications = notifications.filter(n => !n.isRead);
    
    // today = read notifications from today (minutes/hours ago)
    const todayNotifications = notifications.filter(n => {
      if (!n.isRead) return false; // only read notifications
      const timestamp = n.timestamp.toLowerCase();
      return timestamp.includes('minutes ago') || timestamp.includes('hour ago') || timestamp.includes('hours ago');
    });
    
    // earlier = read notifications from earlier (days/weeks ago)
    const earlierNotifications = notifications.filter(n => {
      if (!n.isRead) return false; // only read notifications
      const timestamp = n.timestamp.toLowerCase();
      return timestamp.includes('day ago') || timestamp.includes('days ago') || timestamp.includes('week ago') || timestamp.includes('weeks ago');
    });

    return {
      new: newNotifications,
      today: todayNotifications,
      earlier: earlierNotifications,
    };
  };

  const groupedNotifications = groupNotifications();

  // format simplified notification message
  const formatNotificationMessage = (notification: Notification): string => {
    const isInstructor = !notification.author.includes(',');
    const authorName = isInstructor ? notification.author : toNormalCase(notification.author);
    
    switch (notification.type) {
      case 'activity':
        return notification.message;
      
      case 'resource':
        return notification.message;
      
      case 'post':
        return notification.message;
      
      case 'like':
        if (notification.message.includes('reacted to your post')) {
          return `${authorName} reacted to your post`;
        } else if (notification.message.includes('reacted to your comment')) {
          return `${authorName} reacted to your comment`;
        }
        return notification.message;
      
      case 'comment':
        if (notification.title.includes('Your Post')) {
          return `${authorName} commented on your post`;
        } else {
          return `${authorName} commented: ${notification.message}`;
        }
      
      case 'reply':
        return `${authorName} replied to your comment`;
      
      default:
        return notification.message;
    }
  };

  // render notification item
  const renderNotificationItem = (notification: Notification) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type);
    const formattedMessage = formatNotificationMessage(notification);

    return (
      <Pressable key={notification.id} onPress={() => handleNotificationClick(notification)} className={`flex-row items-start py-3 px-6 border-crystalBell active:opacity-80 ${ !notification.isRead ? 'bg-seljukBlue/5' : '' }`} >
        {/* icon */}
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${iconColor}15` }} >
          <Icon size={20} color={iconColor} weight="fill" />
        </View>
        
        {/* content */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Text className="text-twilightZone font-semibold text-base flex-1">
              {notification.courseName || 'Notification'}
          </Text>
            {!notification.isRead && (
              <View className="w-2 h-2 rounded-full bg-seljukBlue ml-2" />
            )}
          </View>
          <Text className="text-millionGrey text-sm mb-1" numberOfLines={3}>
            {formattedMessage}
          </Text>
          <View className="flex-row items-center flex-wrap">
            <Text className="text-millionGrey text-xs">
              {notification.timestamp}
          </Text>
        </View>
      </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* notifications list */}
      {notifications.length > 0 ? (
        <ScrollView className="flex-1 mb-2" showsVerticalScrollIndicator={false}>
          <View className="pb-6">
            {/* new section */}
            {groupedNotifications.new.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold">New</Text>
                </View>
                {groupedNotifications.new.map(renderNotificationItem)}
              </>
            )}

            {/* today section */}
            {groupedNotifications.today.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold mt-2">Today</Text>
                </View>
                {groupedNotifications.today.map(renderNotificationItem)}
              </>
            )}

            {/* earlier section */}
            {groupedNotifications.earlier.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold mt-2">Earlier</Text>
                </View>
                {groupedNotifications.earlier.map(renderNotificationItem)}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-millionGrey text-base">No notifications</Text>
        </View>
      )}
    </View>
  );
}
