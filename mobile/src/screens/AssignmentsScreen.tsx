import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Language, Assignment } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';

interface AssignmentsScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const AssignmentsScreen: React.FC<AssignmentsScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [viewState, setViewState] = useState<'list' | 'detail' | 'reply'>('list');
  const [filter, setFilter] = useState<'all' | 'monthwise' | 'subjectwise'>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [replyText, setReplyText] = useState('');
  const [attachment1, setAttachment1] = useState<{ name: string; size?: string; uri?: string; file?: any; mimeType?: string } | null>(null);
  const [attachment2, setAttachment2] = useState<{ name: string; size?: string; uri?: string; file?: any; mimeType?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Assignment', traineeName);
    loadAssignments(filter);

    return () => {
      screenTimeTracker.onScreenLeave('Assignment', traineeName);
    };
  }, [filter]);

  const loadAssignments = async (currentFilter: string) => {
    const data = await apiService.getAssignments(currentFilter);
    setAssignments(data);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments(filter);
  };

  const handleSelectAssignment = (item: Assignment) => {
    setSelectedAssignment(item);
    setLikesCount(item.likes || 0);
    setHasLiked(false);
    setReplyText('');
    setAttachment1(null);
    setAttachment2(null);
    setViewState('detail');
  };

  const handlePickDocument = async (slot: 1 | 2) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileObj = {
          name: file.name,
          size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : undefined,
          uri: file.uri,
          file: (file as any).file,
          mimeType: file.mimeType,
        };
        if (slot === 1) setAttachment1(fileObj);
        else setAttachment2(fileObj);
      }
    } catch (err) {
      // Fallback file placeholder
      const dummy = { name: `assignment_submission_part${slot}.pdf`, size: '1.2 MB' };
      if (slot === 1) setAttachment1(dummy);
      else setAttachment2(dummy);
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedAssignment) return;
    if (!replyText.trim() && !attachment1 && !attachment2) {
      Alert.alert("Input Required", "Please enter reply text or attach at least one file.");
      return;
    }

    setSubmitting(true);
    const attachments = [];
    if (attachment1) {
      const uploaded = await apiService.uploadFile(attachment1);
      attachments.push(uploaded || attachment1);
    }
    if (attachment2) {
      const uploaded = await apiService.uploadFile(attachment2);
      attachments.push(uploaded || attachment2);
    }

    const res = await apiService.submitAssignmentReply(selectedAssignment.id, {
      traineeId: 'T001',
      traineeName,
      text: replyText.trim() || 'Submitted assignment files',
      attachments,
    });

    setSubmitting(false);

    if (res.success) {
      Alert.alert("Success", "Your assignment reply has been submitted successfully to YSF Admin.", [
        {
          text: t.ok,
          onPress: () => {
            setViewState('list');
            loadAssignments(filter);
          },
        },
      ]);
    }
  };

  const handleBackNavigation = () => {
    if (viewState === 'reply') {
      setViewState('detail');
    } else if (viewState === 'detail') {
      setViewState('list');
    } else {
      onBack();
    }
  };

  const headerTitle =
    viewState === 'list'
      ? t.assignment
      : viewState === 'detail'
      ? t.assignmentDetail
      : t.sendAssignmentReply;

  return (
    <View style={styles.container}>
      <Header
        title={headerTitle}
        subtitle={traineeName}
        onBack={handleBackNavigation}
      />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <View style={styles.body}>
          {/* VIEW 1: Assignment List (p16_img0_Image90.jpg) */}
          {viewState === 'list' && (
            <View style={styles.listContainer}>
              <ScrollView
                contentContainerStyle={styles.listScroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A0E3"]} />}
              >
                {assignments.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => handleSelectAssignment(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listItemTop}>
                      <Text style={styles.listCourseTitle} numberOfLines={2}>
                        {item.course}
                      </Text>
                      <Text style={styles.listDate}>{item.assignedDate}</Text>
                    </View>
                    <Text style={styles.listSubtitle}>
                      No. {item.no} - {item.shortTitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Bottom 3-Filter Bar matching screenshot */}
              <View style={styles.bottomFilterBar}>
                <TouchableOpacity
                  style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilter('all')}
                >
                  <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                    {t.all}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, filter === 'monthwise' && styles.filterButtonActive]}
                  onPress={() => setFilter('monthwise')}
                >
                  <Text style={[styles.filterButtonText, filter === 'monthwise' && styles.filterButtonTextActive]}>
                    {t.monthwise}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, filter === 'subjectwise' && styles.filterButtonActive]}
                  onPress={() => setFilter('subjectwise')}
                >
                  <Text style={[styles.filterButtonText, filter === 'subjectwise' && styles.filterButtonTextActive]}>
                    {t.subjectwise}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VIEW 2: Assignment Details (p16_img1_Image91.jpg) */}
          {viewState === 'detail' && selectedAssignment && (
            <View style={styles.detailContainer}>
              <ScrollView contentContainerStyle={styles.detailScroll}>
                <Text style={styles.detailDateRight}>{selectedAssignment.assignedDate}</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.assignmentName}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.shortTitle}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.assignmentNo}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.no}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.colCourse} :</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.course}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.topic}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.topic || '-'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.submissionDate}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.submissionDate}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.marks}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.marks.toFixed(1)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.teacher}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.teacher}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.details}</Text>
                  <Text style={styles.detailValue}>{selectedAssignment.details}</Text>
                </View>

                {/* Trainee Submission & Evaluation Result */}
                {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                  <View style={styles.submissionFeedbackCard}>
                    <View style={styles.submissionHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="assignment-turned-in" size={18} color="#0288D1" style={{ marginRight: 6 }} />
                        <Text style={styles.submissionCardTitle}>Your Submission Status</Text>
                      </View>
                      <View style={[
                        styles.evalBadge,
                        selectedAssignment.submissions[0].gradeStatus === 'Graded' ? styles.evalGraded :
                        selectedAssignment.submissions[0].gradeStatus === 'Needs Revision' ? styles.evalRevision : styles.evalPending
                      ]}>
                        <Text style={[
                          styles.evalBadgeText,
                          selectedAssignment.submissions[0].gradeStatus === 'Graded' ? styles.evalGradedText :
                          selectedAssignment.submissions[0].gradeStatus === 'Needs Revision' ? styles.evalRevisionText : styles.evalPendingText
                        ]}>
                          {selectedAssignment.submissions[0].gradeStatus === 'Graded'
                            ? `Graded: ${selectedAssignment.submissions[0].gradedMarks ?? selectedAssignment.marks} / ${selectedAssignment.marks}`
                            : selectedAssignment.submissions[0].gradeStatus || 'Pending Evaluation'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.subTextContent}>"{selectedAssignment.submissions[0].text}"</Text>

                    {selectedAssignment.submissions[0].remarks ? (
                      <View style={styles.instructorRemarksBox}>
                        <Text style={styles.remarksTitle}>Instructor Feedback / Remarks:</Text>
                        <Text style={styles.remarksBody}>"{selectedAssignment.submissions[0].remarks}"</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Like Counter Box */}
                <View style={styles.likeCard}>
                  <TouchableOpacity
                    style={styles.thumbsUpBtn}
                    onPress={() => {
                      if (!hasLiked) {
                        setLikesCount(likesCount + 1);
                        setHasLiked(true);
                      }
                    }}
                  >
                    <MaterialIcons name={hasLiked ? "thumb-up" : "thumb-up-off-alt"} size={26} color={hasLiked ? "#0288D1" : "#424242"} />
                  </TouchableOpacity>
                  <View style={styles.likeCountRow}>
                    <MaterialIcons name="thumb-up" size={18} color="#FF9800" />
                    <Text style={styles.likeCountText}>{likesCount} {t.like}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* SEND REPLY Bottom Button */}
              <TouchableOpacity
                style={styles.sendReplyBottomBtn}
                onPress={() => setViewState('reply')}
                activeOpacity={0.8}
              >
                <Text style={styles.sendReplyBottomText}>{t.sendReply}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 3: Send Assignment Reply (p16_img2_Image92.jpg) */}
          {viewState === 'reply' && (
            <View style={styles.replyContainer}>
              <ScrollView contentContainerStyle={styles.replyScroll}>
                <Text style={styles.sendTextLabel}>{t.sendText}</Text>

                <TextInput
                  style={styles.replyInput}
                  multiline
                  numberOfLines={6}
                  placeholder="Type your assignment answers, notes, or explanations here..."
                  placeholderTextColor="#9E9E9E"
                  value={replyText}
                  onChangeText={setReplyText}
                />

                {/* Attachment 1 */}
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => handlePickDocument(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.attachmentBtnText}>{t.selectAttachment1}</Text>
                </TouchableOpacity>
                {attachment1 ? (
                  <View style={styles.selectedFileBox}>
                    <MaterialIcons name="attach-file" size={18} color="#0288D1" />
                    <Text style={styles.selectedFileName} numberOfLines={1}>{attachment1.name}</Text>
                  </View>
                ) : null}

                {/* Attachment 2 */}
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => handlePickDocument(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.attachmentBtnText}>{t.selectAttachment2}</Text>
                </TouchableOpacity>
                {attachment2 ? (
                  <View style={styles.selectedFileBox}>
                    <MaterialIcons name="attach-file" size={18} color="#0288D1" />
                    <Text style={styles.selectedFileName} numberOfLines={1}>{attachment2.name}</Text>
                  </View>
                ) : null}

                {/* SEND REPLY Action Button */}
                <TouchableOpacity
                  style={[styles.attachmentButton, styles.submitButton]}
                  onPress={handleSubmitReply}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>{t.submitReply}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
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
  body: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listScroll: {
    paddingVertical: 10,
  },
  listItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
  },
  listItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listCourseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    lineHeight: 22,
    marginRight: 10,
  },
  listDate: {
    fontSize: 13,
    color: '#546E7A',
    fontWeight: '500',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 6,
  },
  bottomFilterBar: {
    flexDirection: 'row',
    backgroundColor: '#00A0E3',
    paddingVertical: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0288D1',
  },
  filterButtonActive: {
    backgroundColor: '#0288D1',
  },
  filterButtonText: {
    color: '#E0F2FE',
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  detailContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailScroll: {
    padding: 18,
    paddingBottom: 20,
  },
  detailDateRight: {
    alignSelf: 'flex-end',
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 145,
    fontSize: 14,
    fontWeight: '700',
    color: '#37474F',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#455A64',
    lineHeight: 20,
  },
  likeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  thumbsUpBtn: {
    padding: 6,
  },
  likeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCountText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600',
    marginLeft: 6,
  },
  sendReplyBottomBtn: {
    backgroundColor: '#7C9DF5', // periwinkle from screenshot p16_img1_Image91.jpg
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendReplyBottomText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  replyContainer: {
    flex: 1,
  },
  replyScroll: {
    padding: 18,
  },
  sendTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 10,
  },
  replyInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#B0BEC5',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#212121',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  attachmentButton: {
    backgroundColor: '#7C9DF5',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  submitButton: {
    backgroundColor: '#5C6BC0',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
    marginTop: -6,
  },
  selectedFileName: {
    fontSize: 12,
    color: '#0277BD',
    marginLeft: 6,
    flex: 1,
    fontWeight: '600',
  },
  // Submission & Grading Styles
  submissionFeedbackCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  evalBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  evalGraded: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  evalRevision: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  evalPending: {
    backgroundColor: '#E2E8F0',
  },
  evalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  evalGradedText: {
    color: '#065F46',
  },
  evalRevisionText: {
    color: '#B45309',
  },
  evalPendingText: {
    color: '#475569',
  },
  subTextContent: {
    fontSize: 12.5,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructorRemarksBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  remarksTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  remarksBody: {
    fontSize: 11.5,
    color: '#064E3B',
    fontStyle: 'italic',
  },
});
