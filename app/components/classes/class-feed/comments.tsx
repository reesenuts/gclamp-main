import { PaperPlaneRight } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
};

type ClassFeedCommentsProps = {
  postId: string;
  comments: Comment[];
  showComments: boolean;
  currentUserInitials?: string; // Optional user initials for comment input
  commentInputs: { [key: string]: string };
  replyInputs: { [key: string]: string };
  showReplyInputs: { [key: string]: boolean };
  editingComment: { postId: string; commentId: string } | null;
  editingReply: { postId: string; commentId: string; replyId: string } | null;
  editCommentText: string;
  editReplyText: string;
  onCommentInputChange: (postId: string, text: string) => void;
  onReplyInputChange: (commentId: string, text: string) => void;
  onComment: (postId: string) => void;
  onReply: (postId: string, commentId: string) => void;
  onToggleReplyInput: (commentId: string) => void;
  onLongPress: (type: 'comment' | 'reply', postId: string, commentId: string, content: string, replyId?: string) => void;
  onEditCommentTextChange: (text: string) => void;
  onEditReplyTextChange: (text: string) => void;
  onSaveEditComment: () => void;
  onSaveEditReply: () => void;
  onCancelEditComment: () => void;
  onCancelEditReply: () => void;
};

export default function ClassFeedComments({
  postId,
  comments,
  showComments,
  currentUserInitials = 'U',
  commentInputs,
  replyInputs,
  showReplyInputs,
  editingComment,
  editingReply,
  editCommentText,
  editReplyText,
  onCommentInputChange,
  onReplyInputChange,
  onComment,
  onReply,
  onToggleReplyInput,
  onLongPress,
  onEditCommentTextChange,
  onEditReplyTextChange,
  onSaveEditComment,
  onSaveEditReply,
  onCancelEditComment,
  onCancelEditReply,
}: ClassFeedCommentsProps) {
  if (!showComments) return null;

  return (
    <View className="mt-3 border-t border-crystalBell pt-3">
      {/* Empty state */}
      {comments.length === 0 && (
        <View className="py-4 items-center">
          <Text className="text-millionGrey text-sm">No comments yet. Be the first to comment!</Text>
        </View>
      )}

      {/* Comments list */}
      {comments.map((comment) => {
        const isEditing = editingComment?.postId === postId && editingComment?.commentId === comment.id;

        return (
          <View key={comment.id}>
            {isEditing ? (
              // edit comment input
              <View className="mb-2 flex-row items-center">
                <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center">
                  <Text className="text-metalDeluxe font-bold text-sm">
                    {comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View className="flex-1 flex-row items-center border border-crystalBell rounded-full px-4" style={{ height: 48 }}>
                  <TextInput
                    className="flex-1 font-base text-twilightZone"
                    value={editCommentText}
                    onChangeText={onEditCommentTextChange}
                    style={{ 
                      paddingVertical: 0,
                      textAlignVertical: 'center',
                      includeFontPadding: false,
                      color: '#191815',
                    }}
                    autoFocus
                  />
                  <Pressable onPress={onSaveEditComment} disabled={!editCommentText.trim()} className="ml-2">
                    <PaperPlaneRight 
                      size={18} 
                      color={editCommentText.trim() ? "#4285F4" : "#999999"} 
                      weight={editCommentText.trim() ? "fill" : "regular"} 
                    />
                  </Pressable>
                  <Pressable onPress={onCancelEditComment} className="ml-2">
                    <Text className="text-millionGrey text-sm">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // comment display
              <Pressable 
                onLongPress={() => onLongPress('comment', postId, comment.id, comment.content)}
                className="flex-row mb-2"
              >
                <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center" style={{ marginTop: 8 }}>
                  <Text className="text-metalDeluxe font-bold text-sm">
                    {comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View className="flex-1 rounded-lg p-2">
                  <View className="flex-row items-center">
                    <Text className="text-twilightZone font-semibold text-base">
                      {comment.author}
                    </Text>
                    <Text className="text-millionGrey text-xs mx-1">•</Text>
                    <Text className="text-millionGrey text-xs">
                      {comment.timestamp}
                    </Text>
                  </View>
                  <Text className="text-twilightZone text-base mb-1">
                    {comment.content}
                  </Text>
                  <Pressable onPress={() => onToggleReplyInput(comment.id)}>
                    <Text className="text-seljukBlue text-sm font-medium">Reply</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}

            {/* replies */}
            {comment.replies && comment.replies.length > 0 && (
              <View className="ml-12 mb-2">
                {comment.replies.map((reply) => {
                  const isEditing = editingReply?.postId === postId && editingReply?.commentId === comment.id && editingReply?.replyId === reply.id;

                  return (
                    <View key={reply.id}>
                      {isEditing ? (
                        // edit reply input
                        <View className="mb-2 flex-row items-center">
                          <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center">
                            <Text className="text-metalDeluxe font-bold text-sm">
                              {reply.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </Text>
                          </View>
                          <View className="flex-1 flex-row items-center border border-crystalBell rounded-full px-4" style={{ height: 48 }}>
                            <TextInput
                              className="flex-1 font-base text-twilightZone"
                              value={editReplyText}
                              onChangeText={onEditReplyTextChange}
                              style={{ 
                                paddingVertical: 0,
                                textAlignVertical: 'center',
                                includeFontPadding: false,
                                color: '#191815',
                              }}
                              autoFocus
                            />
                            <Pressable onPress={onSaveEditReply} disabled={!editReplyText.trim()} className="ml-2">
                              <PaperPlaneRight 
                                size={18} 
                                color={editReplyText.trim() ? "#4285F4" : "#999999"} 
                                weight={editReplyText.trim() ? "fill" : "regular"} 
                              />
                            </Pressable>
                            <Pressable onPress={onCancelEditReply} className="ml-2">
                              <Text className="text-millionGrey text-sm">Cancel</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        // reply display
                        <Pressable 
                          onLongPress={() => onLongPress('reply', postId, comment.id, reply.content, reply.id)}
                          className="mb-2 flex-row"
                        >
                          <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center" style={{ marginTop: 8 }}>
                            <Text className="text-metalDeluxe font-bold text-sm">
                              {reply.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </Text>
                          </View>
                          <View className="flex-1 rounded-lg p-2">
                            <View className="flex-row items-center">
                              <Text className="text-twilightZone font-semibold text-base flex-1" numberOfLines={1} ellipsizeMode="tail">
                                {reply.author}
                              </Text>
                              <Text className="text-millionGrey text-sm mx-1">•</Text>
                              <Text className="text-millionGrey text-xs">
                                {reply.timestamp}
                              </Text>
                            </View>
                            <Text className="text-twilightZone text-base">
                              {reply.content}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* reply input */}
            {showReplyInputs[comment.id] && (
              <View className="ml-12 mb-2 flex-row items-center">
                <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center">
                  <Text className="text-metalDeluxe font-bold text-xs">{currentUserInitials}</Text>
                </View>
                <View className="flex-1 flex-row items-center border border-crystalBell rounded-full p-4 px-5" style={{ height: 48 }}>
                  <TextInput 
                    className="flex-1 font-base text-twilightZone" 
                    placeholder="Write a reply..." 
                    placeholderTextColor="#999999" 
                    value={replyInputs[comment.id] || ''} 
                    onChangeText={(text) => onReplyInputChange(comment.id, text)}
                    style={{ 
                      paddingVertical: 0, 
                      textAlignVertical: 'center', 
                      includeFontPadding: false, 
                      color: '#191815',
                    }} 
                  />
                  <Pressable 
                    onPress={() => onReply(postId, comment.id)} 
                    disabled={!replyInputs[comment.id]?.trim()} 
                    className="ml-2"
                  >
                    <PaperPlaneRight 
                      size={18} 
                      color={replyInputs[comment.id]?.trim() ? "#4285F4" : "#999999"} 
                      weight={replyInputs[comment.id]?.trim() ? "fill" : "regular"} 
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* add new comment input */}
      <View className="flex-row items-center mt-2">
        <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center">
          <Text className="text-metalDeluxe font-bold text-xs">{currentUserInitials}</Text>
        </View>
        <View className="flex-1 flex-row items-center border border-crystalBell rounded-full p-4 px-5">
          <TextInput 
            className="flex-1 font-base text-twilightZone" 
            placeholder="Write a comment..." 
            placeholderTextColor="#999999" 
            value={commentInputs[postId] || ''} 
            onChangeText={(text) => onCommentInputChange(postId, text)}
            style={{ 
              paddingVertical: 0, 
              textAlignVertical: 'center', 
              includeFontPadding: false, 
              color: '#191815',
            }} 
          />
          <Pressable 
            onPress={() => onComment(postId)} 
            disabled={!commentInputs[postId]?.trim()} 
            className="ml-2"
          >
            <PaperPlaneRight 
              size={18} 
              color={commentInputs[postId]?.trim() ? "#4285F4" : "#999999"} 
              weight={commentInputs[postId]?.trim() ? "fill" : "regular"} 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

