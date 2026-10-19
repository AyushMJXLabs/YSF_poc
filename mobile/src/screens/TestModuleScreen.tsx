import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Language, TestItem } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { colors, radius, Card, Pill } from '../theme';
import { useHardwareBack } from '../hooks/useHardwareBack';

interface TestModuleScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

type Stage = 'list' | 'instructions' | 'quiz' | 'result';
type Filter = 'all' | 'todo' | 'done';

const formatTimer = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const TestModuleScreen: React.FC<TestModuleScreenProps> = ({ language, onBack, traineeName }) => {
  const t = getTranslation(language);
  const [stage, setStage] = useState<Stage>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selected, setSelected] = useState<TestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showRef, setShowRef] = useState(false);

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: number }>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  const load = useCallback(async () => {
    const data = await apiService.getTests();
    setTests(data.tests || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Test Module', traineeName);
    load();
    return () => {
      screenTimeTracker.onScreenLeave('Test Module', traineeName);
    };
  }, []);

  const submitQuiz = useCallback(async (auto = false) => {
    if (!selected || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const res = await apiService.submitTest(selected.id, answersRef.current);
    setSubmitting(false);
    if (res && res.success && res.data) {
      setResult(res.data);
      setStage('result');
      load();
    } else {
      submittedRef.current = false;
      Alert.alert(t.testModule, (res && res.message) || 'Failed to submit the test.');
      if (res && /already attempted/i.test(res.message || '')) { setStage('list'); load(); }
    }
    if (auto) screenTimeTracker.showToast('Time is up — test submitted');
  }, [selected, load, t]);

  // Countdown; submits automatically when time runs out
  useEffect(() => {
    if (stage !== 'quiz') return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, submitQuiz]);

  const openTest = async (item: TestItem) => {
    setOpening(item.id);
    const full = await apiService.getTestById(item.id);
    setOpening(null);
    setSelected(full || item);
    setStage('instructions');
  };

  const startQuiz = () => {
    if (!selected || !selected.questions || selected.questions.length === 0) {
      Alert.alert(t.testModule, 'This test has no questions yet.');
      return;
    }
    submittedRef.current = false;
    setAnswers({});
    setQIndex(0);
    setResult(null);
    setSecondsLeft((selected.duration || 30) * 60);
    setStage('quiz');
  };

  const confirmSubmit = () => {
    const total = selected?.questions?.length || 0;
    const unanswered = total - Object.keys(answers).length;
    Alert.alert(
      t.submitTest,
      unanswered > 0 ? `${unanswered} ${t.unansweredWarning}\n\n${t.confirmSubmitTest}` : t.confirmSubmitTest,
      [{ text: t.cancel, style: 'cancel' }, { text: t.submit, onPress: () => submitQuiz() }]
    );
  };

  const handleBack = () => {
    if (stage === 'quiz') {
      Alert.alert('Exit test?', 'Your answers will be lost if you leave now.', [
        { text: t.cancel, style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => setStage('instructions') },
      ]);
    } else if (stage === 'instructions' || stage === 'result') {
      setStage('list');
    } else {
      onBack();
    }
  };

  useHardwareBack(() => {
    if (showRef) { setShowRef(false); return true; }
    handleBack();
    return true;
  });

  const fmtDay = (d?: string) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  // ---------- LIST ----------
  const renderList = () => {
    const done = tests.filter(x => x.status === 'Solved');
    const todo = tests.filter(x => x.status !== 'Solved');
    const shown = filter === 'todo' ? todo : filter === 'done' ? done : tests;
    const chips: { key: Filter; label: string; n: number }[] = [
      { key: 'all', label: t.allTests, n: tests.length },
      { key: 'todo', label: t.toDo, n: todo.length },
      { key: 'done', label: t.completed, n: done.length },
    ];

    return (
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.teal]} tintColor={colors.teal} />}
      >
        <Card dark>
          <View style={styles.heroTop}>
            <Pill label={`${done.length} ${t.ofWord} ${tests.length} ${t.doneWord}`} tone="navy" dot />
            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.navyMuted} />
          </View>
          <Text style={styles.heroLabel}>{t.myTests}</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{todo.length}</Text>
            <Text style={styles.heroUnit}>{t.toDo.toLowerCase()}</Text>
          </View>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${tests.length ? Math.round((done.length / tests.length) * 100) : 0}%` }]} />
          </View>
        </Card>

        <View style={styles.chips}>
          {chips.map(c => (
            <TouchableOpacity key={c.key} style={[styles.chip, filter === c.key && styles.chipOn]} onPress={() => setFilter(c.key)} activeOpacity={0.8}>
              <Text style={[styles.chipText, filter === c.key && styles.chipTextOn]}>{c.label} · {c.n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {shown.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.teal} /></View>
            <Text style={styles.emptyTitle}>{filter === 'all' ? t.noTests : t.allCaughtUp}</Text>
            <Text style={styles.emptySub}>{filter === 'all' ? t.noTestsSub : ''}</Text>
          </View>
        ) : (
          shown.map(item => {
            const solved = item.status === 'Solved';
            const qCount = item.questionCount ?? item.questions?.length ?? 0;
            return (
              <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => openTest(item)} disabled={!!opening}>
                <Card style={styles.testCard}>
                  <View style={styles.testTop}>
                    <View style={[styles.testIcon, solved && { backgroundColor: item.passed === false ? colors.redSoft : colors.greenSoft }]}>
                      <MaterialCommunityIcons
                        name={solved ? (item.passed === false ? 'close-circle-outline' : 'check-circle-outline') : 'clipboard-text-clock-outline'}
                        size={20}
                        color={solved ? (item.passed === false ? colors.red : colors.green) : colors.teal}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testTitle} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.testSub} numberOfLines={1}>{item.course}</Text>
                    </View>
                    {opening === item.id ? <ActivityIndicator color={colors.teal} /> : <MaterialIcons name="chevron-right" size={22} color={colors.faint} />}
                  </View>
                  <View style={styles.testMeta}>
                    <Meta icon="timer-outline" text={`${item.duration} ${t.minutesShort}`} />
                    <Meta icon="format-list-numbered" text={`${qCount} ${language === 'en' && qCount === 1 ? 'question' : t.questionsShort}`} />
                    <Meta icon="star-four-points-outline" text={`${item.totalMarks} ${t.marksShort}`} />
                    <View style={{ marginLeft: 'auto' }}>
                      {solved
                        ? <Pill label={`${item.score} / ${item.maxScore}`} tone={item.passed === false ? 'red' : 'green'} dot />
                        : item.availability === 'upcoming'
                          ? <Pill label={t.upcomingLabel} tone="blue" />
                          : item.availability === 'expired'
                            ? <Pill label={t.expiredLabel} tone="neutral" />
                            : <Pill label={t.statusQueue} tone="amber" />}
                    </View>
                  </View>
                  {!solved && (item.availableFrom || item.availableUntil) ? (
                    <View style={styles.windowRow}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color={colors.muted} />
                      <Text style={styles.windowText}>
                        {item.availability === 'upcoming' && item.availableFrom
                          ? `${t.opensOn} ${fmtDay(item.availableFrom)}`
                          : item.availableUntil
                            ? `${item.availability === 'expired' ? t.expiredLabel : t.availableUntil} ${fmtDay(item.availableUntil)}`
                            : `${t.opensOn} ${fmtDay(item.availableFrom)}`}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.notice}>
          <MaterialIcons name="translate" size={16} color={colors.teal} />
          <Text style={styles.noticeText}>{t.testStrictlyEnglishNotice}</Text>
        </View>
      </ScrollView>
    );
  };

  // ---------- INSTRUCTIONS ----------
  const renderInstructions = () => {
    if (!selected) return null;
    const solved = selected.status === 'Solved';
    const qCount = selected.questions?.length ?? selected.questionCount ?? 0;
    const closedReason = selected.availability === 'upcoming'
      ? `${t.testNotOpenYet} ${t.opensOn} ${fmtDay(selected.availableFrom)}.`
      : selected.availability === 'expired' ? t.testHasExpired : null;
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card dark>
            <View style={styles.heroTop}>
              <Pill label={selected.testFor || 'Test'} tone="navy" dot />
              <Text style={styles.heroId}>{`#${selected.number}`}</Text>
            </View>
            <Text style={styles.heroTitle}>{selected.name}</Text>
            <View style={styles.statRow}>
              <Stat label={t.duration.replace(':', '')} value={`${selected.duration}m`} />
              <View style={styles.statDivider} />
              <Stat label={t.questionsShort} value={String(qCount)} />
              <View style={styles.statDivider} />
              <Stat label={t.marksShort} value={String(selected.totalMarks)} />
              <View style={styles.statDivider} />
              <Stat label={t.passMark} value={String(selected.passingMarks)} />
            </View>
          </Card>

          <Card style={styles.block}>
            <Text style={styles.micro}>{t.instructionsTitle.replace(':', '')}</Text>
            <Text style={styles.body}>{selected.instructions || t.singleAnswerInstruction}</Text>
            {[t.singleAnswerInstruction, t.testStrictlyEnglishNotice, `${selected.duration} ${t.minutesShort} — auto-submits when the timer ends.`].map((line, i) => (
              <View key={i} style={styles.bullet}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.teal} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
            <View style={styles.factRow}><Text style={styles.factKey}>{t.colCourse}</Text><Text style={styles.factVal}>{selected.course}</Text></View>
            {selected.attachment ? (
              <TouchableOpacity style={styles.refRow} onPress={() => setShowRef(true)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.teal} />
                <Text style={styles.refText} numberOfLines={1}>{selected.attachment.name}</Text>
                <MaterialIcons name="visibility" size={18} color={colors.muted} />
              </TouchableOpacity>
            ) : null}
          </Card>

          {solved ? (
            <Card style={styles.block}>
              <Text style={styles.micro}>{t.yourResult}</Text>
              <View style={styles.resultLine}>
                <Text style={styles.resultBig}>{selected.score}<Text style={styles.resultMax}> / {selected.maxScore}</Text></Text>
                <Pill label={selected.passed === false ? t.failed : t.passed} tone={selected.passed === false ? 'red' : 'green'} dot />
              </View>
              <Text style={styles.caption}>{t.alreadyAttempted}</Text>
            </Card>
          ) : null}
        </ScrollView>
        {!solved && closedReason ? (
          <View style={styles.footerBar}>
            <View style={styles.closedBar}>
              <MaterialCommunityIcons name="calendar-lock" size={18} color={colors.muted} />
              <Text style={styles.closedText}>{closedReason}</Text>
            </View>
          </View>
        ) : !solved ? (
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.primaryBtn} onPress={startQuiz} activeOpacity={0.85}>
              <MaterialCommunityIcons name="play-circle-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>{t.startTest}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  // ---------- QUIZ ----------
  const renderQuiz = () => {
    if (!selected || !selected.questions) return null;
    const questions = selected.questions;
    const q = questions[qIndex];
    const chosen = answers[String(q.id)];
    const answeredCount = Object.keys(answers).length;
    const low = secondsLeft <= 60;
    const last = qIndex === questions.length - 1;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.quizBar}>
          <View>
            <Text style={styles.quizCount}>{qIndex + 1} / {questions.length}</Text>
            <Text style={styles.quizSub}>{answeredCount} {t.answered}</Text>
          </View>
          <View style={styles.quizBarRight}>
            {selected.attachment ? (
              <TouchableOpacity style={styles.refBtn} onPress={() => setShowRef(true)}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.teal} />
              </TouchableOpacity>
            ) : null}
            <View style={[styles.timer, low && styles.timerLow]}>
              <MaterialCommunityIcons name="timer-outline" size={16} color={low ? colors.red : colors.ink} />
              <Text style={[styles.timerText, low && { color: colors.red }]}>{formatTimer(secondsLeft)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.quizTrack}><View style={[styles.quizFill, { width: `${((qIndex + 1) / questions.length) * 100}%` }]} /></View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
            {questions.map((qq, i) => {
              const done = answers[String(qq.id)] !== undefined;
              return (
                <TouchableOpacity key={String(qq.id)} onPress={() => setQIndex(i)} style={[styles.dot, done && styles.dotDone, i === qIndex && styles.dotCurrent]}>
                  <Text style={[styles.dotText, (done || i === qIndex) && { color: i === qIndex ? colors.teal : '#fff' }]}>{i + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Card>
            {q.marks ? <Text style={styles.micro}>{q.marks} {t.marksShort}</Text> : null}
            <Text style={styles.question}>{q.question}</Text>
            <View style={{ marginTop: 14 }}>
              {q.options.map((opt, i) => {
                const on = chosen === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => setAnswers(prev => ({ ...prev, [String(q.id)]: i }))}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.optLetter, on && styles.optLetterOn]}>
                      <Text style={[styles.optLetterText, on && { color: '#fff' }]}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={[styles.optText, on && styles.optTextOn]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.footerBar, styles.quizNav]}>
          <TouchableOpacity style={[styles.secondaryBtn, qIndex === 0 && { opacity: 0.4 }]} disabled={qIndex === 0} onPress={() => setQIndex(qIndex - 1)}>
            <MaterialIcons name="arrow-back" size={18} color={colors.ink} />
            <Text style={styles.secondaryBtnText}>{t.previous}</Text>
          </TouchableOpacity>
          {last ? (
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={confirmSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t.submitTest}</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setQIndex(qIndex + 1)}>
              <Text style={styles.primaryBtnText}>{t.next}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ---------- RESULT ----------
  const renderResult = () => {
    if (!result || !selected) return null;
    const review: any[] = result.results || [];
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card dark style={{ alignItems: 'center' }}>
            <View style={[styles.resultBadge, { backgroundColor: result.passed ? colors.green : colors.red }]}>
              <MaterialCommunityIcons name={result.passed ? 'trophy-outline' : 'refresh'} size={28} color="#fff" />
            </View>
            <Text style={styles.heroLabel}>{t.yourScore}</Text>
            <Text style={styles.resultHero}>{result.score}<Text style={styles.resultHeroMax}> / {result.maxScore}</Text></Text>
            <Pill label={result.passed ? t.passed : t.failed} tone={result.passed ? 'green' : 'red'} dot style={{ alignSelf: 'center', marginTop: 8 }} />
            <Text style={styles.resultMeta}>{result.correctCount} / {result.totalQuestions} correct · {t.passMark} {result.passingMarks}</Text>
          </Card>

          {review.length > 0 ? (
            <Card style={styles.block}>
              <Text style={[styles.micro, { marginBottom: 8 }]}>Review</Text>
              {review.map((r, i) => {
                const q = selected.questions?.find(x => String(x.id) === String(r.questionId));
                if (!q) return null;
                return (
                  <View key={String(r.questionId)} style={styles.reviewRow}>
                    <MaterialCommunityIcons name={r.isCorrect ? 'check-circle' : 'close-circle'} size={18} color={r.isCorrect ? colors.green : colors.red} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewQ}>{i + 1}. {q.question}</Text>
                      {!r.isCorrect ? (
                        <Text style={styles.reviewA}>
                          {r.selected !== null && r.selected !== undefined ? `✗ ${q.options[r.selected]}   ` : '— '}
                          <Text style={{ color: colors.green }}>✓ {q.options[r.correctIndex]}</Text>
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}
        </ScrollView>
        <View style={styles.footerBar}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStage('list')}>
            <Text style={styles.primaryBtnText}>{t.backToTests}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t.testModule} subtitle={stage === 'quiz' && selected ? selected.name : traineeName} onBack={handleBack} />
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.teal} /></View>
      ) : stage === 'list' ? renderList() : stage === 'instructions' ? renderInstructions() : stage === 'quiz' ? renderQuiz() : renderResult()}

      <DocumentViewerModal
        visible={showRef}
        topic={selected?.attachment ? {
          id: selected.id,
          title: selected.attachment.name,
          description: `Reference material for ${selected.name}`,
          fileType: 'PDF',
          fileName: selected.attachment.name,
          fileUrl: selected.attachment.url,
          contentSummary: `Reference document for ${selected.name}.`,
          readStatus: true,
        } : null}
        onClose={() => setShowRef(false)}
      />
    </View>
  );
};

const Meta: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.metaItem}>
    <MaterialCommunityIcons name={icon as any} size={14} color={colors.muted} />
    <Text style={styles.metaText}>{text}</Text>
  </View>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 28 },
  block: { marginTop: 14 },
  micro: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.muted },
  body: { fontSize: 14, color: colors.ink2, lineHeight: 21, marginTop: 6 },
  caption: { fontSize: 12, color: colors.muted, marginTop: 6 },

  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroId: { color: colors.navyMuted, fontSize: 12, fontWeight: '700' },
  heroLabel: { marginTop: 16, color: colors.navyMuted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  heroUnit: { color: colors.cyan, fontSize: 15, fontWeight: '800', marginLeft: 6, marginBottom: 6 },
  heroTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 3, backgroundColor: colors.cyan },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 14, letterSpacing: -0.3 },

  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)' },
  statValue: { color: '#fff', fontSize: 17, fontWeight: '800' },
  statLabel: { color: colors.navyMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 3 },

  chips: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.ink2 },
  chipTextOn: { color: '#fff' },

  testCard: { marginBottom: 12, padding: 14 },
  testTop: { flexDirection: 'row', alignItems: 'center' },
  testIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  testTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  testSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  testMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },

  windowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  windowText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  closedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  closedText: { flex: 1, fontSize: 13.5, color: colors.ink2, fontWeight: '600' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.tealSoft, marginTop: 6 },
  noticeText: { flex: 1, fontSize: 12.5, color: colors.tealDark, fontWeight: '600' },

  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  bulletText: { flex: 1, fontSize: 13, color: colors.ink2, lineHeight: 18 },
  factRow: { flexDirection: 'row', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  factKey: { width: 80, fontSize: 12.5, color: colors.muted, fontWeight: '600' },
  factVal: { flex: 1, fontSize: 13.5, color: colors.ink, fontWeight: '500' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  refText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  resultLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  resultBig: { fontSize: 26, fontWeight: '800', color: colors.ink },
  resultMax: { fontSize: 15, color: colors.muted, fontWeight: '600' },

  quizBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface },
  quizCount: { fontSize: 17, fontWeight: '800', color: colors.ink },
  quizSub: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  quizBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 10, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.line },
  timerLow: { backgroundColor: colors.redSoft, borderColor: '#F8D4D4' },
  timerText: { fontSize: 15, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  quizTrack: { height: 3, backgroundColor: colors.line },
  quizFill: { height: '100%', backgroundColor: colors.teal },
  palette: { gap: 8, paddingBottom: 14 },
  dot: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.teal, borderColor: colors.teal },
  dotCurrent: { backgroundColor: colors.surface, borderColor: colors.teal, borderWidth: 2 },
  dotText: { fontSize: 12.5, fontWeight: '800', color: colors.muted },
  question: { fontSize: 17, fontWeight: '700', color: colors.ink, lineHeight: 24, marginTop: 6 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceMuted, marginBottom: 10 },
  optionOn: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  optLetter: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optLetterOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  optLetterText: { fontSize: 13, fontWeight: '800', color: colors.ink2 },
  optText: { flex: 1, fontSize: 14.5, color: colors.ink2, lineHeight: 20 },
  optTextOn: { color: colors.tealDark, fontWeight: '700' },
  quizNav: { flexDirection: 'row', gap: 10 },

  resultBadge: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  resultHero: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 4 },
  resultHeroMax: { color: colors.navyMuted, fontSize: 20, fontWeight: '700' },
  resultMeta: { color: colors.navyMuted, fontSize: 12.5, marginTop: 10 },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  reviewQ: { fontSize: 13.5, color: colors.ink, fontWeight: '600', lineHeight: 19 },
  reviewA: { fontSize: 12.5, color: colors.red, marginTop: 4 },

  footerBar: { padding: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, backgroundColor: colors.teal },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  secondaryBtnText: { color: colors.ink, fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
});
