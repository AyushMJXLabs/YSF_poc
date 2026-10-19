import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Language, LearningSummaryRow, LearningChapter, LearningTopic } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { colors, radius, Card, Pill } from '../theme';

interface LearningResourcesScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

/** Where the trainee is in Course → Subject → Chapter → Topic */
type Path = { course?: string; subject?: string; chapter?: string };

type Counts = { total: number; viewed: number };

const FILE_STYLE: Record<LearningTopic['fileType'], { icon: string; fg: string; bg: string }> = {
  PDF: { icon: 'file-pdf-box', fg: colors.red, bg: colors.redSoft },
  PPT: { icon: 'file-powerpoint-box', fg: colors.amber, bg: colors.amberSoft },
  VIDEO: { icon: 'play-circle-outline', fg: colors.violet, bg: colors.violetSoft },
};

const countTopics = (chapters: LearningChapter[]): Counts =>
  chapters.reduce(
    (acc, c) => {
      acc.total += c.topics.length;
      acc.viewed += c.topics.filter(tp => tp.readStatus).length;
      return acc;
    },
    { total: 0, viewed: 0 }
  );

const pct = (c: Counts) => (c.total > 0 ? Math.round((c.viewed / c.total) * 100) : 0);

const unique = (list: string[]) => Array.from(new Set(list.filter(Boolean)));

export const LearningResourcesScreen: React.FC<LearningResourcesScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  // "1 topic" / "2 topics" (English labels are plural; Marathi ones need no change)
  const countLabel = (n: number, label: string) => `${n} ${(language === 'en' && n === 1 ? label.replace(/s$/i, '') : label).toLowerCase()}`;
  const [summary, setSummary] = useState<LearningSummaryRow[]>([]);
  const [chapters, setChapters] = useState<LearningChapter[]>([]);
  const [path, setPath] = useState<Path>({});
  const [viewerTopic, setViewerTopic] = useState<LearningTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sum, hier] = await Promise.all([
        apiService.getResourcesSummary(),
        apiService.getResourcesHierarchy(),
      ]);
      setSummary(sum || []);
      setChapters(hier || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Learning Resource', traineeName);
    loadData();
    return () => {
      screenTimeTracker.onScreenLeave('Learning Resource', traineeName);
    };
  }, [loadData]);

  const view: 'courses' | 'subjects' | 'chapters' | 'topics' =
    path.chapter !== undefined ? 'topics' : path.subject !== undefined ? 'chapters' : path.course !== undefined ? 'subjects' : 'courses';

  const goUp = () => {
    if (path.chapter !== undefined) setPath({ course: path.course, subject: path.subject });
    else if (path.subject !== undefined) setPath({ course: path.course });
    else if (path.course !== undefined) setPath({});
    else onBack();
  };

  // Hardware back: close the viewer, then walk back up the levels, then leave the screen.
  useHardwareBack(() => {
    if (viewerTopic) setViewerTopic(null);
    else goUp();
    return true;
  });

  // ---------- derived data ----------
  const overall = useMemo(() => countTopics(chapters), [chapters]);

  const byType = useMemo(() => {
    const out: Record<LearningTopic['fileType'], Counts> = {
      VIDEO: { total: 0, viewed: 0 },
      PDF: { total: 0, viewed: 0 },
      PPT: { total: 0, viewed: 0 },
    };
    chapters.forEach(c =>
      c.topics.forEach(tp => {
        const b = out[tp.fileType] || out.PDF;
        b.total += 1;
        if (tp.readStatus) b.viewed += 1;
      })
    );
    return out;
  }, [chapters]);

  /** One row per course: server summary (month/year counts) merged with live viewed counts. */
  const courseRows = useMemo(() => {
    const names = unique([...summary.map(s => s.course), ...chapters.map(c => c.course)]);
    return names.map(name => {
      const s = summary.find(r => r.course === name);
      const own = chapters.filter(c => c.course === name);
      const live = countTopics(own);
      const total = own.length ? live.total : s?.total ?? 0;
      const viewed = own.length ? live.viewed : s?.viewed ?? 0;
      return {
        course: name,
        total,
        viewed,
        unread: Math.max(0, total - viewed),
        monthly: s?.monthly ?? 0,
        yearly: s?.yearly ?? 0,
        subjects: unique(own.map(c => c.subject)).length,
        hasContent: own.length > 0,
      };
    });
  }, [summary, chapters]);

  const courseChapters = useMemo(() => chapters.filter(c => c.course === path.course), [chapters, path.course]);
  const subjectChapters = useMemo(
    () => courseChapters.filter(c => c.subject === path.subject),
    [courseChapters, path.subject]
  );
  const currentChapter = useMemo(
    () => subjectChapters.find(c => c.chapter === path.chapter) || null,
    [subjectChapters, path.chapter]
  );

  // ---------- actions ----------
  const openTopic = (topic: LearningTopic) => {
    setViewerTopic(topic);
    if (topic.readStatus) return;
    const now = new Date().toISOString();
    setChapters(prev =>
      prev.map(c =>
        c.topics.some(tp => tp.id === topic.id)
          ? {
              ...c,
              viewedCount: (c.viewedCount ?? c.topics.filter(tp => tp.readStatus).length) + 1,
              topics: c.topics.map(tp => (tp.id === topic.id ? { ...tp, readStatus: true, viewedAt: now } : tp)),
            }
          : c
      )
    );
    apiService.markResourceViewed(topic.id).catch(() => undefined);
  };

  // ---------- renderers ----------
  const renderCourses = () => (
    <>
      <Card dark>
        <Text style={styles.heroMicro}>{t.progressSummary}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroBig}>{pct(overall)}%</Text>
          <Text style={styles.heroBigSub}>
            {overall.viewed} / {overall.total} {t.learningContentViewed.toLowerCase()}
          </Text>
        </View>
        <ProgressBar value={pct(overall)} dark />
        <View style={styles.heroStats}>
          {([
            ['VIDEO', t.videosLabel],
            ['PDF', t.documentsLabel],
            ['PPT', t.presentationsLabel],
          ] as [LearningTopic['fileType'], string][]).map(([key, label], i) => (
            <React.Fragment key={key}>
              {i > 0 ? <View style={styles.heroDivider} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>{label}</Text>
                <Text style={styles.heroValue}>
                  {byType[key].viewed}
                  <Text style={styles.heroValueMuted}> / {byType[key].total}</Text>
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </Card>

      <View style={styles.notice}>
        <MaterialIcons name="lock-outline" size={16} color={colors.muted} />
        <Text style={styles.noticeText}>{t.cannotDownloadNotice}</Text>
      </View>

      {courseRows.length === 0 ? (
        <Empty title={t.noContent} sub={t.noContentSub} />
      ) : (
        courseRows.map(row => (
          <TouchableOpacity
            key={row.course}
            activeOpacity={0.8}
            disabled={!row.hasContent}
            onPress={() => setPath({ course: row.course })}
          >
            <Card style={styles.listCard}>
              <View style={styles.listTop}>
                <View style={[styles.tile, { backgroundColor: colors.tealSoft }]}>
                  <MaterialCommunityIcons name="school-outline" size={21} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle} numberOfLines={2}>{row.course}</Text>
                  <Text style={styles.listSub}>
                    {countLabel(row.subjects, t.subjectsLabel)} · {pct(row)}% {t.viewedLabel.toLowerCase()}
                  </Text>
                </View>
                {row.unread > 0 ? <Pill label={`${row.unread} ${t.newLabel}`} tone="teal" /> : null}
                {row.hasContent ? <MaterialIcons name="chevron-right" size={22} color={colors.faint} style={{ marginLeft: 4 }} /> : null}
              </View>
              <ProgressBar value={pct(row)} />
              <View style={styles.statGrid}>
                <Stat label={t.totalLabel} value={row.total} />
                <Stat label={t.viewedLabel} value={row.viewed} tone={colors.green} />
                <Stat label={t.colUnread} value={row.unread} tone={colors.teal} />
                <Stat label={t.thisMonth} value={row.monthly} />
                <Stat label={t.thisYear} value={row.yearly} />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </>
  );

  const contextCard = ({ micro, title, counts, extra, trail }: { micro: string; title: string; counts: Counts; extra?: string; trail?: string }) => (
    <Card style={styles.contextCard}>
      {trail ? <Text style={styles.trail} numberOfLines={1}>{trail}</Text> : null}
      <Text style={styles.micro}>{micro}</Text>
      <Text style={styles.contextTitle}>{title}</Text>
      <View style={styles.contextRow}>
        <Text style={styles.listSub}>
          {extra ? `${extra} · ` : ''}
          {counts.viewed} / {counts.total} {t.viewedLabel.toLowerCase()}
        </Text>
        <Text style={styles.contextPct}>{pct(counts)}%</Text>
      </View>
      <ProgressBar value={pct(counts)} />
    </Card>
  );

  const drillRow = (key: string, { icon, fg, bg, title, sub, counts, onPress }: { icon: string; fg: string; bg: string; title: string; sub: string; counts: Counts; onPress: () => void }) => {
    const done = counts.total > 0 && counts.viewed >= counts.total;
    return (
      <TouchableOpacity key={key} activeOpacity={0.8} onPress={onPress}>
        <Card style={styles.listCard}>
          <View style={styles.listTop}>
            <View style={[styles.tile, { backgroundColor: bg }]}>
              <MaterialCommunityIcons name={icon as any} size={21} color={fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.listSub}>{sub}</Text>
            </View>
            {done ? (
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.green} />
            ) : (
              <Text style={styles.countBadge}>{counts.viewed}/{counts.total}</Text>
            )}
            <MaterialIcons name="chevron-right" size={22} color={colors.faint} style={{ marginLeft: 4 }} />
          </View>
          <ProgressBar value={pct(counts)} />
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSubjects = () => {
    const subjects = unique(courseChapters.map(c => c.subject));
    return (
      <>
        {contextCard({
          micro: 'Course',
          title: path.course || '',
          counts: countTopics(courseChapters),
          extra: countLabel(subjects.length, t.subjectsLabel),
        })}
        <Text style={[styles.micro, styles.listHeading]}>{t.subjectsLabel}</Text>
        {subjects.length === 0 ? (
          <Empty title={t.noContent} sub={t.noContentSub} />
        ) : (
          subjects.map(subject => {
            const chs = courseChapters.filter(c => c.subject === subject);
            const counts = countTopics(chs);
            return drillRow(subject, {
              icon: 'book-open-variant',
              fg: colors.blue,
              bg: colors.blueSoft,
              title: subject,
              sub: `${countLabel(chs.length, t.chaptersLabel)} · ${countLabel(counts.total, t.topicsLabel)}`,
              counts,
              onPress: () => setPath({ course: path.course, subject }),
            });
          })
        )}
      </>
    );
  };

  const renderChapters = () => (
    <>
      {contextCard({
        micro: 'Subject',
        trail: path.course,
        title: path.subject || '',
        counts: countTopics(subjectChapters),
        extra: countLabel(subjectChapters.length, t.chaptersLabel),
      })}
      <Text style={[styles.micro, styles.listHeading]}>{t.chaptersLabel}</Text>
      {subjectChapters.length === 0 ? (
        <Empty title={t.noContent} sub={t.noContentSub} />
      ) : (
        subjectChapters.map((c, i) => {
          const counts = countTopics([c]);
          return drillRow(`${c.chapter}-${i}`, {
            icon: 'bookmark-multiple-outline',
            fg: colors.teal,
            bg: colors.tealSoft,
            title: c.chapter,
            sub: countLabel(counts.total, t.topicsLabel),
            counts,
            onPress: () => setPath({ course: path.course, subject: path.subject, chapter: c.chapter }),
          });
        })
      )}
    </>
  );

  const renderTopics = () => {
    const topics = currentChapter?.topics || [];
    return (
      <>
        {contextCard({
          micro: 'Chapter',
          trail: `${path.course} › ${path.subject}`,
          title: path.chapter || '',
          counts: countTopics(currentChapter ? [currentChapter] : []),
          extra: countLabel(topics.length, t.topicsLabel),
        })}
        <Text style={[styles.micro, styles.listHeading]}>{t.topicsLabel}</Text>
        {topics.length === 0 ? (
          <Empty title={t.noContent} sub={t.noContentSub} />
        ) : (
          topics.map(topic => {
            const fs = FILE_STYLE[topic.fileType] || FILE_STYLE.PDF;
            const meta = topic.fileType === 'VIDEO' ? topic.videoDuration : topic.fileSize;
            return (
              <TouchableOpacity key={topic.id} activeOpacity={0.8} onPress={() => openTopic(topic)}>
                <Card style={styles.listCard}>
                  <View style={styles.topicTop}>
                    <View style={[styles.tile, { backgroundColor: fs.bg }]}>
                      <MaterialCommunityIcons name={fs.icon as any} size={22} color={fs.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={2}>{topic.title}</Text>
                      {topic.description ? (
                        <Text style={styles.topicDesc} numberOfLines={2}>{topic.description}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.listMeta}>
                    <View style={[styles.typeChip, { backgroundColor: fs.bg }]}>
                      <Text style={[styles.typeChipText, { color: fs.fg }]}>{topic.fileType}</Text>
                    </View>
                    {meta ? (
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons
                          name={topic.fileType === 'VIDEO' ? 'clock-outline' : 'file-outline'}
                          size={14}
                          color={colors.muted}
                        />
                        <Text style={styles.metaText}>{meta}</Text>
                      </View>
                    ) : null}
                    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {topic.readStatus ? (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="check-circle" size={15} color={colors.green} />
                          <Text style={[styles.metaText, { color: colors.green }]}>{t.viewedLabel}</Text>
                        </View>
                      ) : (
                        <Pill label={t.newLabel} tone="teal" dot />
                      )}
                      <View style={styles.openBtn}>
                        <MaterialCommunityIcons name="eye-outline" size={14} color="#fff" />
                        <Text style={styles.openBtnText}>{t.openContent}</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </>
    );
  };

  const subtitle =
    view === 'subjects' ? t.subjectsLabel : view === 'chapters' ? t.chaptersLabel : view === 'topics' ? t.topicsLabel : traineeName;

  return (
    <View style={styles.container}>
      <Header title={t.learningResource} subtitle={subtitle} onBack={goUp} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              colors={[colors.teal]}
              tintColor={colors.teal}
            />
          }
        >
          {view === 'courses'
            ? renderCourses()
            : view === 'subjects'
            ? renderSubjects()
            : view === 'chapters'
            ? renderChapters()
            : renderTopics()}
        </ScrollView>
      )}

      {/* In-app viewer only — learning content cannot be downloaded */}
      <DocumentViewerModal visible={viewerTopic !== null} topic={viewerTopic} onClose={() => setViewerTopic(null)} />
    </View>
  );
};

const ProgressBar: React.FC<{ value: number; dark?: boolean }> = ({ value, dark }) => (
  <View style={[styles.bar, dark && styles.barDark]}>
    <View style={[styles.barFill, dark && styles.barFillDark, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
  </View>
);

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
  </View>
);

const Empty: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <MaterialCommunityIcons name="bookshelf" size={26} color={colors.teal} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySub}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  micro: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.muted },
  listHeading: { marginTop: 18, marginBottom: 10, marginLeft: 2 },

  heroMicro: { color: colors.navyMuted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10, marginBottom: 12, gap: 10 },
  heroBig: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.8, lineHeight: 38 },
  heroBigSub: { flex: 1, color: colors.navyMuted, fontSize: 13, fontWeight: '600', marginBottom: 5 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  heroLabel: { color: colors.navyMuted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4 },
  heroValueMuted: { color: colors.navyMuted, fontSize: 13, fontWeight: '600' },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 12 },

  bar: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginTop: 12 },
  barDark: { backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 0 },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.teal },
  barFillDark: { backgroundColor: colors.cyan },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 16,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surfaceMuted,
    borderWidth: 1, borderColor: colors.line,
  },
  noticeText: { flex: 1, fontSize: 12, color: colors.ink2, lineHeight: 17 },

  listCard: { marginBottom: 12, padding: 14 },
  listTop: { flexDirection: 'row', alignItems: 'center' },
  topicTop: { flexDirection: 'row', alignItems: 'flex-start' },
  tile: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  listSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  countBadge: { fontSize: 12, fontWeight: '800', color: colors.ink2, backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, overflow: 'hidden' },

  statGrid: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  statLabel: { textAlign: 'center', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted, marginTop: 2 },

  contextCard: { padding: 14 },
  trail: { fontSize: 11.5, color: colors.teal, fontWeight: '700', marginBottom: 6 },
  contextTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 4, letterSpacing: -0.3 },
  contextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  contextPct: { fontSize: 13, fontWeight: '800', color: colors.teal },

  topicDesc: { fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 18 },
  listMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  typeChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  typeChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.teal, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  openBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
});
