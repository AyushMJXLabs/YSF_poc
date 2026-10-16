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
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Language, LearningSummaryRow, LearningChapter, LearningTopic } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { colors, radius, shadow, Card, Pill } from '../theme';

interface LearningResourcesScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const LearningResourcesScreen: React.FC<LearningResourcesScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [level, setLevel] = useState<'summary' | 'master' | 'topic'>('summary');
  const [summaryData, setSummaryData] = useState<LearningSummaryRow[]>([]);
  const [hierarchyData, setHierarchyData] = useState<LearningChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<LearningChapter | null>(null);
  const [viewerTopic, setViewerTopic] = useState<LearningTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [sum, hier] = await Promise.all([
      apiService.getResourcesSummary(),
      apiService.getResourcesHierarchy(),
    ]);
    setSummaryData(sum);
    setHierarchyData(hier);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Learning Resource', traineeName);
    loadData();

    return () => {
      screenTimeTracker.onScreenLeave('Learning Resource', traineeName);
    };
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleHeaderBack = () => {
    if (level === 'topic') {
      setLevel('master');
    } else if (level === 'master') {
      setLevel('summary');
    } else {
      onBack();
    }
  };

  const currentTitle =
    level === 'summary'
      ? t.resourceSummary
      : level === 'master'
      ? t.studentResourceMaster
      : t.studentResourceTopic;

  return (
    <View style={styles.container}>
      <Header title={currentTitle} onBack={handleHeaderBack} />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} tintColor={colors.teal} />}
        >
          {/* LEVEL 1: Summary Table */}
          {level === 'summary' && (
            <View>
              <Card style={styles.tableCard}>
                {/* Header row */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { flex: 2 }]}>{t.colCourse}</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.colUnread}</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.colYesterday}</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.colMonthly}</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.colYearly}</Text>
                </View>

                {/* Table Data Rows */}
                {summaryData.map((row, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tableDataRow, idx === summaryData.length - 1 && styles.tableDataRowLast]}
                    onPress={() => setLevel('master')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tdText, styles.courseNameTd, { flex: 2 }]}>{row.course}</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{row.unread}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.yesterday}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.monthly}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.yearly}</Text>
                  </TouchableOpacity>
                ))}
              </Card>

              {/* Anti-Download Constraint Reminder */}
              <View style={styles.constraintBanner}>
                <MaterialIcons name="security" size={18} color={colors.red} />
                <Text style={styles.constraintText}>{t.cannotDownloadNotice}</Text>
              </View>
            </View>
          )}

          {/* LEVEL 2: Student Resource Master / Chapters */}
          {level === 'master' && (
            <View>
              {hierarchyData.map((chap, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chapterCard}
                  onPress={() => {
                    setSelectedChapter(chap);
                    setLevel('topic');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.chapterIconTile}>
                    <MaterialIcons name="menu-book" size={20} color={colors.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.chapterRow}>
                      <Text style={styles.chapterLabel}>{t.chapterName}</Text>
                      <Text style={styles.chapterValue}>{chap.chapter}</Text>
                    </View>
                    <View style={[styles.chapterRow, { marginBottom: 0 }]}>
                      <Text style={styles.chapterLabel}>{t.topicsCount}</Text>
                      <Pill label={String(chap.topicsCount)} tone="teal" style={{ marginTop: 2 }} />
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.faint} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* LEVEL 3: Student Resource Topic */}
          {level === 'topic' && selectedChapter && (
            <View>
              {selectedChapter.topics.map((topic) => (
                <Card key={topic.id} style={styles.topicCard}>
                  <View style={styles.topicHeadRow}>
                    <View style={styles.topicIconTile}>
                      <FontAwesome5
                        name={topic.fileType === 'PDF' ? "file-pdf" : topic.fileType === 'PPT' ? "file-powerpoint" : "video"}
                        size={15}
                        color={colors.teal}
                      />
                    </View>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                  </View>

                  <Text style={styles.topicDesc}>{topic.description}</Text>

                  <View style={styles.topicFileTypeRow}>
                    <MaterialIcons name="lock-outline" size={13} color={colors.muted} />
                    <Text style={styles.topicFileTypeText}>Format: {topic.fileType} (In-App Protected)</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.openFileBtn}
                    onPress={() => setViewerTopic(topic)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="visibility" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.openFileBtnText}>{t.openFile}</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* In-App Document Viewer with Anti-Download Protection */}
      <DocumentViewerModal
        visible={viewerTopic !== null}
        topic={viewerTopic}
        onClose={() => setViewerTopic(null)}
      />
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
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  tableDataRowLast: {
    borderBottomWidth: 0,
  },
  tdText: {
    fontSize: 13,
    color: colors.ink2,
  },
  courseNameTd: {
    fontWeight: '700',
    color: colors.ink,
    paddingRight: 6,
  },
  unreadBadge: {
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.teal,
  },
  constraintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 16,
  },
  constraintText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  chapterIconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterRow: {
    marginBottom: 8,
  },
  chapterLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 2,
  },
  chapterValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  topicCard: {
    marginBottom: 12,
  },
  topicHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topicIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  openFileBtn: {
    flexDirection: 'row',
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 14,
  },
  openFileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topicDesc: {
    fontSize: 13.5,
    color: colors.muted,
    lineHeight: 19,
  },
  topicFileTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  topicFileTypeText: {
    fontSize: 11.5,
    color: colors.ink2,
    fontWeight: '600',
    marginLeft: 6,
  },
});
