import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { CaretDown, DownloadSimple, FileDoc, FilePdf, FileText, FolderOpen, FolderSimple } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { authService, generalService, lampService } from "../../services";
import { SettingsResponse } from "../../types/api";
import { getErrorMessage } from "../../utils/errorHandler";
import { FileSystemUnavailableError, getWritableDirectory, saveFileToDevice } from "../../utils/fileSystem";

type Resource = {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'doc' | 'ppt' | 'other';
  size?: string;
  uploadDate: string;
  filepath?: string; // File path for downloading
  items?: Resource[];
};

type ClassResourcesProps = {
  courseCode: string;
  classcode?: string; // Optional - will be fetched if not provided
};

export default function ClassResources({ courseCode, classcode }: ClassResourcesProps) {
  // track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualClasscode, setActualClasscode] = useState<string | null>(classcode || null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Format date from API
  const formatDateFromAPI = (dateStr: string): string => {
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Get file type from filename
  const getFileTypeFromName = (filename: string): 'pdf' | 'doc' | 'ppt' | 'other' => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    return 'other';
  };

  // Format file size (placeholder - API might not return size)
  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Transform API resource to Resource type
  const transformResource = (apiResource: any): Resource => {
    // Extract filepath from filedir_fld
    // Format can be: "filename?path/to/file" or just "path/to/file"
    let filepath: string | undefined = undefined;
    if (apiResource.filedir_fld) {
      const filedir = apiResource.filedir_fld;
      if (filedir.includes('?')) {
        // Format: "filename?path/to/file" - extract the path part
        filepath = filedir.split('?')[1];
      } else {
        // Format: "path/to/file" - use as is
        filepath = filedir;
      }
    }
    
    const filename = filepath?.split('/').pop() || apiResource.title_fld || 'Untitled';
    const hasFile = apiResource.withfile_fld === 1 || apiResource.withfile_fld === '1';
    
    return {
      id: apiResource.recno_fld?.toString() || apiResource.rescode_fld?.toString() || '',
      name: apiResource.title_fld || filename,
      type: hasFile ? getFileTypeFromName(filename) : 'other',
      size: formatFileSize(apiResource.size_fld),
      uploadDate: formatDateFromAPI(apiResource.datetime_fld),
      filepath, // Store filepath for downloading
    };
  };

  // Group resources by topiccode (folders)
  const groupResourcesByTopic = (apiResources: any[]): Resource[] => {
    const topicMap: { [key: string]: { topic: any; resources: any[] } } = {};
    const standaloneResources: any[] = [];

    apiResources.forEach((resource) => {
      if (resource.topiccode_fld && resource.topicname_fld) {
        // Resource belongs to a topic (folder)
        if (!topicMap[resource.topiccode_fld]) {
          topicMap[resource.topiccode_fld] = {
            topic: {
              id: resource.topiccode_fld,
              name: resource.topicname_fld,
            },
            resources: [],
          };
        }
        topicMap[resource.topiccode_fld].resources.push(resource);
      } else {
        // Standalone resource (no topic)
        standaloneResources.push(resource);
      }
    });

    const result: Resource[] = [];

    // Add folders (topics) with their resources
    Object.values(topicMap).forEach(({ topic, resources: topicResources }) => {
      result.push({
        id: `topic-${topic.id}`,
        name: topic.name,
        type: 'folder',
        uploadDate: 'Multiple dates',
        items: topicResources.map(transformResource),
      });
    });

    // Add standalone resources
    standaloneResources.forEach((resource) => {
      result.push(transformResource(resource));
    });

    return result;
  };

  // Fetch classcode if not provided (similar to other components)
  useEffect(() => {
    const fetchClasscode = async () => {
      if (classcode) {
        setActualClasscode(classcode);
        return;
      }

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

  // Fetch resources (wrapped in useCallback for useFocusEffect)
  const fetchResources = useCallback(async () => {
    if (!actualClasscode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await lampService.getClassResources({
        p_classcode: actualClasscode,
      });

      if (response.status.rem === 'success' && response.data) {
        const apiResources = Array.isArray(response.data) ? response.data : [];
        const groupedResources = groupResourcesByTopic(apiResources);
        setResources(groupedResources);
      } else if (response.status.msg?.includes('No Records') || 
                 response.status.msg?.includes('no records')) {
        // No resources - set empty array
        setResources([]);
      } else {
        setError(response.status.msg || 'Failed to load resources');
      }
    } catch (err: any) {
      // Handle "no records" error gracefully
      const errorMsg = err?.message || err?.data?.message || '';
      if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
        setResources([]);
      } else {
        console.error('Error fetching resources:', err);
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [actualClasscode]);

  // Fetch resources when classcode is available
  useEffect(() => {
    if (actualClasscode) {
      fetchResources();
    }
  }, [fetchResources]);

  // Refresh resources when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (actualClasscode) {
        fetchResources();
      }
    }, [fetchResources, actualClasscode])
  );


  // toggle folder expand/collapse
  const toggleFolder = (folderId: string) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId],
    });
  };

  // handle view file action (same as download for now)
  const handleView = (resource: Resource) => {
    if (resource.filepath) {
      handleDownload(resource);
    } else {
      Alert.alert('No File', 'This resource does not have an attached file.');
    }
  };

  // handle download file action
  const handleDownload = async (resource: Resource) => {
    if (!resource.filepath) {
      Alert.alert('Error', 'File path not available');
      return;
    }

    try {
      setDownloadingFileId(resource.id);

      // Download file from API
      const downloadResult = await lampService.downloadFileBinary(resource.filepath);

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
      const sanitizedFilename = resource.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${cacheDir}${sanitizedFilename}`;

      // Write base64 data to file
      await FileSystem.writeAsStringAsync(fileUri, downloadResult.data, {
        encoding: 'base64' as any,
      });

      // Save file and show options to user
      await saveFileToDevice(fileUri, resource.name, mimeType);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  // get icon based on file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FilePdf size={24} color="#dc2626" weight="fill" />;
      case 'doc':
        return <FileDoc size={24} color="#2563eb" weight="fill" />;
      case 'ppt':
        return <FileText size={24} color="#ea580c" weight="fill" />;
      default:
        return <FileText size={24} color="#6b7280" weight="fill" />;
    }
  };

  // render resource item recursively
  const renderResource = (resource: Resource, depth: number = 0) => {
    const isFolder = resource.type === 'folder';
    const isExpanded = expandedFolders[resource.id];
    const paddingLeft = depth * 16;

    return (
      <View key={resource.id}>
        <Pressable
          onPress={() => isFolder ? toggleFolder(resource.id) : handleView(resource)}
          className="bg-white rounded-2xl border border-crystalBell p-4 mb-3"
          style={{ marginLeft: paddingLeft }}
        >
          <View className="flex-row items-center">
            {/* file/folder icon */}
            <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
              {isFolder ? (
                isExpanded ? (
                  <FolderOpen size={24} color="#4285F4" weight="fill" />
                ) : (
                  <FolderSimple size={24} color="#4285F4" weight="fill" />
                )
              ) : (
                getFileIcon(resource.type)
              )}
            </View>

            {/* resource info */}
            <View className="flex-1">
              <Text className="text-twilightZone font-semibold text-base">
                {resource.name}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-millionGrey text-xs">
                  {resource.uploadDate}
                </Text>
                {resource.size && (
                  <>
                    <Text className="text-millionGrey text-xs mx-1">•</Text>
                    <Text className="text-millionGrey text-xs">{resource.size}</Text>
                  </>
                )}
                {isFolder && resource.items && (
                  <>
                    <Text className="text-millionGrey text-xs mx-1">•</Text>
                    <Text className="text-millionGrey text-xs">
                      {resource.items.length} files
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* expand/collapse indicator for folders */}
            {isFolder && (
              <CaretDown 
                size={20} 
                color="#999999" 
                weight="regular"
                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
              />
            )}

            {/* download button for files */}
            {!isFolder && (
              <View className="flex-row gap-2">
                <Pressable 
                  onPress={() => handleDownload(resource)}
                  className="p-2 rounded-lg"
                  disabled={downloadingFileId === resource.id || !resource.filepath}
                >
                  {downloadingFileId === resource.id ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <DownloadSimple size={20} color={resource.filepath ? "#4285F4" : "#999999"} weight="regular" />
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>

        {/* nested folder items */}
        {isFolder && isExpanded && resource.items && (
          <View>
            {resource.items.map((item) => renderResource(item, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4285F4" />
        <Text className="text-millionGrey mt-4">Loading resources...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-red-600 text-base text-center mb-4">{error}</Text>
        <Pressable
          onPress={fetchResources}
          className="bg-metalDeluxe rounded-full px-6 py-3"
        >
          <Text className="text-white text-base">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Empty state */}
        {resources.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-millionGrey text-base">No resources available yet.</Text>
          </View>
        )}

        {/* resources list */}
        {resources.map((resource) => renderResource(resource))}
      </View>
    </ScrollView>
  );
}

