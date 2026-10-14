import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Language, AcademicEvent } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';

interface EventsScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [selectedDay, setSelectedDay] = useState<number>(5); // Default to 5 per screenshot
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    const data = await apiService.getEvents();
    setEvents(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Events', traineeName);
    loadEvents();

    return () => {
      screenTimeTracker.onScreenLeave('Events', traineeName);
    };
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  // March 2024 calendar: March 1 is Friday (index 5)
  // Days in March: 31
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOffset = 5; // Friday
  const totalDays = 31;

  const calendarGrid = [];
  // Empty slots before day 1
  for (let i = 0; i < firstDayOffset; i++) {
    calendarGrid.push(null);
  }
  // Days 1 to 31
  for (let d = 1; d <= totalDays; d++) {
    calendarGrid.push(d);
  }

  // Find event for selected day
  const formattedSelectedDate = `2024-03-${selectedDay.toString().padStart(2, '0')}`;
  const dayEvents = events.filter((e) => e.date === formattedSelectedDate);

  const getDayName = (day: number) => {
    const date = new Date(2024, 2, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <View style={styles.container}>
      <Header
        title={t.calendar}
        subtitle={traineeName}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0288D1"]} />}
        >
          {/* Month Header with navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.monthNavBtn}>
              <MaterialIcons name="chevron-left" size={26} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>March 2024</Text>
            <TouchableOpacity style={styles.monthNavBtn}>
              <MaterialIcons name="chevron-right" size={26} color="#333333" />
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {daysOfWeek.map((dow, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>{dow}</Text>
            ))}
          </View>

          {/* Calendar Month Grid */}
          <View style={styles.calendarGrid}>
            {calendarGrid.map((day, idx) => {
              if (day === null) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }
              const isSelected = day === selectedDay;
              const hasEvent = events.some(e => e.date === `2024-03-${day.toString().padStart(2, '0')}`);
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.dayCell}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </View>
                  {hasEvent && !isSelected && <View style={styles.eventDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Selected Date Event Cards matching screenshot */}
          <View style={styles.eventSection}>
            <Text style={styles.selectedDayHeader}>
              {getDayName(selectedDay)}{'\n'}{selectedDay.toString().padStart(2, '0')}-March
            </Text>

            {dayEvents.length === 0 ? (
              <View style={styles.noEventsBox}>
                <Ionicons name="calendar-outline" size={32} color="#B0BEC5" />
                <Text style={styles.noEventsText}>{t.noEventsForDay}</Text>
              </View>
            ) : (
              dayEvents.map((evt) => (
                <View key={evt.id} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <View style={styles.eventMetaRow}>
                    <Text style={styles.eventType}>{evt.type}</Text>
                    <Text style={styles.eventTime}>{evt.time}</Text>
                  </View>
                  <View style={styles.eventLocRow}>
                    <MaterialIcons name="location-on" size={14} color="#78909C" />
                    <Text style={styles.eventLocText}>{evt.location}</Text>
                  </View>
                  <Text style={styles.eventDesc}>{evt.description}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 44,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#E65100', // orange ring matching screenshot p18_img0_Image107.jpg
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  dayTextSelected: {
    fontWeight: '800',
    color: '#000000',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0288D1',
    position: 'absolute',
    bottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  eventSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  selectedDayHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 12,
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '700',
  },
  eventLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventLocText: {
    fontSize: 12,
    color: '#546E7A',
    marginLeft: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
    marginTop: 4,
  },
  noEventsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  noEventsText: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 8,
  },
});
