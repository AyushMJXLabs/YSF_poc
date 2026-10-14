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
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A0E3"]} />}
        >
          {/* LEVEL 1: Summary Table (p15_img2_Image85.jpg) */}
          {level === 'summary' && (
            <View>
              <View style={styles.tableCard}>
                {/* Purple header row */}
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
                    style={styles.tableDataRow}
                    onPress={() => setLevel('master')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tdText, styles.courseNameTd, { flex: 2 }]}>{row.course}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>{row.unread}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.yesterday}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.monthly}</Text>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{row.yearly}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Anti-Download Constraint Reminder */}
              <View style={styles.constraintBanner}>
                <MaterialIcons name="security" size={18} color="#D32F2F" />
                <Text style={styles.constraintText}>{t.cannotDownloadNotice}</Text>
              </View>
            </View>
          )}

          {/* LEVEL 2: Student Resource Master / Chapters (p15_img0_Image83.jpg) */}
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
                  <View style={styles.chapterRow}>
                    <Text style={styles.chapterLabel}>{t.chapterName}</Text>
                    <Text style={styles.chapterValue}>{chap.chapter}</Text>
                  </View>
                  <View style={styles.chapterRow}>
                    <Text style={styles.chapterLabel}>{t.topicsCount}</Text>
                    <Text style={styles.chapterValue}>{chap.topicsCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* LEVEL 3: Student Resource Topic (p15_img1_Image84.jpg) */}
          {level === 'topic' && selectedChapter && (
            <View>
              {selectedChapter.topics.map((topic) => (
                <View key={topic.id} style={styles.topicCard}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>

                  <TouchableOpacity
                    style={styles.openFileBtn}
                    onPress={() => setViewerTopic(topic)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openFileBtnText}>{t.openFile}</Text>
                  </TouchableOpacity>

                  <Text style={styles.topicDesc}>{topic.description}</Text>

                  <View style={styles.topicFileTypeRow}>
                    <FontAwesome5
                      name={topic.fileType === 'PDF' ? "file-pdf" : topic.fileType === 'PPT' ? "file-powerpoint" : "video"}
                      size={14}
                      color="#0288D1"
                    />
                    <Text style={styles.topicFileTypeText}>Format: {topic.fileType} (In-App Protected)</Text>
                  </View>
                </View>
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
    backgroundColor: '#FAFAFA',
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#7E57C2',
    overflow: 'hidden',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#AB47BC', // Purple header matching screenshot p15_img2_Image85.jpg
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  thText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#ffffff',
  },
  tdText: {
    fontSize: 12,
    color: '#212121',
  },
  courseNameTd: {
    fontWeight: '600',
    color: '#37474F',
    paddingRight: 6,
  },
  constraintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 12,
    borderRadius: 6,
    marginTop: 18,
  },
  constraintText: {
    color: '#C62828',
    fontSize: 11.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chapterRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chapterLabel: {
    width: 140,
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
  },
  chapterValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#455A64',
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    lineHeight: 22,
    marginBottom: 14,
  },
  openFileBtn: {
    backgroundColor: '#00A0E3',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  openFileBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topicDesc: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#424242',
    lineHeight: 19,
  },
  topicFileTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  topicFileTypeText: {
    fontSize: 11,
    color: '#0288D1',
    fontWeight: '600',
    marginLeft: 6,
  },
});
