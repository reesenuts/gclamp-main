import { router, useFocusEffect } from "expo-router";
import { CaretLeft, MagnifyingGlass } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService, generalService, lampService } from "../services";
import { SettingsResponse } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";

type Contact = {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  classcode?: string;
  className?: string;
};

// get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// convert uppercase name to normal case
const toNormalCase = (name: string) => {
  return name
    .split(',')
    .map(part => 
      part.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(', ');
};

export default function ContactPicker() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch all contacts from user's classes
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please login to view contacts');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Step 2: Get settings (academic year & semester)
      const settingsResponse = await generalService.getSettings();
      if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) {
        setError('Failed to load settings');
        setLoading(false);
        return;
      }

      const settings = settingsResponse.data as SettingsResponse;
      const activeSetting = settings.setting;
      const academicYear = activeSetting?.acadyear_fld || '';
      const semester = activeSetting?.sem_fld || '';

      if (!academicYear || !semester) {
        setError('Academic year or semester not found');
        setLoading(false);
        return;
      }

      // Step 3: Get student classes
      const classesResponse = await lampService.getStudentClasses({
        p_id: user.id,
        p_ay: academicYear,
        p_sem: String(semester),
      });

      if (classesResponse.status.rem !== 'success' || !classesResponse.data) {
        setError(classesResponse.status.msg || 'Failed to load classes');
        setLoading(false);
        return;
      }

      const classes = Array.isArray(classesResponse.data) ? classesResponse.data : [];
      if (classes.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Step 4: Fetch members from all classes
      const allContacts: Contact[] = [];
      const contactIds = new Set<string>(); // Track unique contacts by ID

      for (const classItem of classes) {
        const classcode = classItem.classcode_fld || classItem.recno_fld?.toString() || '';
        const className = classItem.subjdesc_fld || classItem.name_fld || 'Unknown Class';
        const instructor = classItem.instructor_fld || classItem.instructor || '';

        if (!classcode) continue;

        try {
          // Fetch students in this class
          const studentsResponse = await lampService.getStudentsInClass({
            p_classcode: classcode,
          });

          if (studentsResponse.status.rem === 'success' && studentsResponse.data) {
            const apiStudents = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];

            // Transform and add students
            apiStudents.forEach((apiStudent: any) => {
              const fullName = apiStudent.fullname_fld || 
                             apiStudent.name_fld || 
                             apiStudent.studentname_fld ||
                             `${apiStudent.fname_fld || ''} ${apiStudent.mname_fld || ''} ${apiStudent.lname_fld || ''}`.trim() ||
                             'Unknown Student';
              
              const email = apiStudent.email_fld || 
                          apiStudent.emailadd_fld || 
                          '';
              
              const studentId = apiStudent.studno_fld?.toString() || 
                              apiStudent.id_fld?.toString() || 
                              apiStudent.recno_fld?.toString() || '';

              // Skip if no ID or if it's the current user
              if (!studentId || studentId === user.id) return;

              // Determine role
              const isInstructor = email === instructor || 
                                fullName === instructor ||
                                (email.includes('@gordoncollege.edu.ph') && 
                                (apiStudent.role_fld === 'instructor' || apiStudent.empcode_fld));

              // Add if not already in set
              if (!contactIds.has(studentId)) {
                contactIds.add(studentId);
                allContacts.push({
                  id: studentId,
                  name: fullName.trim(),
                  email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
                  role: isInstructor ? 'instructor' : 'student',
                  classcode,
                  className,
                });
              }
            });

            // Add instructor if not already in list
            if (instructor) {
              // Generate instructor email (consistent format)
              const instructorEmail = instructor.includes('@') 
                ? instructor 
                : `${instructor.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`;
              
              // Use email as ID for instructors (for consistency with messaging)
              // Check if instructor already exists by email
              if (!contactIds.has(instructorEmail)) {
                contactIds.add(instructorEmail);
                allContacts.push({
                  id: instructorEmail, // Use email as ID for instructors
                  name: instructor,
                  email: instructorEmail,
                  role: 'instructor',
                  classcode,
                  className,
                });
              }
            }
          }
        } catch (err: any) {
          // Continue with other classes if one fails
          console.warn(`Failed to fetch students for class ${classcode}:`, err);
        }
      }

      // Sort contacts: instructors first, then by name
      allContacts.sort((a, b) => {
        if (a.role === 'instructor' && b.role !== 'instructor') return -1;
        if (a.role !== 'instructor' && b.role === 'instructor') return 1;
        return a.name.localeCompare(b.name);
      });

      setContacts(allContacts);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(getErrorMessage(err) || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when screen comes into focus
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  );

  // Handle contact selection
  const handleContactClick = (contact: Contact) => {
    // For instructors, use email as ID (since they don't have a consistent ID in the system)
    // For students, use their student number (id)
    const otherUserId = contact.role === 'instructor' 
      ? contact.email // Use email for instructors
      : contact.id;   // Use student ID for students

    router.push({
      pathname: '/components/chat-detail' as any,
      params: {
        otherUserId: otherUserId,
        name: contact.name,
        role: contact.role,
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 px-6">
        {/* Header with Back Button */}
        <View className="flex-row items-center py-4 border-b border-crystalBell">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 active:opacity-80"
          >
            <CaretLeft size={24} color="#191815" weight="regular" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-twilightZone text-xl font-bold">New Message</Text>
            <Text className="text-millionGrey text-sm mt-1">Select a contact to start a conversation</Text>
          </View>
        </View>

        {/* Search bar */}
        <View className="my-4 rounded-full" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, backgroundColor: isFocused ? "#FFFFFF" : "#F9F9F9", borderWidth: 1, borderColor: isFocused ? "#EFEFEF" : "transparent", }} >
          <MagnifyingGlass size={20} color={isFocused ? "#191815" : "#999999"} weight="regular" style={{ marginRight: 10 }} />
          <TextInput 
            value={search} 
            onChangeText={setSearch} 
            placeholder="Search contacts..." 
            placeholderTextColor={isFocused ? "#191815" : "#999999"} 
            className="flex-1 font-base" 
            style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false, color: "#191815", }} 
            onFocus={() => setIsFocused(true)} 
            onBlur={() => setIsFocused(false)} 
          />
        </View>

        {/* Contacts list */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4285F4" />
            <Text className="text-millionGrey mt-4">Loading contacts...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-red-600 text-base text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetchContacts}
              className="bg-seljukBlue px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : filteredContacts.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredContacts.map((contact) => (
              <Pressable
                key={`${contact.id}-${contact.classcode}`}
                className="flex-row items-center py-4 border-b border-crystalBell active:opacity-80"
                onPress={() => handleContactClick(contact)}
              >
                {/* Avatar with initials */}
                <View className="w-12 h-12 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center mr-4">
                  <Text className="text-metalDeluxe font-bold text-base">
                    {getInitials(contact.name)}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-twilightZone font-semibold text-base">
                      {contact.role === 'student' ? toNormalCase(contact.name) : contact.name}
                    </Text>
                    {contact.role === 'instructor' && (
                      <View className="ml-2 bg-seljukBlue/10 px-2 py-0.5 rounded">
                        <Text className="text-seljukBlue text-xs font-semibold">Instructor</Text>
                      </View>
                    )}
                  </View>
                  {contact.className && (
                    <Text className="text-millionGrey text-sm mt-0.5">
                      {contact.className}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-millionGrey text-base">
              {search ? 'No contacts found.' : 'No contacts available.'}
            </Text>
            {search && (
              <Text className="text-millionGrey text-sm mt-2">Try a different search term</Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

