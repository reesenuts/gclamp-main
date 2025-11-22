import { router, useLocalSearchParams } from "expo-router";
import { CaretLeft, Clock, DownloadSimple, File, FileDoc, FilePdf, Paperclip, Star, X } from "phosphor-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
};

type InstructorFile = {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'ppt' | 'xls';
  size: string;
  postedDate: string;
};

export default function ActivityDetail() {
  const params = useLocalSearchParams();

  // activity data from params
  const activity = {
    id: params.activityId as string,
    title: params.title as string,
    description: params.description as string,
    dueDate: params.dueDate as string,
    points: parseInt(params.points as string),
    status: params.status as string,
    grade: params.grade ? parseInt(params.grade as string) : undefined,
    submittedDate: params.submittedDate as string || undefined,
    postedDate: params.postedDate as string || undefined,
    courseCode: params.courseCode as string,
    courseName: params.courseName as string,
  };

  // instructor files data
  const [instructorFiles] = useState<InstructorFile[]>([
    {
      id: '1',
      name: 'Chapter_3_Activity_Sheet.pdf',
      type: 'pdf',
      size: '1.2 MB',
      postedDate: 'Nov 10, 2025, 2:30 PM',
    },
    {
      id: '2',
      name: 'Research_Methodology_Worksheet.docx',
      type: 'doc',
      size: '856 KB',
      postedDate: 'Nov 8, 2025, 10:15 AM',
    },
  ]);

  // file attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // comments state
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Melner Balce',
      content: 'Make sure to follow the rubric provided. Late submissions will have deductions.',
      timestamp: '2 days ago',
    }
  ]);
  // new comment input state
  const [newComment, setNewComment] = useState('');
  // comments modal state
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);

  // add file attachment
  const handleAddFile = () => {
    const newFile: Attachment = {
      id: Date.now().toString(),
      name: `document_${attachments.length + 1}.pdf`,
      size: '2.4 MB',
    };
    setAttachments([...attachments, newFile]);
  };

  // remove file attachment
  const handleRemoveFile = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  // submit assignment
  const handleSubmit = () => {
    if (attachments.length === 0) {
      Alert.alert('No Files', 'Please attach at least one file before submitting.');
      return;
    }
    Alert.alert('Success', 'Your work has been submitted successfully!');
    router.back();
  };

  // add comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'You',
      content: newComment,
      timestamp: 'Just now',
    };

    setComments([...comments, comment]);
    setNewComment('');
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
  const handleDownloadInstructorFile = (file: InstructorFile) => {
    Alert.alert('Download', `Downloading ${file.name}...`);
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
        return activity.description;
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
                      <Pressable onPress={() => handleDownloadInstructorFile(file)} className="p-2" >
                        <DownloadSimple size={18} color="#4285F4" weight="regular" />
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

      {/* fixed bottom bar */}
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
                <Pressable onPress={handleSubmit} className="bg-seljukBlue rounded-full p-5 mt-3" >
                  <Text className="text-white text-center font-semibold">
                    Submit Assignment
                  </Text>
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
                    Submitted on {activity.submittedDate} 11:59 PM
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* comments modal */}
      <ClassComment visible={isCommentsModalVisible} comments={comments} newComment={newComment} onClose={handleCloseComments} onCommentChange={setNewComment} onAddComment={handleAddComment} />
    </SafeAreaView>
  );
}

