import { View, Text, ScrollView } from "react-native";

type Event = { timeStart: string; timeEnd: string; room: string; course?: string; borderColor?: string; };

type DaySchedule = { day: string; events: Event[]; };

const scheduleData: DaySchedule[] = [
  { day: "Monday",
    events: [
      { timeStart: "5:00 PM", timeEnd: "6:00 PM", room: "GC Main 505", course: "CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning", borderColor: "border-starfleetBlue", },
      { timeStart: "6:00 PM", timeEnd: "9:00 PM", room: "GC Main 508", course: "CS Thesis Writing 2 (LAB)", borderColor: "border-princetonOrange", },
    ],
  },
  { day: "Tuesday",
    events: [
      { timeStart: "4:00 PM", timeEnd: "5:00 PM", room: "GC Main 508", course: "CS Thesis Writing 2 (LEC)", borderColor: "border-princetonOrange", },
      { timeStart: "5:00 PM", timeEnd: "6:00 PM", room: "GC Main 505", course: "CS Elective 7 (LEC) - Artificial Intelligence & Machine Learning", borderColor: "border-starfleetBlue", },
      { timeStart: "6:00 PM", timeEnd: "9:00 PM", room: "GC Main 508", course: "CS Thesis Writing 2 (LAB)", borderColor: "border-princetonOrange", },
    ],
  },
  {
    day: "Thursday",
    events: [
      { timeStart: "4:00 PM", timeEnd: "6:00 PM", room: "GC Main 411", course: "CS Elective 6 (LEC) - AR/VR Systems", borderColor: "border-thickPink", },
    ],
  },
  {
    day: "Friday",
    events: [
      { timeStart: "9:00 AM", timeEnd: "12:00 PM", room: "GC Main 507", course: "CS Elective 6 (LAB) - AR/VR Systems", borderColor: "border-thickPink", },
      { timeStart: "5:00 PM", timeEnd: "8:00 PM", room: "GC Main 508", course: "CS Seminars and Educational Trips", borderColor: "border-reddishPink", },
    ],
  },
  {
    day: "Saturday",
    events: [
      { timeStart: "7:00 AM", timeEnd: "10:00 AM", room: "GC Main 519", course: "CS Elective 7 (LAB) - Artificial Intelligence & Machine Learning", borderColor: "border-starfleetBlue", },
    ],
  },
];

export default function Schedule() {
  return (
    <ScrollView className="flex-1 px-6 mb-2" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} >
      {scheduleData.map((day) => (
        <View key={day.day}>
          {/* day header */}
          <View className="flex-row items-center">
            <Text className="text-2xl text-twilightZone font-bold tracking-tighter mr-4">
              {day.day}
            </Text>
            <View className="flex-1 border-t border-dashed border-crystalBell" />
          </View>

          {/* class schedule */}
          <View className="flex flex-col gap-4 my-6">
            {day.events.map((event, idx) => (
              <View key={idx} className="flex-row">
                {/* time */}
                <View className={`w-20 border-r-2 ${event.borderColor}`}>
                  <Text className="text-twilightZone text-base font-medium">
                    {event.timeStart}
                  </Text>
                  <Text className="text-twilightZone text-base font-medium">
                    {event.timeEnd}
                  </Text>
                </View>

                {/* room & course */}
                <View className="flex-1 pl-4">
                  <Text className="text-millionGrey text-base flex-shrink">
                    {event.room}
                  </Text>
                  {event.course && (
                    <Text className="text-twilightZone text-base font-medium flex-shrink">
                      {event.course}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
