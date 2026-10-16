import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ScreenName, Language, AttendanceRecord, Assignment, TestItem } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { apiService } from '../services/api';
import { colors, radius, shadow, Card, Pill, SectionHeader } from '../theme';

interface DashboardScreenProps {
  language: Language;
  onNavigate: (screen: ScreenName) => void;
  onOpenDrawer: () => void;
  onLogout: () => void;
  traineeName: string;
  ysfCode?: string;
  avatarUrl?: string;
}

type ModuleDef = { screen: ScreenName | 'LOGOUT'; label: string; icon: string; lib: 'mci' | 'mi' | 'ion'; tint: string; bg: string };

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  language,
  onNavigate,
  onOpenDrawer,
  onLogout,
  traineeName,
  ysfCode,
  avatarUrl,
}) => {
  const t = getTranslation(language);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [noticeCount, setNoticeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [rec, asg, tst, notices] = await Promise.all([
      apiService.getAttendance(),
      apiService.getAssignments(),
      apiService.getTests(),
      apiService.getNotices(),
    ]);
    setAttendance(rec);
    setAssignments(asg);
    setTests(tst.tests || []);
    setNoticeCount(notices.length);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Dashboard', traineeName);
    load();
    return () => {
      screenTimeTracker.onScreenLeave('Dashboard', traineeName);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await apiService.sync();
    await load();
    setRefreshing(false);
  };

  const handleLogoutConfirm = () => {
    Alert.alert(t.logout, t.confirmLogout, [
      { text: t.cancel, style: 'cancel' },
      { text: t.logout, style: 'destructive', onPress: onLogout },
    ]);
  };

  const pct = attendance?.percentage ?? 0;
  const hoursDone = attendance?.completedHours ?? 0;
  const hoursTarget = attendance?.targetHours || 1;
  const hoursPct = Math.min(100, Math.round((hoursDone / hoursTarget) * 100));
  const hoursLeft = Math.max(0, hoursTarget - hoursDone);

  // "Up next": open assignments first, then unsolved tests
  const openAssignments = assignments.filter(a => a.status === 'Pending' || a.status === 'Overdue' || a.status === 'Needs Revision');
  const openTests = tests.filter(x => x.status !== 'Solved');
  const totalItems = assignments.length + tests.length;
  const doneItems = totalItems - openAssignments.length - openTests.length;
  const upNext = [
    ...openAssignments.map(a => ({
      key: a.id,
      title: a.name,
      caption: a.deadlineLabel ? `${t.dueOn} ${a.deadlineLabel}` : a.course,
      icon: 'file-document-edit-outline',
      screen: 'ASSIGNMENTS' as ScreenName,
      pill: a.status === 'Overdue' ? { label: t.statusOverdue, tone: 'red' as const } : a.status === 'Needs Revision' ? { label: t.statusRevise, tone: 'amber' as const } : { label: t.statusDue, tone: 'amber' as const },
    })),
    ...openTests.map(x => ({
      key: x.id,
      title: x.name,
      caption: `${x.duration} ${t.minutesShort} · ${x.totalMarks} ${t.marksShort}`,
      icon: 'clipboard-text-clock-outline',
      screen: 'TEST_MODULE' as ScreenName,
      pill: { label: t.statusQueue, tone: 'teal' as const },
    })),
  ].slice(0, 4);

  const modules: ModuleDef[] = [
    { screen: 'LEARNING_RESOURCES', label: t.learningResource, icon: 'book-open-page-variant-outline', lib: 'mci', tint: colors.violet, bg: colors.violetSoft },
    { screen: 'ASSIGNMENTS', label: t.assignment, icon: 'file-document-edit-outline', lib: 'mci', tint: colors.blue, bg: colors.blueSoft },
    { screen: 'TEST_MODULE', label: t.testModule, icon: 'clipboard-check-outline', lib: 'mci', tint: colors.teal, bg: colors.tealSoft },
    { screen: 'EVENTS', label: t.events, icon: 'calendar-month-outline', lib: 'mci', tint: colors.amber, bg: colors.amberSoft },
    { screen: 'NOTICES', label: t.notice, icon: 'bell-outline', lib: 'mci', tint: colors.red, bg: colors.redSoft },
    { screen: 'PROFILE', label: t.profile, icon: 'account-circle-outline', lib: 'mci', tint: colors.navy, bg: colors.surfaceMuted },
    { screen: 'TECHNICAL_QUERY', label: t.technicalQuery, icon: 'headset', lib: 'mci', tint: colors.teal, bg: colors.tealSoft },
    { screen: 'CHANGE_PASSWORD', label: t.changePassword, icon: 'key-outline', lib: 'mci', tint: colors.amber, bg: colors.amberSoft },
    { screen: 'LOGOUT', label: t.logout, icon: 'power', lib: 'mci', tint: colors.red, bg: colors.redSoft },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Yuvashakti"
        subtitle={t.portalSubtitle}
        showBack={false}
        showMenu={true}
        onMenu={onOpenDrawer}
        avatarName={traineeName}
        avatarUrl={avatarUrl}
        onAvatarPress={() => onNavigate('PROFILE')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} tintColor={colors.teal} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — OJT attendance */}
        <Card dark style={styles.hero}>
          <View style={styles.heroTop}>
            <Pill label={t.activeTrainee} tone="navy" dot />
            <Text style={styles.heroId}>{ysfCode ? `ID ${ysfCode}` : ''}</Text>
          </View>
          <Text style={styles.heroLabel}>{t.ojtAttendance}</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{attendance ? pct.toFixed(1) : '—'}</Text>
            <Text style={styles.heroUnit}>%</Text>
          </View>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${Math.min(100, pct)}%` }]} />
          </View>
        </Card>

        {/* Attendance summary */}
        <Card style={styles.block}>
          <SectionHeader
            title={t.attendanceSummary}
            right={
              <TouchableOpacity style={styles.syncChip} onPress={onRefresh} activeOpacity={0.7}>
                <MaterialCommunityIcons name="cloud-sync-outline" size={14} color={colors.teal} />
                <Text style={styles.syncChipText}>{refreshing ? t.syncing : t.syncNow}</Text>
              </TouchableOpacity>
            }
          />
          <View style={styles.dayRow}>
            <View style={styles.dayTile}>
              <Text style={styles.dayTileLabel}>{t.presentDays}</Text>
              <Text style={styles.dayTileValue}>{attendance?.presentDays ?? '—'}</Text>
              <View style={[styles.dayBadge, { backgroundColor: colors.green }]}>
                <MaterialIcons name="check" size={14} color="#fff" />
              </View>
            </View>
            <View style={[styles.dayTile, styles.dayTileAbsent]}>
              <Text style={[styles.dayTileLabel, { color: colors.red }]}>{t.absentDays}</Text>
              <Text style={styles.dayTileValue}>{attendance?.absentDays ?? '—'}</Text>
              <View style={[styles.dayBadge, { backgroundColor: colors.red }]}>
                <MaterialIcons name="close" size={14} color="#fff" />
              </View>
            </View>
          </View>

          <View style={styles.loggedBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.micro}>{t.totalLogged}</Text>
              <Text style={styles.loggedValue}>
                {hoursDone}h<Text style={styles.loggedTarget}> / {attendance?.targetHours ?? '—'}h</Text>
              </Text>
              <View style={styles.loggedMetaRow}>
                <Pill label={`${hoursLeft}h ${t.remaining}`} tone="teal" textStyle={styles.pillLower} />
                <Text style={styles.loggedMeta}> · {hoursPct}% {t.ofTarget}</Text>
              </View>
            </View>
            <View style={styles.loggedIcon}>
              <MaterialCommunityIcons name="progress-check" size={22} color={colors.ink} />
            </View>
          </View>
        </Card>

        {/* Modules */}
        <Card style={styles.block}>
          <SectionHeader title={t.modules} />
          <View style={styles.grid}>
            {modules.map(m => (
              <TouchableOpacity
                key={m.screen}
                style={styles.gridCell}
                activeOpacity={0.75}
                onPress={() => (m.screen === 'LOGOUT' ? handleLogoutConfirm() : onNavigate(m.screen))}
              >
                <View style={[styles.gridIcon, { backgroundColor: m.bg }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={24} color={m.tint} />
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Up next — pending assignments & tests */}
        <Card style={styles.block}>
          <SectionHeader
            title={t.upNext}
            right={totalItems > 0 ? <Text style={styles.doneCount}>{`${doneItems} ${t.ofWord} ${totalItems} ${t.doneWord}`.toUpperCase()}</Text> : undefined}
          />
          {upNext.length === 0 ? (
            <View style={styles.row}>
              <View style={styles.rowIcon}><MaterialCommunityIcons name="party-popper" size={18} color={colors.teal} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t.allCaughtUp}</Text>
                <Text style={styles.rowCaption}>{t.allCaughtUpSub}</Text>
              </View>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.green} />
            </View>
          ) : (
            upNext.map(item => (
              <TouchableOpacity key={item.key} style={styles.row} activeOpacity={0.75} onPress={() => onNavigate(item.screen)}>
                <View style={styles.rowIcon}><MaterialCommunityIcons name={item.icon as any} size={18} color={colors.teal} /></View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowCaption} numberOfLines={1}>{item.caption}</Text>
                </View>
                <Pill label={item.pill.label} tone={item.pill.tone} />
              </TouchableOpacity>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Floating actions, as in the reference: notices (left) and support (right) */}
      <TouchableOpacity style={[styles.fab, styles.fabLeft]} onPress={() => onNavigate('NOTICES')} activeOpacity={0.85}>
        <Ionicons name="notifications-outline" size={22} color="#fff" />
        {noticeCount > 0 ? (
          <View style={styles.fabBadge}><Text style={styles.fabBadgeText}>{noticeCount > 9 ? '9+' : noticeCount}</Text></View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, styles.fabRight]} onPress={() => onNavigate('TECHNICAL_QUERY')} activeOpacity={0.85}>
        <MaterialCommunityIcons name="headset" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 100 },
  block: { marginTop: 14 },
  micro: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.muted },

  hero: { paddingVertical: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroId: { color: colors.navyMuted, fontSize: 12, fontWeight: '600' },
  heroLabel: { marginTop: 18, color: colors.navyMuted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  heroUnit: { color: colors.cyan, fontSize: 18, fontWeight: '800', marginLeft: 3, marginBottom: 5 },
  heroTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 3, backgroundColor: colors.cyan },

  syncChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.tealSoft },
  syncChipText: { fontSize: 11, fontWeight: '800', color: colors.teal, letterSpacing: 0.4, textTransform: 'uppercase' },

  dayRow: { flexDirection: 'row', gap: 10 },
  dayTile: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.line,
  },
  dayTileAbsent: { backgroundColor: colors.redSoft, borderColor: '#F8D4D4' },
  dayTileLabel: { fontSize: 10.5, fontWeight: '800', color: colors.ink2, letterSpacing: 0.6, textTransform: 'uppercase' },
  dayTileValue: { fontSize: 22, fontWeight: '800', color: colors.ink, marginVertical: 6 },
  dayBadge: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  loggedBox: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 14,
    borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.line,
  },
  loggedValue: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 4 },
  loggedTarget: { fontSize: 13, fontWeight: '600', color: colors.muted },
  loggedMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  loggedMeta: { fontSize: 11.5, color: colors.muted },
  pillLower: { textTransform: 'none', letterSpacing: 0 },
  loggedIcon: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridCell: { width: '33.333%', paddingHorizontal: 5, alignItems: 'center', marginBottom: 14 },
  gridIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  gridLabel: { fontSize: 12, color: colors.ink2, fontWeight: '600', textAlign: 'center', lineHeight: 15 },

  doneCount: { fontSize: 11, fontWeight: '800', color: colors.teal, letterSpacing: 0.6 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted, marginBottom: 8,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rowCaption: { fontSize: 12, color: colors.muted, marginTop: 2 },

  fab: {
    position: 'absolute', bottom: 22, width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  fabLeft: { left: 18, backgroundColor: colors.navy },
  fabRight: { right: 18, backgroundColor: colors.teal },
  fabBadge: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  fabBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
});
