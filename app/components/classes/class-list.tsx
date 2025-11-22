import { MagnifyingGlass } from "phosphor-react-native";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

type Student = {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
};

type ClassStudentsProps = {
  instructor: string;
};

export default function ClassStudents({ instructor }: ClassStudentsProps) {
  // search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // members data
  const [members] = useState<Student[]>([
    {
      id: '0',
      name: instructor,
      email: `${instructor.toLowerCase().replace(/\s+/g, '.')}@gordoncollege.edu.ph`,
      role: 'instructor',
    },
    {
      id: '1',
      name: 'AGUILAR, ZALDY',
      email: '202210583@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '2',
      name: 'ALBERTO, SEAN RAD',
      email: '202210012@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '3',
      name: 'APO, EUNILLE JAN',
      email: '202210094@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '4',
      name: 'AQUINO, ROBINX PRHYNZ',
      email: '202210599@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '5',
      name: 'BANLUTA, CHRISTIAN DAVE',
      email: '202210819@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '6',
      name: 'BARGO, ANTHONY JAMES',
      email: '202211002@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '7',
      name: 'BELEN, KENT HAROLD',
      email: '202211399@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '8',
      name: 'BENEDICTO, BERNARD ADRIANNE',
      email: '202210867@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '9',
      name: 'CARDO, JOHN EDWARD',
      email: '202211834@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '10',
      name: 'DEDICATORIA, JOHN ERIC',
      email: '202211048@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '11',
      name: 'ECLARINAL, GODFREY',
      email: '202211110@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '12',
      name: 'FERREOL, ASHLEY KIER',
      email: '202210473@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '13',
      name: 'FLORES, KAYE',
      email: '202211167@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '14',
      name: 'ISIP, JOHN LYNARD',
      email: '202211263@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '15',
      name: 'LANDERO, CHRISTIAN JAY',
      email: '202210274@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '16',
      name: 'MARCELINO, JONASH',
      email: '202211368@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '17',
      name: 'MERCADO, MARCUS ADRIANNE',
      email: '202211395@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '18',
      name: 'MOLINO, DOMINIC',
      email: '202210298@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '19',
      name: 'NABOR, NEIL CARLO',
      email: '202210600@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '20',
      name: 'PAJARO, ROESCEN ABIE',
      email: '202211504@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '21',
      name: 'PARANTAR, LEE PARKER',
      email: '202211523@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '22',
      name: 'RESURRECCION, DEIANNE JEINNE',
      email: '202210471@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '23',
      name: 'URETA, ERLEIN NICOLE',
      email: '202210420@gordoncollege.edu.ph',
      role: 'student',
    },
    {
      id: '24',
      name: 'VIACRUSIS, CHRIS KIRK PATRICK',
      email: '202210139@gordoncollege.edu.ph',
      role: 'student',
    },
  ]);

  // filter members by search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // separate instructors and students
  const instructors = filteredMembers.filter(m => m.role === 'instructor');
  const students = filteredMembers.filter(m => m.role === 'student');

  // get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
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

