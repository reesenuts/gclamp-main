import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { CaretLeft, Clock, DownloadSimple, File, FileDoc, FilePdf, Paperclip, Star, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService, generalService, lampService } from "../../../services";
import { SettingsResponse } from "../../../types/api";
import { getErrorMessage } from "../../../utils/errorHandler";
import ClassComment from "./class-comment";

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

type Attachment = {
  id: string;
  name: string;
  size: string;
  uri: string; // File URI for upload
  mimeType: string; // MIME type of the file
};

type InstructorFile = {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'ppt' | 'xls';
  size: string;
  postedDate: string;
  filepath: string; // Full file path for downloading
};

// Format date from API
const formatDateFromAPI = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const time = `${displayHours}:${displayMinutes} ${ampm}`;
    
    return `${month} ${day}, ${year}, ${time}`;
  } catch {
    return dateStr;
  }
};

// Format timestamp for relative time
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
    return formatDateFromAPI(dateStr);
  } catch {
    return dateStr;
  }
};

// Get file type from filename
const getFileType = (filename: string): 'pdf' | 'doc' | 'ppt' | 'xls' => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['xls', 'xlsx'].includes(ext)) return 'xls';
  return 'doc'; // default
};

export default function ActivityDetail() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classcode, setClasscode] = useState<string | null>(null);

  // activity data from params (fallback to params if API data not loaded yet)
  const [activity, setActivity] = useState({
    id: params.activityId as string,
    title: params.title as string,
    description: params.description as string,
    dueDate: params.dueDate as string,
    points: parseInt(params.points as string) || 0,
    status: params.status as string,
    grade: params.grade ? parseInt(params.grade as string) : undefined,
    submittedDate: params.submittedDate as string || undefined,
    postedDate: params.postedDate as string || undefined,
    courseCode: params.courseCode as string,
    courseName: params.courseName as string,
  });

  // instructor files data
  const [instructorFiles, setInstructorFiles] = useState<InstructorFile[]>([]);
  // file attachments state (student uploaded files)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // comments state
  const [comments, setComments] = useState<Comment[]>([]);
  // new comment input state
  const [newComment, setNewComment] = useState('');
  // comments modal state
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  // comment loading state
  const [isAddingComment, setIsAddingComment] = useState(false);
  // download loading state
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  // submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classcode (use from params if provided, otherwise look it up)
  useEffect(() => {
    // If classcode is provided in params, use it directly
    if (params.classcode) {
      setClasscode(params.classcode as string);
      return;
    }

    // Otherwise, look it up by matching courseCode with classes
    const fetchClasscode = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const settingsResponse = await generalService.getSettings();
        if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) return;

        const settings = settingsResponse.data as SettingsResponse;
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
          const matchedClass = classes.find((cls: any) => cls.subjcode_fld === activity.courseCode);
          if (matchedClass?.classcode_fld) {
            setClasscode(matchedClass.classcode_fld);
          }
        }
      } catch (err) {
        console.error('Error fetching classcode:', err);
      }
    };

    fetchClasscode();
  }, [activity.courseCode, params.classcode]);

  // Fetch activity details, files, and comments
  useEffect(() => {
    const fetchActivityData = async () => {
      if (!classcode || !activity.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch activity details
        const activitiesResponse = await lampService.getClassActivities({
          p_classcode: classcode,
        });

        if (activitiesResponse.status.rem === 'success' && activitiesResponse.data) {
          const activities = Array.isArray(activitiesResponse.data) ? activitiesResponse.data : [];
          const matchedActivity = activities.find((act: any) => 
            act.actcode_fld?.toString() === activity.id || 
            act.recno_fld?.toString() === activity.id
          );

          if (matchedActivity) {
            // Fetch submission to get submission date and files
            // Status is already determined from the list, but we need submission data for display
            const user = await authService.getCurrentUser();
            let submissionDate: string | undefined = undefined;
            
            if (user) {
              try {
                const submissionResponse = await lampService.getSubmission({
                  p_id: user.id,
                  p_classcode: classcode,
                  p_actcode: activity.id,
                });

                if (submissionResponse.status.rem === 'success' && submissionResponse.data) {
                  const submission = Array.isArray(submissionResponse.data) 
                    ? submissionResponse.data[0] 
                    : submissionResponse.data;
                  
                  if (submission) {
                    // Get full formatted date (with time)
                    submissionDate = submission.datetime_fld ? formatDateFromAPI(submission.datetime_fld) : undefined;
                  }
                }
              } catch (submissionErr) {
                // If submission fetch fails, keep existing status from params
                console.log('Could not fetch submission:', submissionErr);
              }
            }

            // Use status from params (already determined correctly in the list)
            // We still fetch submission to get the submission date and files for display
            // Status is already accurate from the activities list, so we trust it

            setActivity({
              id: matchedActivity.actcode_fld?.toString() || matchedActivity.recno_fld?.toString() || activity.id,
              title: matchedActivity.title_fld || activity.title,
              description: matchedActivity.desc_fld || activity.description,
              dueDate: formatDateFromAPI(matchedActivity.deadline_fld || ''),
              points: matchedActivity.totalscore_fld || activity.points,
              status: activity.status, // Use status from params (already determined correctly in the list)
              grade: matchedActivity.isscored_fld === 1 ? matchedActivity.score_fld : undefined,
              submittedDate: submissionDate || undefined,
              postedDate: formatDateFromAPI(matchedActivity.datetime_fld || ''),
              courseCode: activity.courseCode,
              courseName: activity.courseName,
            });

            // Extract instructor files from activity
            if (matchedActivity.filedir_fld) {
              const files: InstructorFile[] = [];
              // Handle single file or multiple files
              // File paths can be in format: "filename?path/to/file" or just "path/to/file"
              const filePaths = Array.isArray(matchedActivity.filedir_fld) 
                ? matchedActivity.filedir_fld 
                : [matchedActivity.filedir_fld];
              
              filePaths.forEach((filePath: string) => {
                if (filePath) {
                  // Handle filepath format: "filename?path/to/file" or just "path/to/file"
                  const [filename, path] = filePath.includes('?') 
                    ? filePath.split('?') 
                    : [filePath.split('/').pop() || filePath, filePath];
                  
                  files.push({
                    id: filename,
                    name: filename,
                    type: getFileType(filename),
                    size: 'Unknown', // API doesn't provide size
                    postedDate: formatDateFromAPI(matchedActivity.datetime_fld || ''),
                    filepath: path || filePath, // Use the path part or full filePath
                  });
                }
              });
              setInstructorFiles(files);
            }
          }
        }

        // Fetch student submission files
        const user = await authService.getCurrentUser();
        if (user) {
          try {
            const submissionResponse = await lampService.getSubmission({
              p_id: user.id,
              p_classcode: classcode,
              p_actcode: activity.id,
            });

            if (submissionResponse.status.rem === 'success' && submissionResponse.data) {
              const submission = Array.isArray(submissionResponse.data) 
                ? submissionResponse.data[0] 
                : submissionResponse.data;
              
              // Submission table uses dir_fld (not filedir_fld)
              if (submission?.dir_fld) {
                // Handle file path format: "filename1?path1:filename2?path2" or single path
                const filePathString = submission.dir_fld;
                // Split by ':' to get individual files (if multiple)
                const fileEntries = filePathString.includes(':') 
                  ? filePathString.split(':')
                  : [filePathString];
                
                const files: Attachment[] = fileEntries.map((fileEntry: string, index: number) => {
                  // Parse "filename?path" format
                  const [filename, path] = fileEntry.includes('?') 
                    ? fileEntry.split('?')
                    : [fileEntry.split('/').pop() || `file_${index + 1}`, fileEntry];
                  
                  return {
                    id: `submitted_${index}_${filename}`,
                    name: filename,
                    size: 'Unknown',
                    uri: '', // Not needed for already submitted files
                    mimeType: '', // Not needed for already submitted files
                  };
                });
                setAttachments(files);
              }
            }
          } catch (err) {
            // No submission found - that's okay
            console.log('No submission found');
          }
        }

        // Fetch comments
        try {
          const commentsResponse = await lampService.getClassComments({
            p_actioncode: activity.id,
            p_commentcode: 'com', // Activity comments use 'com' (same as class feed comments)
          });

          if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
            const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
            const transformedComments: Comment[] = apiComments.map((comment: any) => ({
              id: comment.recno_fld?.toString() || comment.commentcode_fld?.toString() || '',
              author: comment.author_fld || comment.fullname_fld || 'Unknown',
              content: comment.content_fld || '',
              timestamp: formatTimestamp(comment.datetime_fld || comment.date_fld),
            }));
            setComments(transformedComments);
          }
        } catch (err) {
          // No comments - that's okay
          console.log('No comments found');
        }
      } catch (err: any) {
        console.error('Error fetching activity data:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [classcode, activity.id]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // add file attachment
  const handleAddFile = async () => {
    try {
      // Pick document(s)
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        multiple: true, // Allow multiple file selection
        copyToCacheDirectory: true, // Copy to cache for upload
      });

      if (result.canceled) {
        return;
      }

      // Handle single or multiple files
      const pickedFiles = result.assets || [];
      
      console.log('DocumentPicker full result:', JSON.stringify(result, null, 2));
      console.log('DocumentPicker assets:', JSON.stringify(pickedFiles, null, 2));
      
      const newAttachments: Attachment[] = pickedFiles.map((file, index) => {
        // DocumentPicker returns: { uri, name, mimeType, size }
        // Ensure we're accessing the correct properties
        const fileUri = file.uri || (file as any).fileUri || '';
        const fileName = file.name || (file as any).fileName || `file_${index + 1}`;
        const fileMimeType = file.mimeType || (file as any).mimeType || 'application/octet-stream';
        
        console.log(`File ${index + 1} from DocumentPicker:`, {
          rawFile: file,
          extractedUri: fileUri,
          extractedName: fileName,
          extractedMimeType: fileMimeType,
        });
        
        if (!fileUri) {
          console.error('WARNING: File URI is empty!', file);
          Alert.alert('Error', `File "${fileName}" does not have a valid URI. Please try selecting the file again.`);
        }
        
        const attachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: fileName,
          size: formatFileSize(file.size || 0),
          uri: fileUri,
          mimeType: fileMimeType,
        };
        
        return attachment;
      });

      setAttachments([...attachments, ...newAttachments]);
    } catch (err: any) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // remove file attachment
  const handleRemoveFile = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  // Helper function to proceed with submission after file upload
  const proceedWithSubmission = async (filepath: string, user: any, classcode: string) => {
    // Step 2: Save submission with uploaded file paths
    // The backend returns filepath as "filename1?path1:filename2?path2"
    
    console.log('Saving submission with filepath:', filepath);
    
    // Backend's saveCommon method adds datetime_fld automatically
    // So we don't need to send p_datetime
    const response = await lampService.saveWork({
      p_classcode: classcode,
      p_actcode: activity.id,
      p_id: user.id,
      p_type: 'submission',
      p_dir: filepath, // Use the filepath from upload response
      p_issubmitted: 1,
      p_isscored: 0,
      p_score: 0,
      // p_datetime is added automatically by backend's saveCommon method
    });

    console.log('Save work response:', JSON.stringify(response, null, 2));

    if (response.status.rem === 'success') {
      // Refresh activity data to update status and show submitted files
      // Trigger the useEffect by updating a dependency or refetching
      setLoading(true);
      
      // Small delay to ensure database commit completes
      // Increased delay to allow database to process and join submission data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refetch activity data
      try {
        // Fetch activity details to update status
        const activitiesResponse = await lampService.getClassActivities({
          p_classcode: classcode,
        });

        // Store matchedActivity in a variable accessible outside the if block
        let matchedActivityData: any = null;
        
        if (activitiesResponse.status.rem === 'success' && activitiesResponse.data) {
          const activities = Array.isArray(activitiesResponse.data) ? activitiesResponse.data : [];
          const matchedActivity = activities.find((act: any) => 
            act.actcode_fld?.toString() === activity.id || 
            act.recno_fld?.toString() === activity.id
          );

          if (matchedActivity) {
            matchedActivityData = matchedActivity;
            
            // Update activity with API data (but don't set status yet - we'll do that after checking submission)
            setActivity(prev => ({
              ...prev,
              id: matchedActivity.actcode_fld?.toString() || matchedActivity.recno_fld?.toString() || activity.id,
              title: matchedActivity.title_fld || activity.title,
              description: matchedActivity.desc_fld || activity.description,
              dueDate: formatDateFromAPI(matchedActivity.deadline_fld || ''),
              points: matchedActivity.totalscore_fld || activity.points,
              grade: matchedActivity.isscored_fld === 1 ? matchedActivity.score_fld : undefined,
              postedDate: formatDateFromAPI(matchedActivity.datetime_fld || ''),
            }));
          }
        }

        // Fetch submission files - also use this to determine submission status
        const submissionResponse = await lampService.getSubmission({
          p_id: user.id,
          p_classcode: classcode,
          p_actcode: activity.id,
        });

        let hasSubmission = false;
        let submissionDate: string | undefined = undefined;

        if (submissionResponse.status.rem === 'success' && submissionResponse.data) {
          const submission = Array.isArray(submissionResponse.data) 
            ? submissionResponse.data[0] 
            : submissionResponse.data;
          
          // If submission exists, activity is submitted
          if (submission) {
            hasSubmission = true;
            // Get submission date from datetime_fld
            submissionDate = submission.datetime_fld ? formatDateFromAPI(submission.datetime_fld).split(',')[0] : undefined;
            
            if (submission?.dir_fld) {
              // Handle file path format: "filename1?path1:filename2?path2" or single path
              const filePathString = submission.dir_fld;
              const fileEntries = filePathString.includes(':') 
                ? filePathString.split(':')
                : [filePathString];
              
              const files: Attachment[] = fileEntries.map((fileEntry: string, index: number) => {
                const [filename, path] = fileEntry.includes('?') 
                  ? fileEntry.split('?')
                  : [fileEntry.split('/').pop() || `file_${index + 1}`, fileEntry];
                
                return {
                  id: `submitted_${index}_${filename}`,
                  name: filename,
                  size: 'Unknown',
                  uri: '',
                  mimeType: '',
                };
              });
              setAttachments(files);
            }
          }
        }

        // Update status based on submission
        if (hasSubmission) {
          // Get deadline from matchedActivity if available, otherwise use current activity state
          let deadline: Date | null = null;
          if (matchedActivityData?.deadline_fld) {
            deadline = new Date(matchedActivityData.deadline_fld);
          } else if (activity.dueDate) {
            // Try to parse the formatted date string back to Date
            try {
              deadline = new Date(activity.dueDate);
            } catch (e) {
              // If parsing fails, deadline remains null
            }
          }
          
          let status = 'done'; // Default to done if submitted
          
          if (deadline && submissionDate) {
            const submitted = new Date(submissionDate);
            status = submitted > deadline ? 'late' : 'done';
          }

          // Update activity with submission status
          setActivity(prev => ({
            ...prev,
            status,
            submittedDate: submissionDate,
          }));
        } else {
          // No submission - determine status based on deadline
          let deadline: Date | null = null;
          if (matchedActivityData?.deadline_fld) {
            deadline = new Date(matchedActivityData.deadline_fld);
          } else if (activity.dueDate) {
            try {
              deadline = new Date(activity.dueDate);
            } catch (e) {
              // If parsing fails, deadline remains null
            }
          }
          
          const now = new Date();
          let status = 'not_started';
          if (deadline && now > deadline) {
            status = 'missing';
          }
          
          setActivity(prev => ({
            ...prev,
            status,
          }));
        }
      } catch (refreshErr) {
        console.error('Error refreshing data:', refreshErr);
      } finally {
        setLoading(false);
      }

      Alert.alert('Success', 'Your work has been submitted successfully!');
    } else {
      Alert.alert('Error', response.status.msg || 'Failed to submit');
    }
  };

  // submit assignment
  const handleSubmit = async () => {
    if (attachments.length === 0) {
      Alert.alert('No Files', 'Please attach at least one file before submitting.');
      return;
    }

    if (!classcode || !activity.id) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please login to submit');
        setIsSubmitting(false);
        return;
      }

      // Get settings for academic year and semester
      const settingsResponse = await generalService.getSettings();
      if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) {
        Alert.alert('Error', 'Failed to load settings');
        setIsSubmitting(false);
        return;
      }

      const settings = settingsResponse.data as SettingsResponse;
      const academicYear = settings.setting?.acadyear_fld || '';
      const semester = settings.setting?.sem_fld || '';

      if (!academicYear || !semester) {
        Alert.alert('Error', 'Academic year or semester not found');
        setIsSubmitting(false);
        return;
      }

      // Step 1: Upload files
      // Filter out attachments without URIs (these are already submitted files)
      const filesToUpload = attachments
        .filter((attachment) => attachment.uri && attachment.uri.trim() !== '')
        .map((attachment) => {
          console.log('Preparing file for upload:', {
            name: attachment.name,
            uri: attachment.uri,
            mimeType: attachment.mimeType,
          });
          return {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.mimeType || 'application/octet-stream',
          };
        });
      
      if (filesToUpload.length === 0) {
        Alert.alert('Error', 'No valid files to upload. Please select files again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Files to upload:', filesToUpload.length, 'files');

      const uploadResponse = await lampService.uploadFile(
        academicYear,
        semester,
        user.id,
        filesToUpload
      );

      // Log upload response for debugging
      console.log('Upload response:', JSON.stringify(uploadResponse, null, 2));

      if (uploadResponse.status.rem !== 'success') {
        Alert.alert('Upload Failed', uploadResponse.status.msg || 'Failed to upload files. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check if filepath exists in response
      const filepath = uploadResponse.data?.filepath;
      
      // Backend bug: returns success even when filepath is empty
      // This happens when $_FILES['file'] is not populated correctly
      if (!filepath || filepath.trim() === '') {
        console.error('Upload succeeded but filepath is empty. Backend may not be receiving files correctly.');
        console.error('Full upload response:', uploadResponse);
        
        Alert.alert(
          'Upload Issue', 
          'The server did not return file paths. This usually means:\n\n' +
          '1. Files were not received by the server\n' +
          '2. Backend file upload handling issue\n\n' +
          'Please check backend logs or server file system.\n\n' +
          'Question: Are the files actually being saved to the server?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setIsSubmitting(false);
              },
            },
          ]
        );
        return;
      }
      
      console.log('Filepath from upload:', filepath);
      
      // Proceed with submission
      await proceedWithSubmission(filepath, user, classcode);
    } catch (err: any) {
      console.error('Error submitting:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !classcode || !activity.id || isAddingComment) return;

    try {
      setIsAddingComment(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please login to comment');
        setIsAddingComment(false);
        return;
      }

      // Backend's saveCommon method adds datetime_fld automatically
      // So we don't need to send p_date
      const response = await lampService.addClassComment({
        p_content: newComment.trim(),
        p_id: user.id,
        p_classcode: classcode,
        p_actioncode: activity.id,
        p_ctype: 'comment',
      });

      if (response.status.rem === 'success') {
        // Clear comment input
    setNewComment('');

        // The addClassComment response might contain the comments
        // If it does, use it directly; otherwise fetch them
        if (response.data && Array.isArray(response.data)) {
          const apiComments = response.data;
          const transformedComments: Comment[] = apiComments.map((comment: any) => ({
            id: comment.recno_fld?.toString() || comment.commentcode_fld?.toString() || '',
            author: comment.author_fld || comment.fullname_fld || 'Unknown',
            content: comment.content_fld || '',
            timestamp: formatTimestamp(comment.datetime_fld || comment.date_fld),
          }));
          setComments(transformedComments);
        } else {
          // Small delay to ensure database commit completes
          await new Promise(resolve => setTimeout(resolve, 300));

          // Fetch comments
          try {
            const commentsResponse = await lampService.getClassComments({
              p_actioncode: activity.id,
              p_commentcode: 'com', // Activity comments use 'com' (same as class feed comments)
            });

            if (commentsResponse.status.rem === 'success' && commentsResponse.data) {
              const apiComments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
              const transformedComments: Comment[] = apiComments.map((comment: any) => ({
                id: comment.recno_fld?.toString() || comment.commentcode_fld?.toString() || '',
                author: comment.author_fld || comment.fullname_fld || 'Unknown',
                content: comment.content_fld || '',
                timestamp: formatTimestamp(comment.datetime_fld || comment.date_fld),
              }));
              setComments(transformedComments);
            } else if (commentsResponse.status.msg?.includes('No Records')) {
              // No comments - set empty array
              setComments([]);
            }
          } catch (err: any) {
            // Handle "no records" error gracefully
            const errorMsg = err?.message || err?.data?.message || '';
            if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
              setComments([]);
            } else {
              console.error('Error fetching comments after add:', err);
            }
          }
        }
      } else {
        Alert.alert('Error', response.status.msg || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      const errorMsg = err?.message || err?.data?.message || '';
      if (!errorMsg.includes('No Records') && !errorMsg.includes('no records')) {
        Alert.alert('Error', getErrorMessage(err));
      }
    } finally {
      setIsAddingComment(false);
    }
  };

  // open comments modal
  const handleOpenComments = () => {
    setIsCommentsModalVisible(true);
  };

  // close comments modal
  const handleCloseComments = () => {
    setIsCommentsModalVisible(false);
  };

  // get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'done':
        return {
          label: 'DONE',
          bgColor: 'bg-dewMist',
          textColor: 'text-preciousOxley',
        };
      case 'missing':
        return {
          label: 'MISSING',
          bgColor: 'bg-ladyAnne',
          textColor: 'text-mettwurst',
        };
      case 'not_started':
        return {
          label: 'NOT STARTED',
          bgColor: 'bg-beryl',
          textColor: 'text-wet',
        };
      case 'late':
        return {
          label: 'LATE',
          bgColor: 'bg-ladyAnne',
          textColor: 'text-mettwurst',
        };
      default:
        return {
          label: status.toUpperCase(),
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
        };
    }
  };

  // get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FilePdf size={24} color="#dc2626" weight="fill" />;
      case 'doc':
        return <FileDoc size={24} color="#2563eb" weight="fill" />;
      case 'ppt':
        return <FileDoc size={24} color="#ea580c" weight="fill" />;
      case 'xls':
        return <FileDoc size={24} color="#059669" weight="fill" />;
      default:
        return <Paperclip size={24} color="#6b7280" weight="regular" />;
    }
  };

  // handle view instructor file
  const handleViewInstructorFile = (file: InstructorFile) => {
    Alert.alert('View File', `Opening ${file.name}...`);
  };

  // handle download instructor file
  const handleDownloadInstructorFile = async (file: InstructorFile) => {
    if (!file.filepath) {
      Alert.alert('Error', 'File path not available');
      return;
    }

    try {
      setDownloadingFileId(file.id);

      // Download file from API
      const downloadResult = await lampService.downloadFileBinary(file.filepath);

      // Get file extension from filename
      const mimeType = downloadResult.mimeType || 'application/octet-stream';

      // Get cache directory - access FileSystem constants
      // Note: In some Expo Go versions, these might not be available
      // They should be available on physical devices with latest Expo Go
      const FileSystemAny = FileSystem as any;
      const cacheDir = FileSystemAny.cacheDirectory || FileSystemAny.documentDirectory;
      
      if (!cacheDir) {
        // File system directories are not available
        // This can happen in Expo Go on some devices/versions
        Alert.alert(
          'File System Not Available', 
          'File system access is not available in your current Expo Go environment.\n\n' +
          'To use file downloads, please:\n\n' +
          '• Update Expo Go to the latest version\n' +
          '• Or build a development/standalone app\n\n' +
          'You can build a development build with:\n' +
          'npx expo run:android (or run:ios)'
        );
        return;
      }
      
      // Ensure directory exists
      try {
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        }
      } catch (dirError) {
        // Directory might already exist, continue
        console.log('Directory check:', dirError);
      }
      
      // Sanitize filename to avoid path issues
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${cacheDir}${sanitizedFilename}`;

      // Write base64 data to file
      // Use 'base64' as string since EncodingType might not be available in types
      await FileSystem.writeAsStringAsync(fileUri, downloadResult.data, {
        encoding: 'base64' as any,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Share/open the file
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Open ${file.name}`,
        });
      } else {
        Alert.alert('Success', `File downloaded to: ${fileUri}`);
      }
    } catch (err: any) {
      console.error('Error downloading file:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  // get status config and check if submitted
  const statusConfig = getStatusConfig(activity.status);
  const isSubmitted = activity.status === 'done' || activity.status === 'late';

  // get detailed instructions based on activity id
  const getDetailedInstructions = (activityId: string) => {
    switch (activityId) {
      case '1':
        return `Please submit your Chapter 3 draft for review. Your submission should include the following sections:

1. Research Design and Methodology
   - Describe your research design (experimental, survey, case study, etc.)
   - Explain why this design is appropriate for your research
   - Detail your sampling method and sample size

2. Data Collection Procedures
   - Describe how you will collect data
   - Include any instruments or tools you will use
   - Explain the data collection timeline

3. Data Analysis Plan
   - Specify the statistical methods or analysis techniques you will use
   - Explain how you will interpret the results
   - Include any software tools you will use for analysis

4. Ethical Considerations
   - Discuss any ethical issues related to your research
   - Explain how you will obtain informed consent
   - Describe measures to protect participant confidentiality

Your draft should be between 8-10 pages, double-spaced, using APA 7th edition format. Include a title page, table of contents, and references section. Make sure to cite at least 10 relevant sources.

The rubric for this assignment focuses on:
- Clarity and organization (25%)
- Research design appropriateness (25%)
- Methodology detail and justification (25%)
- Writing quality and APA formatting (25%)

Please submit your draft as a PDF file. Late submissions will receive a 10% deduction per day.`;
      case '2':
        return `This midterm quiz covers topics from Chapters 1-5 of your textbook. The quiz will be conducted online and consists of:

- 20 multiple choice questions (1 point each)
- 5 short answer questions (6 points each)
- Total: 50 points

Topics covered:
1. Introduction to Research Methods
2. Literature Review and Research Questions
3. Research Design Fundamentals
4. Sampling Techniques
5. Data Collection Methods

The quiz will be available from 8:00 AM to 11:59 PM on the due date. You have 90 minutes to complete the quiz once you start. Make sure you have a stable internet connection before beginning.

You are allowed to use your textbook and notes, but collaboration with other students is strictly prohibited. Any evidence of cheating will result in a zero grade.

To access the quiz, log into the course portal and click on the "Midterm Quiz" link. The quiz will automatically submit when time expires or when you click submit.`;
      case '3':
        return `Submit your final Chapter 2 submission. This should be a polished, complete version of your literature review chapter. Requirements include:

1. Introduction to the Chapter
   - Provide context for the literature review
   - State the purpose and scope

2. Theoretical Framework
   - Present relevant theories that inform your research
   - Explain how these theories relate to your study

3. Review of Related Literature
   - Organize literature by themes or topics
   - Synthesize findings from multiple sources
   - Identify gaps in existing research

4. Summary and Conclusion
   - Summarize key findings from the literature
   - Highlight gaps your research will address
   - Transition to your research methodology

Your submission should be 12-15 pages, double-spaced, using APA 7th edition format. Include at least 25 peer-reviewed sources published within the last 10 years. Use proper in-text citations and ensure all sources are included in your references list.

The chapter should demonstrate:
- Critical analysis of existing literature
- Clear organization and logical flow
- Proper academic writing style
- Comprehensive coverage of relevant topics

Submit as a PDF file. Include a title page and ensure proper formatting throughout.`;
      case '4':
        return `Complete the research methodology worksheet provided. This assignment will help you develop a comprehensive methodology section for your thesis.

The worksheet includes sections on:

1. Research Design Selection
   - Choose and justify your research design
   - Explain why this design fits your research questions

2. Population and Sampling
   - Define your target population
   - Describe your sampling method and sample size
   - Justify your sampling approach

3. Data Collection Instruments
   - Describe or develop your data collection tools
   - Include validity and reliability considerations
   - Explain how you will pilot test instruments

4. Data Collection Procedures
   - Detail step-by-step procedures
   - Include timeline and logistics
   - Address potential challenges and solutions

5. Data Analysis Plan
   - Specify analysis methods
   - Explain how you will handle missing data
   - Describe software and tools to be used

Fill out all sections completely. Use academic language and provide detailed explanations. Reference relevant methodology literature to support your choices. The completed worksheet should be 5-7 pages.

Submit the completed worksheet as a Word document (.docx). Make sure to save your work frequently to avoid data loss.`;
      case '5':
        return `Submit your literature review section for your thesis. This is a critical component that demonstrates your understanding of existing research in your field.

Your literature review should:

1. Provide a comprehensive overview of relevant research
   - Cover major themes and topics
   - Include both classic and recent studies
   - Synthesize findings from multiple sources

2. Critically analyze existing literature
   - Identify strengths and weaknesses of previous studies
   - Compare and contrast different approaches
   - Highlight methodological issues or gaps

3. Establish the foundation for your research
   - Show how your research builds on existing work
   - Identify gaps your research will address
   - Justify the need for your study

4. Maintain academic rigor
   - Use only peer-reviewed sources
   - Ensure proper citation and referencing
   - Follow APA 7th edition format strictly

Requirements:
- Length: 15-20 pages (double-spaced)
- Minimum 30 peer-reviewed sources
- Proper organization with clear headings
- Synthesis rather than summary of sources
- Clear identification of research gaps

Your literature review will be evaluated based on:
- Comprehensiveness (30%)
- Critical analysis (30%)
- Organization and clarity (25%)
- Writing quality and formatting (15%)

Submit as a PDF file. Include a title page and ensure all citations are properly formatted. Late submissions will not be accepted without prior approval.`;
      default:
        return activity.description || 'No additional instructions provided.';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* header with back button */}
      <View className="px-4 pt-4 pb-4 bg-white border-b border-crystalBell">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <CaretLeft size={24} color="#191815" weight="regular" />
          <Text className="text-twilightZone text-lg font-semibold ml-3 flex-1" numberOfLines={1}>
            {activity.courseName}
          </Text>
        </Pressable>
      </View>

      {/* scrollable content */}
      {!loading && !error && (
      <ScrollView className="flex-1 mb-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6">
          {/* status badge */}
          <View className={`${statusConfig.bgColor} px-3 py-1 rounded-full self-start mb-4`}>
            <Text className={`${statusConfig.textColor} text-xs font-semibold`}>
              {statusConfig.label}
            </Text>
          </View>

          {/* activity name and points card */}
          <View className="bg-white rounded-2xl border border-crystalBell p-4 mb-4">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-twilightZone text-xl font-semibold flex-1 mr-3">
                {activity.title}
              </Text>
              <Text className="text-seljukBlue font-bold text-lg mb-2">
                {activity.points} pts
              </Text>
            </View>
            {/* posted and due dates */}
            <View className="flex flex-col gap-1">
              {activity.postedDate && (
                <View className="flex-row items-center mr-3">
                  <Clock size={14} color="#999999" weight="fill" />
                  <Text className="text-millionGrey text-xs ml-2">
                    Posted on {activity.postedDate}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <Clock size={14} color="#999999" weight="fill" />
                <Text className="text-millionGrey text-xs ml-2">
                  Due on {activity.dueDate}
                </Text>
              </View>
            </View>
          </View>

          {/* instructions / description */}
          <View className="bg-white border border-crystalBell rounded-2xl p-4">
            <Text className="text-twilightZone text-lg font-semibold mb-3">
              Instructions
            </Text>
            <Text className="text-twilightZone text-base leading-7">
              {getDetailedInstructions(activity.id)}
            </Text>
          </View>

          {/* instructor attached files section */}
          {instructorFiles.length > 0 && (
            <View className="bg-white rounded-2xl border border-crystalBell p-4 mb-4 mt-6">
              <Text className="text-twilightZone text-base font-semibold mb-3">
                Attached Files
              </Text>
              {instructorFiles.map((file) => (
                <View key={file.id} className="border border-crystalBell rounded-xl p-3 mb-2" >
                  <View className="flex-row items-center">
                    {/* file icon */}
                    <View className="w-10 h-10 rounded-lg bg-white items-center justify-center mr-3">
                      {getFileIcon(file.type)}
                    </View>
                    {/* file info */}
                    <View className="flex-1">
                      <Text className="text-twilightZone font-medium text-sm">
                        {file.name}
                      </Text>
                      <Text className="text-millionGrey text-xs">
                        {file.size}
                      </Text>
                    </View>
                    {/* download button */}
                    <View className="flex-row gap-2">
                      <Pressable 
                        onPress={() => handleDownloadInstructorFile(file)} 
                        className="p-2"
                        disabled={downloadingFileId === file.id}
                      >
                        {downloadingFileId === file.id ? (
                          <ActivityIndicator size="small" color="#4285F4" />
                        ) : (
                        <DownloadSimple size={18} color="#4285F4" weight="regular" />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* user uploaded files section */}
          {!isSubmitted && (
            <View className="bg-white rounded-2xl border border-crystalBell p-4 mb-4" >
              <Text className="text-twilightZone text-base font-semibold mb-3">
                Your Work
              </Text>
              {attachments.length > 0 ? (
                <View>
                  {attachments.map((file) => (
                    <View key={file.id} className="flex-row items-center border border-crystalBell rounded-2xl p-4 mb-2" >
                      <File size={20} color="#4285F4" weight="fill" />
                      {/* file details */}
                      <View className="flex-1 mx-3">
                        <Text className="text-twilightZone font-medium text-sm">
                          {file.name}
                        </Text>
                        <Text className="text-millionGrey text-xs">
                          {file.size}
                        </Text>
                      </View>
                      {/* remove button */}
                      <Pressable onPress={() => handleRemoveFile(file.id)} >
                        <X size={16} color="#dc2626" weight="bold" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-millionGrey text-base border border-crystalBell rounded-2xl p-3">
                  No files uploaded yet. Use the "Upload File" button below to add your work.
                </Text>
              )}
            </View>
          )}

          {/* class comments preview card */}
          <Pressable onPress={handleOpenComments} className="bg-white rounded-2xl border border-crystalBell p-4" >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-twilightZone text-base font-semibold">
                Class Comments ({comments.length})
              </Text>
              <Text className="text-starfleetBlue text-sm font-medium">
                View all
              </Text>
            </View>
            {/* preview first 2 comments */}
            {comments.length > 0 && (
              <View className="">
                {comments.slice(0, 2).map((comment) => (
                  <View key={comment.id} className="mt-4">
                    <View className="flex-row items-start">
                      {/* commentor avatar */}
                      <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-2 items-center justify-center">
                        <Text className="text-metalDeluxe font-bold text-sm">
                          {comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                      {/* comment content */}
                      <View className="flex-1 rounded-lg">
                        <View className="flex-row items-center">
                          <Text className="text-twilightZone font-semibold text-base">
                            {comment.author}
                          </Text>
                          <Text className="text-millionGrey text-xs mx-1">•</Text>
                          <Text className="text-millionGrey text-xs">
                            {comment.timestamp}
                          </Text>
                        </View>
                        <Text className="text-twilightZone text-base" numberOfLines={2}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
      )}

      {/* fixed bottom bar */}
      {!loading && !error && (
      <SafeAreaView edges={['bottom']} className="bg-white border-t border-crystalBell">
        <View className="px-6 py-4">
          {!isSubmitted ? (
            <>
              {/* upload file button */}
              <Pressable onPress={handleAddFile} className="bg-white border border-crystalBell rounded-full p-5" >
                <Text className="text-twilightZone text-center font-semibold">
                  Upload File
                </Text>
              </Pressable>
              {/* submit button (shown when files attached) */}
              {attachments.length > 0 && (
                <Pressable 
                  onPress={handleSubmit} 
                  className="bg-seljukBlue rounded-full p-5 mt-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white text-center font-semibold ml-2">
                        Submitting...
                      </Text>
                    </View>
                  ) : (
                  <Text className="text-white text-center font-semibold">
                    Submit Assignment
                  </Text>
                  )}
                </Pressable>
              )}
            </>
          ) : (
            <View className="bg-white rounded-2xl border border-crystalBell p-4">
              <View className="flex-row items-center justify-between mb-3">
                {/* file name */}
                <View className="flex-row items-center flex-1">
                  <FilePdf size={20} color="#DC2626" weight="fill" />
                  <Text className="text-twilightZone font-medium ml-2 flex-1" numberOfLines={1}>
                    {activity.title.replace(/\s+/g, '_')}.pdf
                  </Text>
                </View>
                {/* graded points */}
                {activity.grade !== undefined && (
                  <View className="flex-row items-center ml-3">
                    <Star size={18} color="#4285F4" weight="fill" />
                    <Text className="text-seljukBlue text-lg font-bold ml-2">
                      {activity.grade} / {activity.points}
                    </Text>
                  </View>
                )}
              </View>
              {/* submission date */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Clock size={14} color="#999999" weight="fill" />
                  <Text className="text-millionGrey text-xs ml-2">
                    Submitted on {activity.submittedDate || 'Unknown date'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
      )}

      {/* comments modal */}
      {!loading && !error && (
        <ClassComment 
          visible={isCommentsModalVisible} 
          comments={comments} 
          newComment={newComment}
          loading={isAddingComment}
          onClose={handleCloseComments} 
          onCommentChange={setNewComment} 
          onAddComment={handleAddComment} 
        />
      )}
    </SafeAreaView>
  );
}

