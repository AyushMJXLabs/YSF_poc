import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons';
import { ScreenName, Language, AttendanceRecord } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { apiService } from '../services/api';

interface DashboardScreenProps {
  language: Language;
  onNavigate: (screen: ScreenName) => void;
  onOpenDrawer: () => void;
  onLogout: () => void;
  traineeName: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  language,
  onNavigate,
  onOpenDrawer,
  onLogout,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Dashboard', traineeName);

    const loadAttendance = async () => {
      const rec = await apiService.getAttendance('W2307C00001');
      setAttendance(rec);
    };
    loadAttendance();

    return () => {
      screenTimeTracker.onScreenLeave('Dashboard', traineeName);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await apiService.sync();
    const rec = await apiService.getAttendance('W2307C00001');
    setAttendance(rec);
    setSyncing(false);
    Alert.alert("Sync Successful", "Telemetry, attendance records, and questions are in sync with Central LMS Control Center.");
  };

  const handleModuleClick = (screen: ScreenName) => {
    onNavigate(screen);
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      t.logout,
      t.confirmLogout,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.logout, style: 'destructive', onPress: onLogout }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Header
        title={t.companyName}
        subtitle={traineeName}
        showBack={false}
        showMenu={true}
        onMenu={onOpenDrawer}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Sync Telemetry & OJT Hours Progress Card */}
        <View style={styles.ojtCard}>
          <View style={styles.ojtTopRow}>
            <View style={styles.syncBadge}>
              <View style={styles.syncDot} />
              <Text style={styles.syncBadgeText}>Live Sync Active &bull; Code: 21092</Text>
            </View>
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleManualSync}
              disabled={syncing}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="cloud-sync"
                size={16}
                color={syncing ? '#9E9E9E' : '#0288D1'}
              />
              <Text style={styles.syncBtnText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ojtStatsRow}>
            <View style={styles.ojtStatCol}>
              <Text style={styles.ojtStatLabel}>OJT Attendance</Text>
              <Text style={styles.ojtStatValue}>
                {attendance?.percentage !== undefined ? `${attendance.percentage}%` : '96.0%'}
              </Text>
              <Text style={styles.ojtStatSub}>
                {attendance ? `${attendance.presentDays} Present / ${attendance.absentDays} Absent` : '24 Present / 1 Absent'}
              </Text>
            </View>
            <View style={styles.ojtDivider} />
            <View style={styles.ojtStatCol}>
              <Text style={styles.ojtStatLabel}>Training Hours</Text>
              <Text style={styles.ojtStatValue}>
                {attendance ? `${attendance.completedHours}h` : '172h'}
                <Text style={styles.ojtTargetText}> / {attendance ? `${attendance.targetHours}h` : '180h'}</Text>
              </Text>
              <Text style={styles.ojtStatSub}>Target for NSQF Level 4</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${attendance ? Math.min(100, Math.round((attendance.completedHours / attendance.targetHours) * 100)) : 95.5}%`
                }
              ]}
            />
          </View>
        </View>

        {/* 9-Grid Module Layout matching screenshot p9_img0_Image59.jpg */}
        <View style={styles.gridContainer}>
          {/* 1. Learning Resource */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('LEARNING_RESOURCES')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeResource]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={42} color="#D32F2F" />
            </View>
            <Text style={styles.gridLabel}>{t.learningResource}</Text>
          </TouchableOpacity>

          {/* 2. Assignment */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('ASSIGNMENTS')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeAssignment]}>
              <FontAwesome5 name="pencil-alt" size={32} color="#ffffff" />
            </View>
            <Text style={styles.gridLabel}>{t.assignment}</Text>
          </TouchableOpacity>

          {/* 3. Test Module */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('TEST_MODULE')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeTest]}>
              <MaterialIcons name="assignment" size={40} color="#0288D1" />
              <FontAwesome5 name="stopwatch" size={16} color="#D32F2F" style={styles.subBadgeIcon} />
            </View>
            <Text style={styles.gridLabel}>{t.testModule}</Text>
          </TouchableOpacity>

          {/* 4. Events */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('EVENTS')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeEvents]}>
              <FontAwesome5 name="calendar-alt" size={36} color="#F57C00" />
            </View>
            <Text style={styles.gridLabel}>{t.events}</Text>
          </TouchableOpacity>

          {/* 5. Notice */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('NOTICES')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeNotice]}>
              <Ionicons name="notifications" size={38} color="#ffffff" />
            </View>
            <Text style={styles.gridLabel}>{t.notice}</Text>
          </TouchableOpacity>

          {/* 6. Profile */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('PROFILE')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeProfile]}>
              <FontAwesome5 name="user-graduate" size={36} color="#37474F" />
            </View>
            <Text style={styles.gridLabel}>{t.profile}</Text>
          </TouchableOpacity>

          {/* 7. Technical Query */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('TECHNICAL_QUERY')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeSupport]}>
              <MaterialIcons name="headset-mic" size={40} color="#0288D1" />
              <Text style={styles.supportMiniText}>SUPPORT</Text>
            </View>
            <Text style={styles.gridLabel}>{t.technicalQuery}</Text>
          </TouchableOpacity>

          {/* 8. Change Password */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => handleModuleClick('CHANGE_PASSWORD')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgePassword]}>
              <Ionicons name="key" size={36} color="#F57F17" />
            </View>
            <Text style={styles.gridLabel}>{t.changePassword}</Text>
          </TouchableOpacity>

          {/* 9. Logout */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={handleLogoutConfirm}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, styles.badgeLogout]}>
              <MaterialIcons name="power-settings-new" size={42} color="#D32F2F" />
            </View>
            <Text style={styles.gridLabel}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridCell: {
    width: '32%',
    aspectRatio: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  iconBadge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeResource: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  badgeAssignment: {
    backgroundColor: '#7CB342', // vivid green from screenshot
  },
  badgeTest: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1.5,
    borderColor: '#FFE082',
  },
  subBadgeIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  badgeEvents: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  badgeNotice: {
    backgroundColor: '#EF5350', // vivid coral red from screenshot
  },
  badgeProfile: {
    backgroundColor: '#CFD8DC',
    borderWidth: 2,
    borderColor: '#90A4AE',
  },
  badgeSupport: {
    backgroundColor: '#ECEFF1',
    borderWidth: 2,
    borderColor: '#B0BEC5',
  },
  supportMiniText: {
    position: 'absolute',
    bottom: 4,
    fontSize: 7.5,
    fontWeight: '800',
    color: '#0277BD',
  },
  badgePassword: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#FDD835',
  },
  badgeLogout: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  gridLabel: {
    fontSize: 12,
    color: '#37474F',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  // OJT & Live Sync Card Styles
  ojtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ojtTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  syncBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0288D1',
    marginLeft: 4,
  },
  ojtStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ojtStatCol: {
    flex: 1,
  },
  ojtDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  ojtStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ojtStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  ojtTargetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  ojtStatSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});
