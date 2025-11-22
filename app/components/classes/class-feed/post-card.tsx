import { ChatCircle, DownloadSimple, Heart } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { getFileIcon } from "./utils";

type Post = {
  id: string;
  author: string;
  authorRole: 'instructor' | 'student';
  content: string;
  timestamp: string;
  attachments?: { type: 'image' | 'file'; name: string; url: string }[];
  likes: number;
  comments: any[];
};

type ClassFeedPostCardProps = {
  post: Post;
  onToggleComments: (postId: string) => void;
  showComments: boolean;
  children?: React.ReactNode;
};

export default function ClassFeedPostCard({
  post,
  onToggleComments,
  showComments,
  children,
}: ClassFeedPostCardProps) {
  return (
    <View className="bg-white rounded-xl border border-crystalBell p-4 mb-4">
      {/* post author and timestamp */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-3 items-center justify-center ${
            post.authorRole === 'instructor' ? 'bg-millionGrey/10' : 'bg-millionGrey/10'
          }`}>
            <Text className={`font-bold text-sm ${
              post.authorRole === 'instructor' ? 'text-metalDeluxe' : 'text-metalDeluxe'
            }`}>
              {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-twilightZone font-semibold text-base">
                {post.author}
              </Text>
              {post.authorRole === 'instructor' && (
                <View className="ml-2 bg-starfleetBlue/10 px-2 py-0.5 rounded-full">
                  <Text className="text-starfleetBlue text-xs font-medium">
                    Instructor
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-millionGrey text-xs">{post.timestamp}</Text>
          </View>
        </View>
      </View>

      {/* post text content */}
      <Text className="text-twilightZone text-base mb-3">
        {post.content}
      </Text>

      {/* file attachments if any */}
      {post.attachments && post.attachments.length > 0 && (
        <View className="mb-3">
          {post.attachments.map((attachment, idx) => {
            const { Icon, color } = getFileIcon(attachment.name);
            return (
              <View key={idx} className="bg-crystalBell/20 border border-crystalBell p-3 rounded-lg mb-2">
                <View className="flex-row items-center">
                  <Icon size={18} color={color} weight="regular" />
                  <Text className="text-twilightZone ml-2 flex-1">{attachment.name}</Text>
                  <Pressable className="p-2">
                    <DownloadSimple size={20} color="#4285F4" weight="regular" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* like and comment actions */}
      <View className="border-t border-crystalBell pt-3 flex-row items-center gap-4">
        <Pressable className="flex-row items-center">
          <Heart size={20} color="#999999" weight="regular" />
          <Text className="text-millionGrey ml-1 text-sm">
            {post.likes > 0 ? post.likes : 'Like'}
          </Text>
        </Pressable>
        
        <Pressable onPress={() => onToggleComments(post.id)} className="flex-row items-center">
          <ChatCircle size={20} color="#999999" weight="regular" />
          <Text className="text-millionGrey ml-1 text-sm">
            {post.comments.length > 0 ? `${post.comments.length} Comments` : 'Comment'}
          </Text>
        </Pressable>
      </View>

      {/* comments section */}
      {showComments && children}
    </View>
  );
}

