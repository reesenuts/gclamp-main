import { ChatCircle, Copy, Image, Paperclip, PencilSimple, Trash } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Clipboard, Keyboard, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { authService, generalService, lampService } from "../../../services";
import { SettingsResponse } from "../../../types/api";
import { getErrorMessage } from "../../../utils/errorHandler";
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
  classcode?: string; // Optional - will be fetched if not provided
  instructor: string;
  highlightPostId?: string;
  highlightCommentId?: string;
  highlightReplyId?: string;
};

export default function ClassFeed({ courseCode, classcode, instructor, highlightPostId, highlightCommentId, highlightReplyId }: ClassFeedProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<{ [key: string]: View | null }>({});
  const commentRefs = useRef<{ [key: string]: View | null }>({});
  const replyRefs = useRef<{ [key: string]: View | null }>({});
  const [highlightedItems, setHighlightedItems] = useState<{ postId?: string; commentId?: string; replyId?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullname: string } | null>(null);
  
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

        const { generalService, lampService } = await import("../../../services");
        const settingsResponse = await generalService.getSettings();
        if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) return;

        const settings = settingsResponse.data as any;
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

  // Fetch current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser({ id: user.id, fullname: user.fullname });
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  // Format timestamp from API
  const formatTimestamp = (dateStr: string): string => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Transform API post to Post type
  // Parse file path from dir_fld
  // Format: "filename?path/to/file" or "filename1?path1:filename2?path2" for multiple files
  const parseFilePaths = (dirFld: string): Array<{ name: string; path: string; type: 'image' | 'file' }> => {
    if (!dirFld || dirFld.trim() === '') return [];

    const files: Array<{ name: string; path: string; type: 'image' | 'file' }> = [];
    
    // Split by colon to handle multiple files
    const fileEntries = dirFld.split(':');
    
    fileEntries.forEach((entry) => {
      if (entry.includes('?')) {
        const [name, path] = entry.split('?');
        const fileName = decodeURIComponent(name.trim());
        const filePath = path.trim();
        
        // Determine if it's an image based on extension
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
        
        files.push({
          name: fileName,
          path: filePath,
          type: isImage ? 'image' : 'file',
        });
      } else {
        // Fallback: if no '?' separator, treat entire string as path
        const fileName = entry.split('/').pop() || 'Attachment';
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
        
        files.push({
          name: fileName,
          path: entry.trim(),
          type: isImage ? 'image' : 'file',
        });
      }
    });
    
    return files;
  };

  const transformPost = (apiPost: any, comments: Comment[] = []): Post => {
    // Determine if author is instructor (check if author matches instructor name or email)
    const isInstructor = apiPost.author_fld === instructor || 
                        apiPost.email_fld?.includes('@gordoncollege.edu.ph') ||
                        apiPost.role_fld === 'instructor';

    // Parse attachments from dir_fld if withfile_fld is 1
    let attachments: Array<{ type: 'image' | 'file'; name: string; url: string }> | undefined = undefined;
    if (apiPost.withfile_fld === 1 || apiPost.withfile_fld === '1') {
      const dirFld = apiPost.dir_fld || apiPost.filedir_fld || '';
      if (dirFld) {
        const parsedFiles = parseFilePaths(dirFld);
        attachments = parsedFiles.map(file => ({
          type: file.type,
          name: file.name,
          url: file.path, // Store path for downloading
        }));
      }
    }

    return {
      id: apiPost.recno_fld?.toString() || apiPost.postcode_fld?.toString() || '',
      author: apiPost.author_fld || apiPost.fullname_fld || 'Unknown',
      authorRole: isInstructor ? 'instructor' : 'student',
      content: apiPost.content_fld || '',
      timestamp: formatTimestamp(apiPost.datetime_fld || apiPost.date_fld),
      attachments,
      likes: apiPost.likes_fld || 0,
      comments,
    };
  };

  // Transform API comment to Comment type
  const transformComment = (apiComment: any): Comment => {
    return {
      id: apiComment.recno_fld?.toString() || apiComment.commentcode_fld?.toString() || '',
      author: apiComment.author_fld || apiComment.fullname_fld || 'Unknown',
      content: apiComment.content_fld || '',
      timestamp: formatTimestamp(apiComment.datetime_fld || apiComment.date_fld),
      replies: apiComment.replies ? apiComment.replies.map(transformComment) : undefined,
    };
  };

  // Helper function to fetch all comments for a post (top-level + replies)
  const fetchAllCommentsForPost = async (postId: string): Promise<Comment[]> => {
    try {
      // Fetch top-level comments (commentcode_fld = 'com')
      const commentsResponse = await lampService.getClassComments({
        p_actioncode: postId,
        p_commentcode: 'com',
      });

      let topLevelComments: any[] = [];
      if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
        topLevelComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
      }

      // Fetch replies for each top-level comment
      // Replies have commentcode_fld = 'rep' and actioncode_fld = parent comment's recno_fld
      const commentsWithReplies = await Promise.all(
        topLevelComments.map(async (comment: any) => {
          try {
            const commentRecno = comment.recno_fld?.toString() || '';
            const repliesResponse = await lampService.getClassComments({
              p_actioncode: commentRecno,
              p_commentcode: 'rep',
            });

            let replies: any[] = [];
            if (repliesResponse.status.rem === 'success' && repliesResponse.data) {
              replies = Array.isArray(repliesResponse.data) ? repliesResponse.data : [];
            }

            return { ...comment, replies: replies.length > 0 ? replies : undefined };
          } catch (err) {
            return { ...comment, replies: undefined };
          }
        })
      );

      return commentsWithReplies.map(transformComment);
    } catch (err: any) {
      console.error('Error fetching all comments for post:', err);
      return [];
    }
  };


  // Fetch posts and comments
  useEffect(() => {
    const fetchPosts = async () => {
      if (!actualClasscode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch posts
        const postsResponse = await lampService.getClassPost({
          p_classcode: actualClasscode,
        });

        // Check if response is successful (including "No Records" which is converted to success with null data)
        if (postsResponse.status.rem !== 'success') {
          setError('Failed to load posts');
          setLoading(false);
          return;
        }

        // Handle null data (no posts) - this is valid, not an error
        const apiPosts = postsResponse.data && Array.isArray(postsResponse.data) 
          ? postsResponse.data 
          : [];

        // Fetch comments for each post
        const postsWithComments = await Promise.all(
          apiPosts.map(async (apiPost: any) => {
            const postId = apiPost.recno_fld?.toString() || apiPost.postcode_fld?.toString() || '';
            
            try {
              const comments = await fetchAllCommentsForPost(postId);
              return transformPost(apiPost, comments);
            } catch (err: any) {
              // Check if error is "no records" - that's okay, just means no comments
              const errorMsg = err?.message || err?.data?.message || '';
              if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
                // No comments found - this is fine, return empty array
                return transformPost(apiPost, []);
              }
              // For other errors, log but still return post with empty comments
              console.error('Error fetching comments for post:', err);
              return transformPost(apiPost, []);
            }
          })
        );

        setPosts(postsWithComments);
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [actualClasscode, instructor]);

  // posts data
  const [posts, setPosts] = useState<Post[]>([]);

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
  const [postAttachments, setPostAttachments] = useState<Array<{ id: string; uri: string; name: string; type: 'image' | 'file'; mimeType?: string }>>([]);
  const [isPosting, setIsPosting] = useState(false);

  // create and add new post
  const handlePost = async () => {
    if ((!newPostContent.trim() && postAttachments.length === 0) || !actualClasscode || !currentUser) return;

    try {
      setIsPosting(true);

      // Step 1: Upload files if there are attachments
      let filepath = '';
      if (postAttachments.length > 0) {
        // Get settings for academic year and semester
        const settingsResponse = await generalService.getSettings();
        if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) {
          Alert.alert('Error', 'Failed to load settings');
          setIsPosting(false);
          return;
        }

        const settings = settingsResponse.data as SettingsResponse;
        const academicYear = settings.setting?.acadyear_fld || '';
        const semester = settings.setting?.sem_fld || '';

        if (!academicYear || !semester) {
          Alert.alert('Error', 'Academic year or semester not found');
          setIsPosting(false);
          return;
        }

        // Prepare files for upload
        const filesToUpload = postAttachments
          .filter((attachment) => attachment.uri && attachment.uri.trim() !== '')
          .map((attachment) => ({
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.mimeType || (attachment.type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
          }));

        if (filesToUpload.length > 0) {
          const uploadResponse = await lampService.uploadFile(
            academicYear,
            semester,
            currentUser.id,
            filesToUpload
          );

          if (uploadResponse.status.rem !== 'success') {
            Alert.alert('Upload Failed', uploadResponse.status.msg || 'Failed to upload files. Please try again.');
            setIsPosting(false);
            return;
          }

          const uploadedFilepath = uploadResponse.data?.filepath;
          if (!uploadedFilepath || uploadedFilepath.trim() === '') {
            Alert.alert('Upload Issue', 'The server did not return file paths. Please try again.');
            setIsPosting(false);
            return;
          }

          filepath = uploadedFilepath;
        }
      }

      // Step 2: Create post with file paths
      // The stored procedure expects: p_content, p_id, p_classcode, p_withfile, p_dir, p_date
      // The backend's saveCommon adds datetime_fld which should map to p_date
      const response = await lampService.addClassPost({
        p_content: newPostContent.trim(),
        p_id: currentUser.id,
        p_classcode: actualClasscode,
        p_withfile: postAttachments.length > 0 ? 1 : 0,
        p_dir: filepath,
      });

      if (response.status.rem === 'success') {
        // Refresh posts
        const postsResponse = await lampService.getClassPost({
          p_classcode: actualClasscode,
        });

        if (postsResponse.status.rem === 'success' && postsResponse.data) {
          const apiPosts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
          const newPosts = await Promise.all(
            apiPosts.map(async (apiPost: any) => {
              const postId = apiPost.recno_fld?.toString() || '';
              try {
                const comments = await fetchAllCommentsForPost(postId);
                return transformPost(apiPost, comments);
              } catch {
                return transformPost(apiPost, []);
              }
            })
          );
          setPosts(newPosts);
        }

    setNewPostContent('');
    setPostAttachments([]);
    setShowCreateModal(false);
    Keyboard.dismiss();
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to create post');
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsPosting(false);
    }
  };

  // add comment to specific post
  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim() || !actualClasscode || !currentUser) return;

    try {
      // Send exactly 5 parameters - backend will add datetime_fld automatically
      // The stored procedure expects: p_content, p_id, p_classcode, p_actioncode, p_ctype, p_date
      // The backend's saveCommon adds datetime_fld which should map to p_date
      // Note: p_commentcode is NOT needed for top-level comments (only for replies)
      const response = await lampService.addClassComment({
        p_content: commentText.trim(),
        p_id: currentUser.id,
        p_classcode: actualClasscode,
        p_actioncode: postId,
        p_ctype: 'comment',
      });

      if (response.status.rem === 'success') {
        // Clear comment input immediately for better UX
        setCommentInputs({ ...commentInputs, [postId]: '' });

        // The addClassComment response already contains all comments for the post
        // Use the response data directly instead of making another API call
        if (response.data && Array.isArray(response.data)) {
          const apiComments = response.data;
          
          // Structure comments with replies (if any)
          // Comments have actioncode_fld = postId, replies have actioncode_fld = comment recno_fld
          const topLevelComments: any[] = [];
          const repliesMap: { [key: string]: any[] } = {};

          apiComments.forEach((comment: any) => {
            // Check if this is a reply (actioncode_fld should match a comment's recno_fld, not the postId)
            // For top-level comments, actioncode_fld should equal the postId
            const isReply = comment.actioncode_fld !== postId && 
                           apiComments.some((c: any) => c.recno_fld?.toString() === comment.actioncode_fld?.toString());
            
            if (isReply) {
              const parentId = comment.actioncode_fld?.toString();
              if (parentId) {
                if (!repliesMap[parentId]) {
                  repliesMap[parentId] = [];
                }
                repliesMap[parentId].push(comment);
              }
            } else {
              // Top-level comment
              topLevelComments.push(comment);
            }
          });

          // Attach replies to their parent comments
          const structuredComments = topLevelComments.map(comment => {
            const commentId = comment.recno_fld?.toString();
            if (commentId && repliesMap[commentId]) {
              return { ...comment, replies: repliesMap[commentId] };
            }
            return comment;
          });

          const comments = structuredComments.map(transformComment);

          // Ensure comments section is visible
          setShowComments({ ...showComments, [postId]: true });

          // Update posts with new comments
    setPosts(posts.map(post => {
      if (post.id === postId) {
              return { ...post, comments };
            }
            return post;
          }));
        } else {
          // Fallback: If response doesn't have comments, try fetching them
          try {
            const commentsResponse = await lampService.getClassComments({
              p_actioncode: postId,
              p_commentcode: '',
            });

            if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
              const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
              const comments = apiComments.map(transformComment);

              setPosts(posts.map(post => {
                if (post.id === postId) {
                  return { ...post, comments };
                }
                return post;
              }));
            } else {
              // No comments found
              setPosts(posts.map(post => {
                if (post.id === postId) {
                  return { ...post, comments: [] };
      }
      return post;
    }));
            }
          } catch (err: any) {
            console.error('Error fetching comments after add:', err);
          }
        }
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', getErrorMessage(err));
    }
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
  const handleReply = async (postId: string, commentId: string) => {
    const replyText = replyInputs[commentId];
    if (!replyText?.trim() || !actualClasscode || !currentUser) return;

    try {
      // For replies, use commentId as actioncode (the parent comment)
      // Send exactly 5 parameters - backend will add datetime_fld automatically
      // The stored procedure expects: p_content, p_id, p_classcode, p_actioncode, p_ctype, p_date
      // The backend's saveCommon adds datetime_fld which should map to p_date
      const response = await lampService.addClassComment({
        p_content: replyText.trim(),
        p_id: currentUser.id,
        p_classcode: actualClasscode,
        p_actioncode: commentId, // Use commentId for replies (parent comment)
        p_ctype: 'reply',
      });

      if (response.status.rem === 'success') {
        // Clear reply input immediately for better UX
        setReplyInputs({ ...replyInputs, [commentId]: '' });
        setShowReplyInputs({ ...showReplyInputs, [commentId]: false });

        // Small delay to ensure database commit completes
        await new Promise(resolve => setTimeout(resolve, 300));

        // Fetch all comments for the post (top-level + replies) to ensure we have the complete structure
        // The addClassComment response for replies might only contain replies for that comment
        const comments = await fetchAllCommentsForPost(postId);

        // Use functional update to ensure we have the latest state
        setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
            return { ...post, comments };
      }
      return post;
    }));
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to add reply');
      }
    } catch (err: any) {
      console.error('Error adding reply:', err);
      Alert.alert('Error', getErrorMessage(err));
    }
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
  const saveEditComment = async () => {
    if (!editingComment || !editCommentText.trim()) return;

    try {
      const response = await lampService.editClassComment({
        p_actioncode: editingComment.postId,
        p_recno: editingComment.commentId,
        P_content: editCommentText.trim(), // Note: API uses capital P
      });

      if (response.status.rem === 'success') {
        // Refresh comments for this post
        try {
          const commentsResponse = await lampService.getClassComments({
            p_actioncode: editingComment.postId,
            p_commentcode: '',
          });

          if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
            const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
            const comments = apiComments.map(transformComment);

            setPosts(posts.map(post => {
              if (post.id === editingComment.postId) {
                return { ...post, comments };
              }
              return post;
            }));
          } else if (commentsResponse.status.msg?.includes('No Records') || 
                     commentsResponse.status.msg?.includes('no records')) {
            // No comments - set empty array
    setPosts(posts.map(post => {
      if (post.id === editingComment.postId) {
                return { ...post, comments: [] };
              }
              return post;
            }));
          }
        } catch (err: any) {
          // Handle "no records" error gracefully
          const errorMsg = err?.message || err?.data?.message || '';
          if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
            setPosts(posts.map(post => {
              if (post.id === editingComment.postId) {
                return { ...post, comments: [] };
      }
      return post;
    }));
          }
        }

    setEditingComment(null);
    setEditCommentText('');
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to edit comment');
      }
    } catch (err: any) {
      console.error('Error editing comment:', err);
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  // cancel editing comment
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // delete comment (API may not support delete, so we'll just remove from UI for now)
  const deleteComment = async (postId: string, commentId: string) => {
    // Note: Check if API supports delete, otherwise just remove from UI
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
  const saveEditReply = async () => {
    if (!editingReply || !editReplyText.trim()) return;

    try {
      const response = await lampService.editClassComment({
        p_actioncode: editingReply.postId,
        p_recno: editingReply.replyId,
        P_content: editReplyText.trim(),
      });

      if (response.status.rem === 'success') {
        // Refresh comments for this post
        try {
          const commentsResponse = await lampService.getClassComments({
            p_actioncode: editingReply.postId,
            p_commentcode: '',
          });

          if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
            const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
            const comments = apiComments.map(transformComment);

            setPosts(posts.map(post => {
              if (post.id === editingReply.postId) {
                return { ...post, comments };
              }
              return post;
            }));
          } else if (commentsResponse.status.msg?.includes('No Records') || 
                     commentsResponse.status.msg?.includes('no records')) {
            // No comments - set empty array
    setPosts(posts.map(post => {
      if (post.id === editingReply.postId) {
                return { ...post, comments: [] };
              }
              return post;
            }));
          }
        } catch (err: any) {
          // Handle "no records" error gracefully
          const errorMsg = err?.message || err?.data?.message || '';
          if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
            setPosts(posts.map(post => {
              if (post.id === editingReply.postId) {
                return { ...post, comments: [] };
      }
      return post;
    }));
          }
        }

    setEditingReply(null);
    setEditReplyText('');
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to edit reply');
      }
    } catch (err: any) {
      console.error('Error editing reply:', err);
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  // cancel editing reply
  const cancelEditReply = () => {
    setEditingReply(null);
    setEditReplyText('');
  };

  // delete reply (API may not support delete, so we'll just remove from UI for now)
  const deleteReply = async (postId: string, commentId: string, replyId: string) => {
    // Note: Check if API supports delete, otherwise just remove from UI
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
        {/* Loading state */}
        {loading && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4285F4" />
            <Text className="text-millionGrey text-base mt-4">Loading posts...</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Text className="text-red-600 text-base mb-2 text-center">{error}</Text>
            <Pressable
              onPress={() => {
                setError(null);
                setLoading(true);
                // Trigger refetch
                if (actualClasscode) {
                  const fetchPosts = async () => {
                    try {
                      const postsResponse = await lampService.getClassPost({
                        p_classcode: actualClasscode,
                      });
                      if (postsResponse.status.rem === 'success' && postsResponse.data) {
                        const apiPosts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
                        const newPosts = await Promise.all(
                          apiPosts.map(async (apiPost: any) => {
                            const postId = apiPost.recno_fld?.toString() || '';
                            try {
                              const commentsResponse = await lampService.getClassComments({
                                p_actioncode: postId,
                                p_commentcode: '',
                              });
                              let comments: Comment[] = [];
                              if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
                                const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
                                comments = apiComments.map(transformComment);
                              }
                              return transformPost(apiPost, comments);
                            } catch {
                              return transformPost(apiPost, []);
                            }
                          })
                        );
                        setPosts(newPosts);
                        setError(null);
                      }
                    } catch (err: any) {
                      setError(getErrorMessage(err));
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchPosts();
                }
              }}
              className="bg-metalDeluxe rounded-full px-6 py-3 mt-4"
            >
              <Text className="text-white text-base">Retry</Text>
            </Pressable>
          </View>
        )}

        {/* fixed post creation card */}
        {!loading && !error && (
        <View className="px-6 pt-6 pb-3">
          <Pressable onPress={() => setShowCreateModal(true)} className="bg-white rounded-2xl border border-crystalBell p-4 active:opacity-70" >
            <View className="flex-row items-center">
              {/* user avatar */}
              <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 items-center justify-center mr-3">
                <Text className="text-metalDeluxe font-bold">
                  {currentUser?.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </Text>
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
        )}

        {/* scrollable posts feed */}
        {!loading && !error && (
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
                currentUserInitials={currentUser?.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
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

          {/* Empty state */}
          {posts.length === 0 && (
            <View className="items-center justify-center py-20">
              <Text className="text-millionGrey text-base">No posts yet. Be the first to share!</Text>
            </View>
          )}
        </ScrollView>
        )}
      </View>

    {/* full screen create post modal */}
    <ClassFeedPostModal
      visible={showCreateModal}
      courseCode={courseCode}
      newPostContent={newPostContent}
      currentUserName={currentUser?.fullname || 'User'}
      currentUserInitials={currentUser?.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
      attachments={postAttachments}
      isPosting={isPosting}
      onContentChange={setNewPostContent}
      onAttachmentsChange={setPostAttachments}
      onClose={() => {
        setShowCreateModal(false);
        setNewPostContent('');
        setPostAttachments([]);
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
              ? comment?.author === currentUser?.fullname
              : reply?.author === currentUser?.fullname;

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
