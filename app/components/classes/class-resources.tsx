import { CaretDown, DownloadSimple, FileDoc, FilePdf, FileText, FolderOpen, FolderSimple } from "phosphor-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

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
};

export default function ClassResources({ courseCode }: ClassResourcesProps) {
  // track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  // resources data
  const [resources] = useState<Resource[]>([
    {
      id: '1',
      name: 'Lecture Slides',
      type: 'folder',
      uploadDate: 'Multiple dates',
      items: [
        {
          id: '1-1',
          name: 'Week_1_Introduction.pdf',
          type: 'pdf',
          size: '2.4 MB',
          uploadDate: 'Oct 1, 2025',
        },
        {
          id: '1-2',
          name: 'Week_2_Literature_Review.pdf',
          type: 'pdf',
          size: '3.1 MB',
          uploadDate: 'Oct 8, 2025',
        },
        {
          id: '1-3',
          name: 'Week_3_Methodology.pdf',
          type: 'pdf',
          size: '2.8 MB',
          uploadDate: 'Oct 15, 2025',
        },
      ],
    },
    {
      id: '2',
      name: 'Reading Materials',
      type: 'folder',
      uploadDate: 'Multiple dates',
      items: [
        {
          id: '2-1',
          name: 'Research_Guidelines.pdf',
          type: 'pdf',
          size: '1.2 MB',
          uploadDate: 'Sep 15, 2025',
        },
        {
          id: '2-2',
          name: 'APA_Citation_Guide.pdf',
          type: 'pdf',
          size: '890 KB',
          uploadDate: 'Sep 15, 2025',
        },
        {
          id: '2-3',
          name: 'Thesis_Format_Template.docx',
          type: 'doc',
          size: '456 KB',
          uploadDate: 'Sep 20, 2025',
        },
      ],
    },
    {
      id: '3',
      name: 'Sample Thesis Papers',
      type: 'folder',
      uploadDate: 'Multiple dates',
      items: [
        {
          id: '3-1',
          name: 'Sample_Thesis_CS_2024.pdf',
          type: 'pdf',
          size: '5.6 MB',
          uploadDate: 'Sep 10, 2025',
        },
        {
          id: '3-2',
          name: 'Sample_Thesis_CS_2023.pdf',
          type: 'pdf',
          size: '4.8 MB',
          uploadDate: 'Sep 10, 2025',
        },
      ],
    },
    {
      id: '4',
      name: 'Course_Syllabus.pdf',
      type: 'pdf',
      size: '1.5 MB',
      uploadDate: 'Aug 15, 2025',
    },
  ]);

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

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* resources list */}
        {resources.map((resource) => renderResource(resource))}
      </View>
    </ScrollView>
  );
}

