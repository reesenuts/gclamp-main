import { MagnifyingGlass } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { lampService } from "../../services";
import { getErrorMessage } from "../../utils/errorHandler";

type Student = {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
};

type ClassStudentsProps = {
  instructor: string;
  classcode?: string; // Optional - will be fetched if not provided
};

export default function ClassStudents({ instructor, classcode }: ClassStudentsProps) {
  // search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualClasscode, setActualClasscode] = useState<string | null>(classcode || null);
  const [members, setMembers] = useState<Student[]>([]);

  // Transform API student to Student type
  const transformStudent = (apiStudent: any): Student => {
    // Format name: handle uppercase names like "AGUILAR, ZALDY"
    // Try multiple possible field names
    const fullName = apiStudent.fullname_fld || 
                     apiStudent.name_fld || 
                     apiStudent.studentname_fld ||
                     `${apiStudent.fname_fld || ''} ${apiStudent.mname_fld || ''} ${apiStudent.lname_fld || ''}`.trim() ||
                     'Unknown Student';
    const email = apiStudent.email_fld || 
                  apiStudent.emailadd_fld || 
                  apiStudent.email_fld ||
                  '';
    
    // Determine if this is the instructor (check email or name match)
    const isInstructor = email === instructor || 
                        fullName === instructor ||
                        (email.includes('@gordoncollege.edu.ph') && 
                        (apiStudent.role_fld === 'instructor' || apiStudent.empcode_fld));

    return {
      id: apiStudent.studno_fld?.toString() || apiStudent.id_fld?.toString() || apiStudent.recno_fld?.toString() || '',
      name: fullName.trim() || 'Unknown Student',
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
      role: isInstructor ? 'instructor' : 'student',
    };
  };

  // Fetch students from API
  const fetchStudents = async () => {
    if (!actualClasscode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await lampService.getStudentsInClass({
        p_classcode: actualClasscode,
      });

      if (response.status.rem === 'success' && response.data) {
        const apiStudents = Array.isArray(response.data) ? response.data : [];
        
        // Debug: Log first student to see structure
        if (__DEV__ && apiStudents.length > 0) {
          console.log('Sample student data:', apiStudents[0]);
        }
        
        // Transform students
        const transformedStudents = apiStudents.map(transformStudent);
        
        // Debug: Log transformed students
        if (__DEV__ && transformedStudents.length > 0) {
          console.log('Sample transformed student:', transformedStudents[0]);
        }
        
        // Add instructor if not already in the list
        const hasInstructor = transformedStudents.some(s => s.role === 'instructor');
        if (!hasInstructor && instructor) {
          transformedStudents.unshift({
            id: 'instructor-0',
      name: instructor,
      email: `${instructor.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
      role: 'instructor',
          });
        }
        
        setMembers(transformedStudents);
      } else if (response.status.msg?.includes('No Records') || 
                 response.status.msg?.includes('no records')) {
        // No students - add instructor only
        if (instructor) {
          setMembers([{
            id: 'instructor-0',
            name: instructor,
            email: `${instructor.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
            role: 'instructor',
          }]);
        } else {
          setMembers([]);
        }
      } else {
        setError(response.status.msg || 'Failed to load students');
      }
    } catch (err: any) {
      // Handle "no records" error gracefully
      const errorMsg = err?.message || err?.data?.message || '';
      if (errorMsg.includes('No Records') || errorMsg.includes('no records') || err?.status === 404) {
        // No students - add instructor only
        if (instructor) {
          setMembers([{
            id: 'instructor-0',
            name: instructor,
            email: `${instructor.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
            role: 'instructor',
          }]);
        } else {
          setMembers([]);
        }
      } else {
        console.error('Error fetching students:', err);
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch classcode if not provided
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

  // Fetch students when classcode is available
  useEffect(() => {
    if (actualClasscode) {
      fetchStudents();
    }
  }, [actualClasscode, instructor]);


  // filter members by search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // separate instructors and students
  const instructors = filteredMembers.filter(m => m.role === 'instructor');
  const students = filteredMembers.filter(m => m.role === 'student');

  // get initials from name - handles formats like "LASTNAME, FIRSTNAME" or "FIRSTNAME LASTNAME"
  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return 'U';
    
    // Remove extra spaces and trim
    const cleanName = name.trim().replace(/\s+/g, ' ');
    
    // Check if name contains comma (format: "LASTNAME, FIRSTNAME")
    if (cleanName.includes(',')) {
      const parts = cleanName.split(',').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length === 0) return 'U';
      if (parts.length === 1) {
        // Only last name, get first two letters
        const lastname = parts[0];
        return lastname.substring(0, 2).toUpperCase();
      }
      // Get first letter of last name and first letter of first name
      const lastInitial = parts[0].charAt(0).toUpperCase();
      const firstInitial = parts[1].split(' ')[0].charAt(0).toUpperCase();
      return (lastInitial + firstInitial).slice(0, 2);
    }
    
    // Regular format: "FIRSTNAME LASTNAME" or multiple words
    const words = cleanName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) {
      // Single word, get first two letters
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Get first letter of first word and first letter of last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    return (firstInitial + lastInitial).slice(0, 2);
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

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4285F4" />
        <Text className="text-millionGrey mt-4">Loading students...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-red-600 text-base text-center mb-4">{error}</Text>
        <Pressable
          onPress={fetchStudents}
          className="bg-metalDeluxe rounded-full px-6 py-3"
        >
          <Text className="text-white text-base">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* fixed search bar */}
      <View className="px-6 pt-6 pb-4 bg-slate-50">
        <View className="rounded-full" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, backgroundColor: isFocused ? "#FFFFFF" : "#F9F9F9", borderWidth: 1, borderColor: isFocused ? "#EFEFEF" : "transparent", }} >
          <MagnifyingGlass size={20} color={isFocused ? "#191815" : "#999999"} weight="regular" style={{ marginRight: 10 }} />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search members" placeholderTextColor={isFocused ? "#191815" : "#999999"} className="flex-1 font-base" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false, color: "#191815", }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
        </View>
      </View>

      {/* scrollable content */}
      <ScrollView className="flex-1 mb-2" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* summary card */}
          <View className="bg-white rounded-2xl border border-crystalBell p-4 mb-6">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-twilightZone text-3xl font-bold">
                  {instructors.length}
                </Text>
                <Text className="text-millionGrey text-sm">Instructor{instructors.length !== 1 ? 's' : ''}</Text>
              </View>
              <View className="w-px bg-crystalBell" />
              <View className="items-center">
                <Text className="text-twilightZone text-3xl font-bold">
                  {students.length}
                </Text>
                <Text className="text-millionGrey text-sm">Students</Text>
              </View>
            </View>
          </View>

          {/* instructors list */}
          {instructors.length > 0 && (
            <View className="mb-4">
              <Text className="text-millionGrey text-sm font-semibold mb-3">
                INSTRUCTOR{instructors.length !== 1 ? 'S' : ''} ({instructors.length})
              </Text>
              {instructors.map((member) => (
                <View key={member.id} className="bg-white rounded-2xl border border-crystalBell p-4 mb-3" >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center mr-3">
                      <Text className="text-metalDeluxe font-bold text-lg">
                        {getInitials(member.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-twilightZone font-semibold text-base">
                          {toNormalCase(member.name)}
                        </Text>
                        <View className="ml-2 bg-starfleetBlue/10 px-2 py-0.5 rounded">
                          <Text className="text-starfleetBlue text-xs font-medium">
                            Instructor
                          </Text>
                        </View>
                      </View>
                      <Text className="text-millionGrey text-sm">
                        {member.email}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* students list */}
          {students.length > 0 && (
            <View>
              <Text className="text-millionGrey text-sm font-semibold mb-3">
                STUDENTS ({students.length})
              </Text>
              {students.map((member) => (
                <View key={member.id} className="bg-white rounded-2xl border border-crystalBell p-4 mb-3" >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center mr-3">
                      <Text className="text-metalDeluxe font-bold">
                        {getInitials(member.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-twilightZone font-semibold text-base">
                        {toNormalCase(member.name)}
                      </Text>
                      <Text className="text-millionGrey text-sm">
                        {member.email}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* no results message */}
          {filteredMembers.length === 0 && (
            <View className="items-center justify-center py-10">
              <Text className="text-millionGrey text-base">
                No members found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

