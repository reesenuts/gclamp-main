import { ChatCircle, Copy, Image, Paperclip, PencilSimple, Trash } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Clipboard, Keyboard, Modal, Pressable, ScrollView, Text, View } from "react-native";
import ClassFeedComments from "./comments";
import ClassFeedPostCard from "./post-card";
import ClassFeedPostModal from "./post-modal";

// post structure
type Post = {
  id: string;
  author: string;
  authorRole: 'instructor' | 'student';
  content: string;
  timestamp: string;
  attachments?: { type: 'image' | 'file'; name: string; url: string }[];
  likes: number;
  comments: Comment[];
};

// comment structure
type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
};

type ClassFeedProps = {
  courseCode: string;
  instructor: string;
  highlightPostId?: string;
  highlightCommentId?: string;
  highlightReplyId?: string;
};

export default function ClassFeed({ courseCode, instructor, highlightPostId, highlightCommentId, highlightReplyId }: ClassFeedProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<{ [key: string]: View | null }>({});
  const commentRefs = useRef<{ [key: string]: View | null }>({});
  const replyRefs = useRef<{ [key: string]: View | null }>({});
  const [highlightedItems, setHighlightedItems] = useState<{ postId?: string; commentId?: string; replyId?: string }>({});
  
  // scroll to and highlight specific items when props change
  useEffect(() => {
    // determine which post to highlight
    let postIdToHighlight = highlightPostId;
    
    // if comment or reply notification, find the post that contains it
    if (!postIdToHighlight && (highlightCommentId || highlightReplyId)) {
      postIdToHighlight = posts.find(p => 
        p.comments.some(c => c.id === highlightCommentId || c.replies?.some(r => r.id === highlightReplyId))
      )?.id;
      
      // expand comments if highlighting a comment or reply
      if (postIdToHighlight) {
        setShowComments({ ...showComments, [postIdToHighlight]: true });
      }
    }
    
    if (postIdToHighlight) {
      // set highlighted post only
      setHighlightedItems({
        postId: postIdToHighlight,
      });
      
      // scroll to post after a short delay to allow rendering
      setTimeout(() => {
        if (postRefs.current[postIdToHighlight!]) {
          postRefs.current[postIdToHighlight!]?.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
            },
            () => {}
          );
        }
      }, 300);
      
      // remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedItems({});
      }, 3000);
    }
  }, [highlightPostId, highlightCommentId, highlightReplyId]);
  
  // posts data with sample content
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: instructor,
      authorRole: 'instructor',
      content: "Don't forget to submit your Chapter 3 draft by Friday, 11:59 PM. Make sure to follow the formatting guidelines provided in the resources section.",
      timestamp: '2 hours ago',
      likes: 12,
      comments: [
        {
          id: '1-1',
          author: 'Juan Dela Cruz',
          content: 'Thank you for the reminder, Ma\'am!',
          timestamp: '1 hour ago',
        }
      ],
    },
    {
      id: '2',
      author: instructor,
      authorRole: 'instructor',
      content: 'New learning materials have been uploaded. Please review the presentation slides before our next session on Thursday.',
      timestamp: '1 day ago',
      attachments: [
        { type: 'file', name: 'Week_8_Presentation.pdf', url: '' }
      ],
      likes: 8,
      comments: [],
    },
    {
      id: '3',
      author: 'Maria Santos',
      authorRole: 'student',
      content: 'Has anyone started working on the group project yet? I think we should schedule a meeting to discuss our approach.',
      timestamp: '3 days ago',
      likes: 5,
      comments: [
        {
          id: '3-1',
          author: 'Pedro Reyes',
          content: 'I\'ve started some research. Let\'s meet this weekend!',
          timestamp: '2 days ago',
        }
      ],
    },
    {
      id: '4',
      author: instructor,
      authorRole: 'instructor',
      content: 'Great work on the midterm exams! The average score was 85%. Keep up the excellent progress.',
      timestamp: '4 days ago',
      likes: 20,
      comments: [],
      attachments: [
        { type: 'file', name: 'Midterm_Results.pdf', url: '' },
        { type: 'file', name: 'Grade_Distribution.xlsx', url: '' }
      ],
    },
    {
      id: '5',
      author: 'Ana Garcia',
      authorRole: 'student',
      content: 'I found this helpful article about machine learning algorithms. Sharing it here in case anyone finds it useful!',
      timestamp: '5 days ago',
      likes: 7,
      comments: [],
      attachments: [
        { type: 'file', name: 'ML_Algorithms_Guide.pdf', url: '' }
      ],
    },
    {
      id: '6',
      author: instructor,
      authorRole: 'instructor',
      content: 'Reminder: Office hours are now available on Tuesdays and Thursdays from 2-4 PM. Feel free to drop by if you have questions.',
      timestamp: '1 week ago',
      likes: 15,
      comments: [
        {
          id: '6-1',
          author: 'Jose Rizal',
          content: 'Thank you, Ma\'am!',
          timestamp: '6 days ago',
        },
        {
          id: '6-2',
          author: 'Andres Bonifacio',
          content: 'Will definitely visit this week.',
          timestamp: '5 days ago',
        }
      ],
    },
  ]);

  // state for new post and ui controls
  const [newPostContent, setNewPostContent] = useState('');
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [showReplyInputs, setShowReplyInputs] = useState<{ [key: string]: boolean }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // state for long press menu
  const [longPressMenu, setLongPressMenu] = useState<{ type: 'comment' | 'reply'; postId: string; commentId: string; replyId?: string; content: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [editingReply, setEditingReply] = useState<{ postId: string; commentId: string; replyId: string } | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editReplyText, setEditReplyText] = useState('');

  // create and add new post
  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: 'Lee Parker Parantar',
      authorRole: 'student',
      content: newPostContent,
      timestamp: 'Just now',
      likes: 0,
      comments: [],
    };

    // add post to top of feed
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setShowCreateModal(false);
    Keyboard.dismiss();
  };

  // add comment to specific post
  const handleComment = (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `${postId}-${Date.now()}`,
              author: 'Lee Parker Parantar',
              content: commentText,
              timestamp: 'Just now',
            }
          ]
        };
      }
      return post;
    }));

    // clear comment input
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  // toggle comment section visibility
  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  // toggle reply input visibility
  const toggleReplyInput = (commentId: string) => {
    setShowReplyInputs({ ...showReplyInputs, [commentId]: !showReplyInputs[commentId] });
  };

  // handle comment input change
  const handleCommentInputChange = (postId: string, text: string) => {
    setCommentInputs({ ...commentInputs, [postId]: text });
  };

  // handle reply input change
  const handleReplyInputChange = (commentId: string, text: string) => {
    setReplyInputs({ ...replyInputs, [commentId]: text });
  };

  // add reply to specific comment
  const handleReply = (postId: string, commentId: string) => {
    const replyText = replyInputs[commentId];
    if (!replyText?.trim()) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const newReply: Comment = {
                id: `${commentId}-reply-${Date.now()}`,
                author: 'Lee Parker Parantar',
                content: replyText,
                timestamp: 'Just now',
              };
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));

    // clear reply input
    setReplyInputs({ ...replyInputs, [commentId]: '' });
    setShowReplyInputs({ ...showReplyInputs, [commentId]: false });
  };

  // handle long press on comment/reply
  const handleLongPress = (type: 'comment' | 'reply', postId: string, commentId: string, content: string, replyId?: string) => {
    setLongPressMenu({ type, postId, commentId, replyId, content });
  };

  // copy text to clipboard
  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setLongPressMenu(null);
    Alert.alert('Copied', 'Text copied to clipboard');
  };

  // start editing comment
  const startEditComment = (postId: string, commentId: string, currentContent: string) => {
    setEditingComment({ postId, commentId });
    setEditCommentText(currentContent);
    setLongPressMenu(null);
  };

  // save edited comment
  const saveEditComment = () => {
    if (!editingComment || !editCommentText.trim()) return;

    setPosts(posts.map(post => {
      if (post.id === editingComment.postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === editingComment.commentId) {
              return {
                ...comment,
                content: editCommentText.trim(),
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));

    setEditingComment(null);
    setEditCommentText('');
  };

  // cancel editing comment
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // delete comment
  const deleteComment = (postId: string, commentId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(comment => comment.id !== commentId)
        };
      }
      return post;
    }));
    setLongPressMenu(null);
  };

  // start editing reply
  const startEditReply = (postId: string, commentId: string, replyId: string, currentContent: string) => {
    setEditingReply({ postId, commentId, replyId });
    setEditReplyText(currentContent);
    setLongPressMenu(null);
  };

  // save edited reply
  const saveEditReply = () => {
    if (!editingReply || !editReplyText.trim()) return;

    setPosts(posts.map(post => {
      if (post.id === editingReply.postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === editingReply.commentId) {
              return {
                ...comment,
                replies: comment.replies?.map(reply => {
                  if (reply.id === editingReply.replyId) {
                    return {
                      ...reply,
                      content: editReplyText.trim(),
                    };
                  }
                  return reply;
                })
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));

    setEditingReply(null);
    setEditReplyText('');
  };

  // cancel editing reply
  const cancelEditReply = () => {
    setEditingReply(null);
    setEditReplyText('');
  };

  // delete reply
  const deleteReply = (postId: string, commentId: string, replyId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: comment.replies?.filter(reply => reply.id !== replyId)
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));
    setLongPressMenu(null);
  };

  return (
    <>
      <View className="flex-1 mb-2">
        {/* fixed post creation card */}
        <View className="px-6 pt-6 pb-3">
          <Pressable onPress={() => setShowCreateModal(true)} className="bg-white rounded-2xl border border-crystalBell p-4 active:opacity-70" >
            <View className="flex-row items-center">
              {/* user avatar */}
              <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 items-center justify-center mr-3">
                <Text className="text-metalDeluxe font-bold">LP</Text>
              </View>
              
              {/* placeholder text */}
              <Text className="flex-1 text-millionGrey text-base">
                Share with your class...
              </Text>
              
              {/* image attachment button */}
              <Pressable className="p-2 rounded-2xl bg-seljukBlue/10 mr-2">
                <Image size={20} color="#4285F4" weight="regular" />
              </Pressable>
              
              {/* file attachment button */}
              <Pressable className="p-2 rounded-2xl bg-seljukBlue/10">
                <Paperclip size={20} color="#4285F4" weight="regular" />
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* scrollable posts feed */}
        <ScrollView ref={scrollViewRef} className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {posts.map((post) => (
            <View 
              key={post.id}
              ref={(ref) => { postRefs.current[post.id] = ref; }}
              className="mb-4"
            >
              <ClassFeedPostCard
                post={post}
                onToggleComments={toggleComments}
                showComments={showComments[post.id] || false}
              >
              <ClassFeedComments
                postId={post.id}
                comments={post.comments}
                showComments={showComments[post.id] || false}
                commentInputs={commentInputs}
                replyInputs={replyInputs}
                showReplyInputs={showReplyInputs}
                editingComment={editingComment}
                editingReply={editingReply}
                editCommentText={editCommentText}
                editReplyText={editReplyText}
                onCommentInputChange={handleCommentInputChange}
                onReplyInputChange={handleReplyInputChange}
                onComment={handleComment}
                onReply={handleReply}
                onToggleReplyInput={toggleReplyInput}
                onLongPress={handleLongPress}
                onEditCommentTextChange={setEditCommentText}
                onEditReplyTextChange={setEditReplyText}
                onSaveEditComment={saveEditComment}
                onSaveEditReply={saveEditReply}
                onCancelEditComment={cancelEditComment}
                onCancelEditReply={cancelEditReply}
              />
            </ClassFeedPostCard>
            </View>
          ))}
        </ScrollView>
      </View>

    {/* full screen create post modal */}
    <ClassFeedPostModal
      visible={showCreateModal}
      courseCode={courseCode}
      newPostContent={newPostContent}
      onContentChange={setNewPostContent}
      onClose={() => {
        setShowCreateModal(false);
        setNewPostContent('');
      }}
      onPost={handlePost}
    />

    {/* long press menu modal */}
    <Modal
      visible={longPressMenu !== null}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setLongPressMenu(null)}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-end"
        onPress={() => setLongPressMenu(null)}
      >
        <View className="bg-white rounded-t-3xl pb-8">
          {longPressMenu && (() => {
            const post = posts.find(p => p.id === longPressMenu.postId);
            const comment = post?.comments.find(c => c.id === longPressMenu.commentId);
            const reply = longPressMenu.replyId ? comment?.replies?.find(r => r.id === longPressMenu.replyId) : null;
            const isOwn = longPressMenu.type === 'comment' 
              ? comment?.author === 'Lee Parker Parantar'
              : reply?.author === 'Lee Parker Parantar';

            return (
              <>
                {/* Reply option - always shown */}
                <Pressable 
                  onPress={() => {
                    if (longPressMenu.type === 'comment') {
                      toggleReplyInput(longPressMenu.commentId);
                    }
                    setLongPressMenu(null);
                  }}
                  className="flex-row items-center px-6 py-4 border-b border-crystalBell"
                >
                  <ChatCircle size={20} color="#4285F4" weight="regular" />
                  <Text className="text-twilightZone text-base font-medium ml-3">Reply</Text>
                </Pressable>

                {/* Edit option - only for own comments/replies */}
                {isOwn && (
                  <Pressable 
                    onPress={() => {
                      if (longPressMenu.type === 'comment') {
                        startEditComment(longPressMenu.postId, longPressMenu.commentId, longPressMenu.content);
                      } else if (longPressMenu.replyId) {
                        startEditReply(longPressMenu.postId, longPressMenu.commentId, longPressMenu.replyId, longPressMenu.content);
                      }
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-crystalBell"
                  >
                    <PencilSimple size={20} color="#999999" weight="regular" />
                    <Text className="text-twilightZone text-base font-medium ml-3">Edit</Text>
                  </Pressable>
                )}

                {/* Delete option - only for own comments/replies */}
                {isOwn && (
                  <Pressable 
                    onPress={() => {
                      if (longPressMenu.type === 'comment') {
                        deleteComment(longPressMenu.postId, longPressMenu.commentId);
                      } else if (longPressMenu.replyId) {
                        deleteReply(longPressMenu.postId, longPressMenu.commentId, longPressMenu.replyId);
                      }
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-crystalBell"
                  >
                    <Trash size={20} color="#DC2626" weight="regular" />
                    <Text className="text-red-600 text-base font-medium ml-3">Delete</Text>
                  </Pressable>
                )}

                {/* Copy option - always shown */}
                <Pressable 
                  onPress={() => handleCopy(longPressMenu.content)}
                  className="flex-row items-center px-6 py-4"
                >
                  <Copy size={20} color="#999999" weight="regular" />
                  <Text className="text-twilightZone text-base font-medium ml-3">Copy</Text>
                </Pressable>
              </>
            );
          })()}
        </View>
      </Pressable>
    </Modal>
  </>
  );
}
