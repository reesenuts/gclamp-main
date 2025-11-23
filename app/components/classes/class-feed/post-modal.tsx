import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File, Image, X } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Image as RNImage, ScrollView, Text, TextInput, View } from "react-native";

type Attachment = {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'file';
  mimeType?: string;
};

type ClassFeedPostModalProps = {
  visible: boolean;
  courseCode: string;
  newPostContent: string;
  currentUserName?: string;
  currentUserInitials?: string;
  attachments: Attachment[];
  isPosting?: boolean;
  onContentChange: (text: string) => void;
  onAttachmentsChange: (attachments: Attachment[]) => void;
  onClose: () => void;
  onPost: () => void;
};

export default function ClassFeedPostModal({
  visible,
  courseCode,
  newPostContent,
  currentUserName = 'User',
  currentUserInitials = 'U',
  attachments,
  isPosting = false,
  onContentChange,
  onAttachmentsChange,
  onClose,
  onPost,
}: ClassFeedPostModalProps) {
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isPickingFile, setIsPickingFile] = useState(false);

  // Request permissions for image picker
  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to attach images.');
      return false;
    }
    return true;
  };

  // Handle image picker
  const handlePickImage = async () => {
    if (isPickingImage || isPickingFile) return;
    
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: Attachment[] = result.assets.map((asset, index) => ({
          id: `img-${Date.now()}-${index}`,
          uri: asset.uri,
          name: asset.fileName || `image-${index + 1}.jpg`,
          type: 'image' as const,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } catch (err: any) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsPickingImage(false);
    }
  };

  // Handle file picker
  const handlePickFile = async () => {
    if (isPickingImage || isPickingFile) return;

    try {
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: Attachment[] = result.assets.map((asset, index) => ({
          id: `file-${Date.now()}-${index}`,
          uri: asset.uri,
          name: asset.name,
          type: 'file' as const,
          mimeType: asset.mimeType || 'application/octet-stream',
        }));
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } catch (err: any) {
      console.error('Error picking file:', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    } finally {
      setIsPickingFile(false);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} >
      <View className="flex-1 bg-white">
        {/* modal header with cancel and post buttons */}
        <View className="px-6 pt-6 pb-4 bg-white border-b border-crystalBell">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={onClose} className="flex-row items-center">
              <Text className="text-twilightZone text-base font-medium">Cancel</Text>
            </Pressable>

            <Text className="text-twilightZone text-lg font-bold">Create Post</Text>

            <Pressable 
              onPress={onPost} 
              disabled={(!newPostContent.trim() && attachments.length === 0) || isPosting} 
              className="px-4 py-2 rounded-lg flex-row items-center" 
            >
              {isPosting ? (
                <>
                  <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 8 }} />
                  <Text className="font-semibold text-seljukBlue">Posting...</Text>
                </>
              ) : (
                <Text className={`font-semibold ${(newPostContent.trim() || attachments.length > 0) ? 'text-seljukBlue' : 'text-millionGrey'}`}>
                  Post
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* modal content area */}
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} >
          <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} >
            <View className="flex-row mb-4">
              <View className="w-10 h-10 rounded-full bg-millionGrey/10 items-center justify-center mr-3">
                <Text className="text-metalDeluxe font-bold">{currentUserInitials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-twilightZone font-semibold text-base">{currentUserName}</Text>
                <Text className="text-millionGrey text-xs">Posting to {courseCode}</Text>
              </View>
            </View>

            <TextInput className="text-twilightZone text-base" placeholder="What do you want to share?" placeholderTextColor="#999999" multiline scrollEnabled={true} autoFocus value={newPostContent} onChangeText={onContentChange} style={{ textAlignVertical: 'top', marginBottom: 16 }} />

            {/* Selected attachments preview */}
            {attachments.length > 0 && (
              <View className="mb-4">
                {attachments.map((attachment) => (
                  <View key={attachment.id} className="flex-row items-center mb-3 p-3 bg-slate-50 rounded-lg border border-crystalBell">
                    {attachment.type === 'image' ? (
                      <RNImage source={{ uri: attachment.uri }} className="w-16 h-16 rounded-lg mr-3" resizeMode="cover" />
                    ) : (
                      <View className="w-16 h-16 rounded-lg bg-seljukBlue/10 items-center justify-center mr-3">
                        <File size={24} color="#4285F4" weight="fill" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-twilightZone font-medium text-sm" numberOfLines={1}>
                        {attachment.name}
                      </Text>
                      <Text className="text-millionGrey text-xs mt-1">
                        {attachment.type === 'image' ? 'Image' : 'File'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveAttachment(attachment.id)}
                      className="p-2"
                    >
                      <X size={20} color="#999999" weight="regular" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* photo and file attachment options */}
            <View className="flex-row items-center gap-2 mb-6 border-t border-crystalBell pt-4">
              <Pressable 
                onPress={handlePickImage}
                disabled={isPickingImage || isPickingFile}
                className="w-10 h-10 items-center justify-center rounded-lg border border-crystalBell"
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color="#999999" />
                ) : (
                  <Image size={24} color="#999999" weight="fill" />
                )}
              </Pressable>
              <Pressable 
                onPress={handlePickFile}
                disabled={isPickingImage || isPickingFile}
                className="w-10 h-10 items-center justify-center rounded-lg border border-crystalBell"
              >
                {isPickingFile ? (
                  <ActivityIndicator size="small" color="#999999" />
                ) : (
                  <File size={24} color="#999999" weight="fill" />
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

