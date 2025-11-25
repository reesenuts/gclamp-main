import * as FileSystem from "expo-file-system/legacy";
import { ChatCircle, DownloadSimple, Heart } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import API_CONFIG from "../../../config/api";
import { lampService } from "../../../services";
import { getErrorMessage } from "../../../utils/errorHandler";
import { getFileIcon } from "./utils";
import { FileSystemUnavailableError, getWritableDirectory, saveFileToDevice } from "../../../utils/fileSystem";

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
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Handle file download
  const handleDownload = async (attachment: { type: 'image' | 'file'; name: string; url: string }) => {
    if (!attachment.url) {
      Alert.alert('Error', 'File path not available');
      return;
    }

    try {
      setDownloadingFileId(attachment.name);

      // Download file from API
      const downloadResult = await lampService.downloadFileBinary(attachment.url);

      // Get file extension from filename
      const mimeType = downloadResult.mimeType || 'application/octet-stream';

      let cacheDir: string;
      try {
        cacheDir = await getWritableDirectory();
      } catch (dirError) {
        if (dirError instanceof FileSystemUnavailableError && dirError.reason === "expo-go") {
          Alert.alert(
            'File System Not Available', 
            'File system access is not available in Expo Go.\n\n' +
            'To use file downloads, please:\n\n' +
            '• Update Expo Go to the latest version\n' +
            '• Or build a development/standalone app\n\n' +
            'You can build a development build with:\n' +
            'npx expo run:android (or run:ios)'
          );
        } else {
          Alert.alert('Error', 'Unable to access device storage for downloads.');
        }
        return;
      }
      
      // Sanitize filename to avoid path issues
      const sanitizedFilename = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${cacheDir}${sanitizedFilename}`;

      // Write base64 data to file
      await FileSystem.writeAsStringAsync(fileUri, downloadResult.data, {
        encoding: 'base64' as any,
      });

      // Save file and show options to user
      await saveFileToDevice(fileUri, attachment.name, mimeType);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

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
      {post.content && (
        <Text className="text-twilightZone text-base mb-3">
          {post.content}
        </Text>
      )}

      {/* file attachments if any */}
      {post.attachments && post.attachments.length > 0 && (
        <View className="mb-3">
          {post.attachments.map((attachment, idx) => {
            if (attachment.type === 'image') {
              // Display image preview
              // Construct full URL from base URL and file path
              // attachment.url is the path part (e.g., "files/2025-20261/faculty/202211557/1755228652.pdf")
              const baseUrl = API_CONFIG.BASE_URL.replace('/student/lamp.php', '');
              const imageUrl = `${baseUrl}/${attachment.url}`;
              const isDownloading = downloadingFileId === attachment.name;
              
              return (
                <View key={idx} className="mb-2 rounded-lg overflow-hidden border border-crystalBell">
                  <Image 
                    source={{ uri: imageUrl }}
                    className="w-full"
                    style={{ height: 300, backgroundColor: '#f0f0f0' }}
                    resizeMode="cover"
                  />
                  <View className="p-2 bg-white flex-row items-center justify-between">
                    <Text className="text-twilightZone text-sm flex-1" numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Pressable 
                      onPress={() => handleDownload(attachment)}
                      disabled={isDownloading}
                      className="p-2"
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#4285F4" />
                      ) : (
                        <DownloadSimple size={20} color="#4285F4" weight="regular" />
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            } else {
              // Display file attachment
              const { Icon, color } = getFileIcon(attachment.name);
              const isDownloading = downloadingFileId === attachment.name;
              
              return (
                <View key={idx} className="bg-crystalBell/20 border border-crystalBell p-3 rounded-lg mb-2">
                  <View className="flex-row items-center">
                    <Icon size={18} color={color} weight="regular" />
                    <Text className="text-twilightZone ml-2 flex-1" numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Pressable 
                      onPress={() => handleDownload(attachment)}
                      disabled={isDownloading}
                      className="p-2"
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#4285F4" />
                      ) : (
                        <DownloadSimple size={20} color="#4285F4" weight="regular" />
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            }
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

