import { CaretDown, DownloadSimple, FileDoc, FilePdf, FileText, FolderOpen, FolderSimple } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { lampService } from "../../services";
import { getErrorMessage } from "../../utils/errorHandler";

type Resource = {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'doc' | 'ppt' | 'other';
  size?: string;
  uploadDate: string;
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
    const filename = apiResource.filedir_fld?.split('/').pop() || apiResource.title_fld || 'Untitled';
    const hasFile = apiResource.withfile_fld === 1 || apiResource.withfile_fld === '1';
    
    return {
      id: apiResource.recno_fld?.toString() || apiResource.rescode_fld?.toString() || '',
      name: apiResource.title_fld || filename,
      type: hasFile ? getFileTypeFromName(filename) : 'other',
      size: formatFileSize(apiResource.size_fld),
      uploadDate: formatDateFromAPI(apiResource.datetime_fld),
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

  // Fetch resources from API
  const fetchResources = async () => {
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
  };

  // Fetch classcode if not provided (similar to other components)
  useEffect(() => {
    const fetchClasscode = async () => {
      if (classcode) {
        setActualClasscode(classcode);
      } else {
        // If classcode not provided, try to fetch it
        // This would require getting settings and classes - for now, just set loading to false
        setLoading(false);
      }
    };
    fetchClasscode();
  }, [classcode]);

  // Fetch resources when classcode is available
  useEffect(() => {
    if (actualClasscode) {
      fetchResources();
    }
  }, [actualClasscode]);


  // toggle folder expand/collapse
  const toggleFolder = (folderId: string) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId],
    });
  };

  // handle view file action
  const handleView = (resource: Resource) => {
    Alert.alert('View File', `Opening ${resource.name}...`);
  };

  // handle download file action
  const handleDownload = (resource: Resource) => {
    Alert.alert('Download', `Downloading ${resource.name}...`);
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
                >
                  <DownloadSimple size={20} color="#4285F4" weight="regular" />
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

