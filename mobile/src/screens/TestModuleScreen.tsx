import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Language, TestItem, CourseTestSummary } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';

interface TestModuleScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const TestModuleScreen: React.FC<TestModuleScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [viewState, setViewState] = useState<'table' | 'list' | 'instructions' | 'quiz' | 'result'>('table');
  const [bottomTab, setBottomTab] = useState<'test' | 'coursewise' | 'testwise'>('test');
  const [courseSummaries, setCourseSummaries] = useState<CourseTestSummary[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefModal, setShowRefModal] = useState(false);

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: number }>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(3600);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const loadTestData = useCallback(async () => {
    const data = await apiService.getTests();
    setCourseSummaries(data.courseSummary);
    setTests(data.tests);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Test Module', traineeName);
    loadTestData();

    return () => {
      screenTimeTracker.onScreenLeave('Test Module', traineeName);
    };
  }, [loadTestData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTestData();
  };

  // Timer countdown when quiz is active
  useEffect(() => {
    let timer: any = null;
    if (viewState === 'quiz' && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [viewState, timeLeftSeconds]);


  const handleStartInstructions = async (testItem: TestItem) => {
    const fullTest = await apiService.getTestById(testItem.id);
    setSelectedTest(fullTest || testItem);
    setViewState('instructions');
  };

  const handleStartQuiz = () => {
    if (!selectedTest) return;
    setAnswers({});
    setCurrentQIndex(0);
    setTimeLeftSeconds((selectedTest.duration || 60) * 60);
    setViewState('quiz');
  };

  const handleOptionSelect = (qId: number | string, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [String(qId)]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedTest) return;
    setSubmittingQuiz(true);

    const res = await apiService.submitTest(selectedTest.id, answers, 'T001');
    setSubmittingQuiz(false);

    if (res.success && res.data) {
      setQuizResult(res.data);
      setViewState('result');
      // Refresh tests data
      loadTestData();
    } else {
      Alert.alert("Error", "Failed to submit assessment results.");
    }
  };

  const handleBackNavigation = () => {
    if (viewState === 'result') {
      setViewState('list');
    } else if (viewState === 'quiz') {
      Alert.alert(
        "Exit Test?",
        "Are you sure you want to exit? Your current test progress will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => setViewState('instructions') }
        ]
      );
    } else if (viewState === 'instructions') {
      setViewState('list');
    } else if (viewState === 'list') {
      setViewState('table');
    } else {
      onBack();
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Header
        title={t.testModule}
        onBack={handleBackNavigation}
      />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <View style={styles.body}>
          {/* LEVEL 1: Course Summary Table (p17_img0_Image101.jpg) */}
          {viewState === 'table' && (
            <View style={styles.subContainer}>
              <ScrollView
                contentContainerStyle={styles.tableScroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A0E3"]} />}
              >
                <View style={styles.summaryTableCard}>
                  {/* Table Header with red accent line */}
                  <View style={styles.thRow}>
                    <Text style={[styles.thCell, { flex: 2.2 }]}>{t.colCourse}</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>{t.colTotal}</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>{t.colSolved}</Text>
                    <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center' }]}>{t.colUnsolved}</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>{t.colAction}</Text>
                  </View>
                  <View style={styles.redUnderline} />

                  {/* Table Rows */}
                  {courseSummaries.map((c, idx) => (
                    <View key={idx} style={styles.tdRow}>
                      <Text style={[styles.tdCell, styles.courseNameCell, { flex: 2.2 }]}>{c.course}</Text>
                      <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{c.total}</Text>
                      <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{c.solved}</Text>
                      <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'center' }]}>{c.unSolved}</Text>
                      <TouchableOpacity
                        style={[styles.clickActionBtn, { flex: 1 }]}
                        onPress={() => setViewState('list')}
                      >
                        <Text style={styles.clickActionText}>{t.click}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Test English Language Notice */}
                <View style={styles.languageNoticeBox}>
                  <MaterialIcons name="info" size={18} color="#0288D1" />
                  <Text style={styles.languageNoticeText}>{t.testStrictlyEnglishNotice}</Text>
                </View>
              </ScrollView>
            </View>
          )}

          {/* LEVEL 2: Test List (p17_img1_Image102.jpg) */}
          {viewState === 'list' && (
            <View style={styles.subContainer}>
              <ScrollView
                contentContainerStyle={styles.listScroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A0E3"]} />}
              >
                {tests.map((test) => (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.testListCard}
                    onPress={() => handleStartInstructions(test)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.testCardRow}>
                      <Text style={styles.testNumText}>{t.testNumber}  {test.number}</Text>
                      <Text style={styles.testDateText}>{test.date}</Text>
                    </View>
                    <View style={styles.testCardRow}>
                      <Text style={styles.testLabelText}>{t.testName}</Text>
                      <Text style={styles.testTitleVal} numberOfLines={2}>{test.name}</Text>
                    </View>
                    <View style={styles.testCardRow}>
                      <Text style={styles.testLabelText}>{t.testStatus}</Text>
                      <View style={styles.statusAndScore}>
                        <Text style={[styles.testStatusVal, test.status === 'Solved' && styles.statusSolved]}>
                          {test.status}
                        </Text>
                        <Text style={styles.scoreText}>
                          {test.score !== null ? `${test.score} / ${test.maxScore}` : `0 / ${test.maxScore}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* LEVEL 3: TEST INSTRUCTIONS (p17_img2_Image103.jpg) */}
          {viewState === 'instructions' && selectedTest && (
            <View style={styles.subContainer}>
              <ScrollView contentContainerStyle={styles.instructionsScroll}>
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsHeader}>{t.testInstructions}</Text>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.testName}:</Text>
                    <Text style={styles.instValue}>{selectedTest.name}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.courseName}</Text>
                    <Text style={styles.instValue}>{selectedTest.course}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.testFor}</Text>
                    <Text style={styles.instValue}>{selectedTest.testFor}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.questions}</Text>
                    <Text style={styles.instValue}>{selectedTest.questions?.length || 5}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.totalMarks}</Text>
                    <Text style={styles.instValue}>{selectedTest.totalMarks}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.passingMarks}</Text>
                    <Text style={styles.instValue}>{selectedTest.passingMarks}</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.duration}:</Text>
                    <Text style={styles.instValue}>{selectedTest.duration} minutes</Text>
                  </View>

                  <View style={styles.instRow}>
                    <Text style={styles.instLabel}>{t.instructionsTitle}</Text>
                    <Text style={styles.instValue}>{selectedTest.instructions || t.singleAnswerInstruction}</Text>
                  </View>

                  {selectedTest.attachment && (
                    <TouchableOpacity
                      style={styles.refAttachBtn}
                      onPress={() => setShowRefModal(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="attach-file" size={18} color="#00897B" />
                      <Text style={styles.refAttachText} numberOfLines={1}>
                        Attached Reference Sheet: {selectedTest.attachment.name}
                      </Text>
                      <MaterialIcons name="visibility" size={16} color="#00897B" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.startTestButton}
                    onPress={handleStartQuiz}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startTestButtonText}>{t.startTest}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}

          {/* LEVEL 4: MCQ QUIZ EXECUTION (STRICTLY IN ENGLISH) */}
          {viewState === 'quiz' && selectedTest && selectedTest.questions && (
            <View style={styles.subContainer}>
              <View style={styles.quizHeaderBar}>
                <Text style={styles.quizProgressText}>
                  Question {currentQIndex + 1} of {selectedTest.questions.length}
                </Text>
                <View style={styles.quizHeaderRightArea}>
                  {selectedTest.attachment && (
                    <TouchableOpacity
                      style={styles.quizRefSheetBtn}
                      onPress={() => setShowRefModal(true)}
                    >
                      <MaterialIcons name="description" size={13} color="#ffffff" />
                      <Text style={styles.quizRefSheetBtnText}>Ref Sheet</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.timerBadge}>
                    <FontAwesome5 name="stopwatch" size={14} color="#D32F2F" />
                    <Text style={styles.timerText}>{formatTimer(timeLeftSeconds)}</Text>
                  </View>
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.quizScroll}>
                {(() => {
                  const currentQ = selectedTest.questions[currentQIndex];
                  const selectedOption = answers[String(currentQ.id)];
                  return (
                    <View style={styles.quizCard}>
                      {currentQ.module ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                          <View style={{ backgroundColor: '#EEF2FF', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#4F46E5' }}>{currentQ.module}</Text>
                          </View>
                          {currentQ.marks ? (
                            <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>{currentQ.marks} Marks</Text>
                          ) : null}
                        </View>
                      ) : null}
                      <Text style={styles.questionText}>
                        Q{currentQIndex + 1}. {currentQ.question}
                      </Text>

                      <View style={styles.optionsList}>
                        {currentQ.options.map((opt, oIdx) => {
                          const isSelected = selectedOption === oIdx;
                          return (
                            <TouchableOpacity
                              key={oIdx}
                              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                              onPress={() => handleOptionSelect(currentQ.id, oIdx)}
                              activeOpacity={0.8}
                            >
                              <View style={[styles.optRadio, isSelected && styles.optRadioSelected]}>
                                {isSelected && <View style={styles.optRadioInner} />}
                              </View>
                              <Text style={[styles.optLabel, isSelected && styles.optLabelSelected]}>
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Bottom Navigation Buttons */}
                <View style={styles.quizNavRow}>
                  <TouchableOpacity
                    style={[styles.quizNavBtn, currentQIndex === 0 && styles.quizNavBtnDisabled]}
                    onPress={() => setCurrentQIndex(currentQIndex - 1)}
                    disabled={currentQIndex === 0}
                  >
                    <Text style={styles.quizNavBtnText}>{t.previous}</Text>
                  </TouchableOpacity>

                  {currentQIndex < selectedTest.questions.length - 1 ? (
                    <TouchableOpacity
                      style={styles.quizNavBtn}
                      onPress={() => setCurrentQIndex(currentQIndex + 1)}
                    >
                      <Text style={styles.quizNavBtnText}>{t.next}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.quizNavBtn, styles.submitQuizBtn]}
                      onPress={handleSubmitQuiz}
                      disabled={submittingQuiz}
                    >
                      {submittingQuiz ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.submitQuizBtnText}>{t.submitTest}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {/* LEVEL 5: RESULTS & SCORE SUMMARY */}
          {viewState === 'result' && quizResult && (
            <View style={styles.subContainer}>
              <ScrollView contentContainerStyle={styles.resultScroll}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultHeader}>{t.testResult}</Text>

                  <View style={[styles.passBadge, quizResult.passed ? styles.badgePassed : styles.badgeFailed]}>
                    <Text style={styles.passBadgeText}>
                      {quizResult.passed ? t.passed : t.failed}
                    </Text>
                  </View>

                  <Text style={styles.scoreNumber}>
                    {quizResult.score} / {quizResult.maxScore}
                  </Text>
                  <Text style={styles.scoreSub}>
                    Passing Marks: {quizResult.passingMarks} | Correct: {quizResult.correctCount} / {quizResult.totalQuestions}
                  </Text>

                  <View style={styles.syncBox}>
                    <MaterialIcons name="cloud-done" size={20} color="#2E7D32" />
                    <Text style={styles.syncText}>Assessment score synchronized with YSF Admin Panel.</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.backToListBtn}
                    onPress={() => setViewState('list')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backToListText}>{t.backToTests}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Bottom 3-Tab Bar matching screenshot: [ TEST ] [ COURSEWISE SUMMARY ] [ TESTWISE SUMMARY ] */}
          {viewState !== 'quiz' && (
            <View style={styles.bottomTabBar}>
              <TouchableOpacity
                style={[styles.tabBarItem, bottomTab === 'test' && styles.tabBarItemActive]}
                onPress={() => {
                  setBottomTab('test');
                  setViewState('table');
                }}
              >
                <Text style={[styles.tabBarText, bottomTab === 'test' && styles.tabBarTextActive]}>
                  {t.tabTest}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBarItem, bottomTab === 'coursewise' && styles.tabBarItemActive]}
                onPress={() => {
                  setBottomTab('coursewise');
                  setViewState('table');
                }}
              >
                <Text style={[styles.tabBarText, bottomTab === 'coursewise' && styles.tabBarTextActive]}>
                  {t.tabCoursewiseSummary}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBarItem, bottomTab === 'testwise' && styles.tabBarItemActive]}
                onPress={() => {
                  setBottomTab('testwise');
                  setViewState('list');
                }}
              >
                <Text style={[styles.tabBarText, bottomTab === 'testwise' && styles.tabBarTextActive]}>
                  {t.tabTestwiseSummary}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* In-App Reference Document Viewer Modal */}
      <DocumentViewerModal
        visible={showRefModal}
        topic={selectedTest?.attachment ? {
          id: selectedTest.id,
          title: selectedTest.attachment.name,
          description: `Reference Material for ${selectedTest.name}`,
          fileType: 'PDF',
          fileName: selectedTest.attachment.name,
          fileUrl: selectedTest.attachment.url,
          contentSummary: `Attached reference document for ${selectedTest.name}. Trainees are authorized to consult this sheet during the assessment.`,
          readStatus: true
        } : null}
        onClose={() => setShowRefModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FC',
  },
  refAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#80CBC4',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 10,
  },
  refAttachText: {
    flex: 1,
    fontSize: 12,
    color: '#00695C',
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 6,
  },
  quizHeaderRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizRefSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00897B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  quizRefSheetBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  subContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tableScroll: {
    padding: 12,
  },
  summaryTableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  thRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  thCell: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#37474F',
  },
  redUnderline: {
    height: 3,
    backgroundColor: '#D32F2F', // red line matching screenshot p17_img0_Image101.jpg
  },
  tdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tdCell: {
    fontSize: 12.5,
    color: '#263238',
  },
  courseNameCell: {
    fontWeight: '600',
    lineHeight: 18,
    paddingRight: 6,
  },
  clickActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickActionText: {
    color: '#0D47A1',
    fontSize: 13,
    fontWeight: '700',
  },
  languageNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    borderWidth: 1,
    borderColor: '#B3E5FC',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  languageNoticeText: {
    fontSize: 12,
    color: '#0277BD',
    marginLeft: 8,
    fontWeight: '600',
  },
  listScroll: {
    padding: 14,
  },
  testListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  testCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#37474F',
  },
  testDateText: {
    fontSize: 13,
    color: '#78909C',
    fontWeight: '500',
  },
  testLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546E7A',
    width: 90,
  },
  testTitleVal: {
    flex: 1,
    fontSize: 13.5,
    color: '#263238',
    fontWeight: '600',
  },
  statusAndScore: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testStatusVal: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '600',
  },
  statusSolved: {
    color: '#2E7D32',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263238',
  },
  instructionsScroll: {
    padding: 16,
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CFD8DC',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#01579B',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  instRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instLabel: {
    width: 125,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#37474F',
  },
  instValue: {
    flex: 1,
    fontSize: 13.5,
    color: '#455A64',
    lineHeight: 19,
  },
  startTestButton: {
    backgroundColor: '#00A0E3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startTestButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  quizHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#B3E5FC',
  },
  quizProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0277BD',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
    marginLeft: 6,
  },
  quizScroll: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 24,
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  optionRowSelected: {
    borderColor: '#0288D1',
    backgroundColor: '#E1F5FE',
  },
  optRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#757575',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optRadioSelected: {
    borderColor: '#0288D1',
  },
  optRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0288D1',
  },
  optLabel: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  optLabelSelected: {
    fontWeight: '700',
    color: '#01579B',
  },
  quizNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizNavBtn: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 6,
  },
  quizNavBtnDisabled: {
    backgroundColor: '#B0BEC5',
  },
  quizNavBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  submitQuizBtn: {
    backgroundColor: '#2E7D32',
  },
  submitQuizBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resultScroll: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  resultHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 16,
  },
  passBadge: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgePassed: {
    backgroundColor: '#E8F5E9',
  },
  badgeFailed: {
    backgroundColor: '#FFEBEE',
  },
  passBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#2E7D32',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0288D1',
  },
  scoreSub: {
    fontSize: 13,
    color: '#546E7A',
    marginTop: 6,
    textAlign: 'center',
  },
  syncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  syncText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '600',
  },
  backToListBtn: {
    backgroundColor: '#00A0E3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginTop: 24,
  },
  backToListText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#00A0E3',
    paddingVertical: 2,
  },
  tabBarItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0288D1',
  },
  tabBarItemActive: {
    backgroundColor: '#0288D1',
  },
  tabBarText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBarTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
