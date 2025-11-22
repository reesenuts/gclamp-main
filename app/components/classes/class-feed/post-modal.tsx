import { File, Image } from "phosphor-react-native";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

type ClassFeedPostModalProps = {
  visible: boolean;
  courseCode: string;
  newPostContent: string;
  onContentChange: (text: string) => void;
  onClose: () => void;
  onPost: () => void;
};

export default function ClassFeedPostModal({
  visible,
  courseCode,
  newPostContent,
  onContentChange,
  onClose,
  onPost,
}: ClassFeedPostModalProps) {

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

            <Pressable onPress={onPost} disabled={!newPostContent.trim()} className="px-4 py-2 rounded-lg" >
              <Text className={`font-semibold ${newPostContent.trim() ? 'text-seljukBlue' : 'text-millionGrey'}`}>
                Post
              </Text>
            </Pressable>
          </View>
        </View>

        {/* modal content area */}
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} >
          <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} >
            <View className="flex-row mb-4">
              <View className="w-10 h-10 rounded-full bg-millionGrey/10 items-center justify-center mr-3">
                <Text className="text-metalDeluxe font-bold">LP</Text>
              </View>
              <View className="flex-1">
                <Text className="text-twilightZone font-semibold text-base">Lee Parker Parantar</Text>
                <Text className="text-millionGrey text-xs">Posting to {courseCode}</Text>
              </View>
            </View>

            <TextInput className="text-twilightZone text-base" placeholder="What do you want to share?" placeholderTextColor="#999999" multiline scrollEnabled={true} autoFocus value={newPostContent} onChangeText={onContentChange} style={{ textAlignVertical: 'top', marginBottom: 16 }} />

            {/* photo and file attachment options */}
            <View className="flex-row items-center gap-2 mb-6 border-t border-crystalBell pt-4">
              <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-crystalBell">
                <Image size={24} color="#999999" weight="fill" />
              </Pressable>
              <Pressable className="w-10 h-10 items-center justify-center rounded-lg border border-crystalBell">
                <File size={24} color="#999999" weight="fill" />
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

