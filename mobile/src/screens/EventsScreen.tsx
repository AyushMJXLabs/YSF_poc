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
import { useHardwareBack } from '../hooks/useHardwareBack';
import { colors, radius, Card, Pill } from '../theme';

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

  // Android hardware back → previous screen instead of closing the app
  useHardwareBack(() => {
    onBack();
    return true;
  });

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
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} tintColor={colors.teal} />}
        >
          <Card style={styles.calendarCard}>
            {/* Month Header with navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity style={styles.monthNavBtn}>
                <MaterialIcons name="chevron-left" size={22} color={colors.ink} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.monthMicro}>Calendar</Text>
                <Text style={styles.monthTitle}>March 2024</Text>
              </View>
              <TouchableOpacity style={styles.monthNavBtn}>
                <MaterialIcons name="chevron-right" size={22} color={colors.ink} />
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
                    <View style={[styles.dayCircle, hasEvent && !isSelected && styles.dayCircleEvent, isSelected && styles.dayCircleSelected]}>
                      <Text style={[styles.dayText, hasEvent && !isSelected && styles.dayTextEvent, isSelected && styles.dayTextSelected]}>
                        {day}
                      </Text>
                    </View>
                    {hasEvent && !isSelected && <View style={styles.eventDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Selected Date Event Cards */}
          <View style={styles.eventSection}>
            <Text style={styles.selectedDayHeader}>
              {getDayName(selectedDay)}{'\n'}{selectedDay.toString().padStart(2, '0')}-March
            </Text>

            {dayEvents.length === 0 ? (
              <Card style={styles.noEventsBox}>
                <View style={styles.emptyIconTile}>
                  <Ionicons name="calendar-outline" size={22} color={colors.faint} />
                </View>
                <Text style={styles.noEventsText}>{t.noEventsForDay}</Text>
              </Card>
            ) : (
              dayEvents.map((evt) => (
                <Card key={evt.id} style={styles.eventCard}>
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventIconTile}>
                      <MaterialIcons name="event" size={18} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{evt.title}</Text>
                      <View style={styles.eventMetaRow}>
                        <Pill label={String(evt.type)} tone="teal" />
                        <Text style={styles.eventTime}>{evt.time}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.eventLocRow}>
                    <MaterialIcons name="location-on" size={14} color={colors.muted} />
                    <Text style={styles.eventLocText}>{evt.location}</Text>
                  </View>
                  <Text style={styles.eventDesc}>{evt.description}</Text>
                </Card>
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
    backgroundColor: colors.bg,
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthMicro: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.teal,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleEvent: {
    backgroundColor: colors.tealSoft,
  },
  dayCircleSelected: {
    backgroundColor: colors.teal,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink2,
  },
  dayTextEvent: {
    color: colors.teal,
    fontWeight: '700',
  },
  dayTextSelected: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
    position: 'absolute',
    bottom: 1,
  },
  eventSection: {
    paddingTop: 20,
  },
  selectedDayHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
    lineHeight: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12.5,
    color: colors.teal,
    fontWeight: '700',
  },
  eventLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventLocText: {
    fontSize: 12.5,
    color: colors.ink2,
    marginLeft: 6,
    flex: 1,
  },
  eventDesc: {
    fontSize: 13.5,
    color: colors.muted,
    lineHeight: 19,
    marginTop: 10,
  },
  noEventsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyIconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 10,
  },
});
