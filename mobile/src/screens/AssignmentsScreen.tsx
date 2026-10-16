import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Language, Assignment, SelfAssignment, AssignmentSubmission } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { colors, radius, Card, Pill } from '../theme';

interface AssignmentsScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

type PickedFile = { name: string; size?: string; uri?: string; file?: any; mimeType?: string };
type View_ = 'home' | 'detail' | 'upload' | 'new';

// Answer-file groups the admin can allow → picker MIME types + extensions we check on device
const FILE_GROUPS: Record<string, { label: string; mime: string[]; ext: string[] }> = {
  pdf: { label: 'PDF', mime: ['application/pdf'], ext: ['pdf'] },
  image: { label: 'Image', mime: ['image/*'], ext: ['jpg', 'jpeg', 'png', 'webp', 'heic'] },
  doc: { label: 'Word', mime: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], ext: ['doc', 'docx'] },
  excel: { label: 'Excel', mime: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'], ext: ['xls', 'xlsx', 'csv'] },
  ppt: { label: 'PowerPoint', mime: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], ext: ['ppt', 'pptx'] },
  video: { label: 'Video', mime: ['video/*'], ext: ['mp4', 'mov', 'm4v'] },
};
const MAX_FILES = 3;

const acceptedGroups = (types?: string[]) => (types || []).filter(t => FILE_GROUPS[t]);
const extOf = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';

export const AssignmentsScreen: React.FC<AssignmentsScreenProps> = ({ language, onBack, traineeName }) => {
  const t = getTranslation(language);
  const [view, setView] = useState<View_>('home');
  const [tab, setTab] = useState<'assigned' | 'mine'>('assigned');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [uploads, setUploads] = useState<SelfAssignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [note, setNote] = useState('');
  const [ownName, setOwnName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewer, setViewer] = useState<{ name: string; url: string } | null>(null);

  const load = useCallback(async () => {
    const [asg, mine] = await Promise.all([apiService.getAssignments(), apiService.getSelfAssignments()]);
    setAssignments(asg);
    setUploads(mine);
    setLoading(false);
    setRefreshing(false);
    return asg;
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Assignment', traineeName);
    load();
    return () => {
      screenTimeTracker.onScreenLeave('Assignment', traineeName);
    };
  }, []);

  const resetForm = () => {
    setFiles([]);
    setNote('');
    setOwnName('');
  };

  const handleBack = () => {
    if (view === 'upload') setView('detail');
    else if (view === 'detail' || view === 'new') setView('home');
    else onBack();
  };

  const pickFile = async (types?: string[]) => {
    const groups = acceptedGroups(types);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: groups.length ? groups.flatMap(g => FILE_GROUPS[g].mime) : '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const f = result.assets[0];
      if (groups.length && !groups.some(g => FILE_GROUPS[g].ext.includes(extOf(f.name)))) {
        Alert.alert(t.wrongFileType, `${t.accepts}: ${groups.map(g => FILE_GROUPS[g].label).join(', ')}`);
        return;
      }
      setFiles(prev => [...prev, {
        name: f.name,
        size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : undefined,
        uri: f.uri,
        file: (f as any).file,
        mimeType: f.mimeType,
      }].slice(0, MAX_FILES));
    } catch (err) {
      Alert.alert('Error', 'Could not open the file picker.');
    }
  };

  const uploadAll = async () => {
    const uploaded = [];
    for (const f of files) {
      const up = await apiService.uploadFile(f);
      if (!up) throw new Error(`Could not upload ${f.name}. Please check your connection and try again.`);
      uploaded.push(up);
    }
    return uploaded;
  };

  const submitAnswer = async () => {
    if (!selected) return;
    if (files.length === 0) return Alert.alert(t.answerFiles, t.fileRequired);
    setSubmitting(true);
    try {
      const attachments = await uploadAll();
      const res = await apiService.submitAssignmentReply(selected.id, { text: note.trim(), attachments });
      if (!res.success) throw new Error(res.message);
      const fresh = await load();
      setSelected(fresh.find(a => a.id === selected.id) || selected);
      resetForm();
      setView('detail');
      screenTimeTracker.showToast(res.message);
    } catch (err: any) {
      Alert.alert(t.uploadAnswer, err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitOwn = async () => {
    if (!ownName.trim()) return Alert.alert(t.newAssignment, t.nameRequired);
    if (files.length === 0) return Alert.alert(t.newAssignment, t.fileRequired);
    setSubmitting(true);
    try {
      const attachments = await uploadAll();
      const res = await apiService.submitSelfAssignment({ name: ownName.trim(), text: note.trim(), attachments });
      if (!res.success) throw new Error(res.message);
      await load();
      resetForm();
      setTab('mine');
      setView('home');
      screenTimeTracker.showToast(res.message);
    } catch (err: any) {
      Alert.alert(t.newAssignment, err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- small renderers ----------
  const statusPill = (status: string, sub?: AssignmentSubmission | SelfAssignment | null, max?: number | null) => {
    if (status === 'Graded') {
      const marks = sub && sub.gradedMarks !== undefined && sub.gradedMarks !== null ? `${sub.gradedMarks}${max ? ` / ${max}` : ''}` : t.statusGraded;
      return <Pill label={marks} tone="green" dot />;
    }
    if (status === 'Needs Revision') return <Pill label={t.statusRevise} tone="amber" dot />;
    if (status === 'Submitted' || status === 'Completed') return <Pill label={t.statusSubmitted} tone="blue" dot />;
    if (status === 'Overdue') return <Pill label={t.statusOverdue} tone="red" dot />;
    return <Pill label={t.statusPending} tone="neutral" dot />;
  };

  const fileRow = (f: { name: string; size?: string; url?: string }, i: number, onRemove?: () => void) => (
    <TouchableOpacity
      key={`${f.name}-${i}`}
      style={styles.fileRow}
      activeOpacity={f.url ? 0.7 : 1}
      onPress={() => f.url && setViewer({ name: f.name, url: f.url })}
    >
      <View style={styles.fileIcon}><MaterialCommunityIcons name="file-document-outline" size={18} color={colors.teal} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
        {f.size ? <Text style={styles.fileMeta}>{f.size}</Text> : null}
      </View>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : f.url ? <MaterialIcons name="visibility" size={18} color={colors.muted} /> : null}
    </TouchableOpacity>
  );

  const fileComposer = (types?: string[]) => {
    const groups = acceptedGroups(types);
    return (
      <Card style={styles.block}>
        <Text style={styles.micro}>{t.answerFiles}</Text>
        <Text style={styles.acceptLine}>
          {t.accepts}: {groups.length ? groups.map(g => FILE_GROUPS[g].label).join(', ') : t.anyFileType}
        </Text>
        <View style={{ marginTop: 10 }}>
          {files.map((f, i) => fileRow(f, i, () => setFiles(files.filter((_, j) => j !== i))))}
        </View>
        {files.length < MAX_FILES ? (
          <TouchableOpacity style={styles.dropzone} onPress={() => pickFile(types)} activeOpacity={0.75}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={26} color={colors.teal} />
            <Text style={styles.dropzoneText}>{files.length ? t.addAnotherFile : t.chooseFile}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.micro, { marginTop: 16 }]}>{t.noteOptional}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="…"
          placeholderTextColor={colors.faint}
        />
      </Card>
    );
  };

  const primaryButton = (label: string, onPress: () => void, icon = 'send') => (
    <View style={styles.footerBar}>
      <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} onPress={onPress} disabled={submitting} activeOpacity={0.85}>
        {submitting ? <ActivityIndicator color="#fff" /> : (
          <>
            <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ---------- views ----------
  const renderHome = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.segWrap}>
        <View style={styles.seg}>
          {(['assigned', 'mine'] as const).map(key => (
            <TouchableOpacity key={key} style={[styles.segBtn, tab === key && styles.segBtnOn]} onPress={() => setTab(key)} activeOpacity={0.8}>
              <Text style={[styles.segText, tab === key && styles.segTextOn]}>
                {key === 'assigned' ? `${t.assignedByAdmin} · ${assignments.length}` : `${t.myUploads} · ${uploads.length}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.teal]} tintColor={colors.teal} />}
      >
        {tab === 'assigned' ? (
          assignments.length === 0 ? (
            <Empty icon="file-document-outline" title={t.noAssignments} sub={t.noAssignmentsSub} />
          ) : (
            assignments.map(a => (
              <TouchableOpacity key={a.id} activeOpacity={0.8} onPress={() => { setSelected(a); setView('detail'); }}>
                <Card style={styles.listCard}>
                  <View style={styles.listTop}>
                    <View style={styles.listIcon}><MaterialCommunityIcons name="file-document-edit-outline" size={20} color={colors.blue} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={2}>{a.name}</Text>
                      <Text style={styles.listSub} numberOfLines={1}>{a.course}</Text>
                    </View>
                  </View>
                  <View style={styles.listMeta}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.muted} />
                      <Text style={styles.metaText}>{a.deadlineLabel || a.submissionDate || '—'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="star-four-points-outline" size={14} color={colors.muted} />
                      <Text style={styles.metaText}>{a.marks} {t.marksShort}</Text>
                    </View>
                    <View style={{ marginLeft: 'auto' }}>{statusPill(a.status, a.mySubmission, a.marks)}</View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )
        ) : (
          <>
            <TouchableOpacity activeOpacity={0.85} onPress={() => { resetForm(); setView('new'); }}>
              <Card dark style={styles.newCard}>
                <View style={styles.newIcon}><MaterialCommunityIcons name="plus" size={22} color={colors.navy} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.newTitle}>{t.newAssignment}</Text>
                  <Text style={styles.newSub}>{t.uploadOwnHint}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.navyMuted} />
              </Card>
            </TouchableOpacity>
            {uploads.length === 0 ? (
              <Empty icon="tray-arrow-up" title={t.noUploads} sub={t.noUploadsSub} />
            ) : (
              uploads.map(u => (
                <Card key={u.id} style={styles.listCard}>
                  <View style={styles.listTop}>
                    <View style={[styles.listIcon, { backgroundColor: colors.violetSoft }]}><MaterialCommunityIcons name="tray-arrow-up" size={20} color={colors.violet} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={2}>{u.name}</Text>
                      <Text style={styles.listSub}>{t.submittedOn} · {u.submittedAt}</Text>
                    </View>
                    {statusPill(u.gradeStatus === 'Graded' ? 'Graded' : u.gradeStatus === 'Needs Revision' ? 'Needs Revision' : 'Submitted', u, u.maxMarks)}
                  </View>
                  <View style={{ marginTop: 10 }}>{(u.attachments || []).map((f, i) => fileRow(f, i))}</View>
                  {u.remarks ? <Remarks label={t.remarks} text={u.remarks} /> : null}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderDetail = () => {
    if (!selected) return null;
    const a = selected;
    const sub = a.mySubmission || null;
    const groups = acceptedGroups(a.allowedFileTypes);
    const canSubmit = a.status !== 'Graded';
    const facts: [string, string][] = [
      [t.colCourse, a.course],
      ...(a.scheme ? [['Scheme', a.scheme] as [string, string]] : []),
      ...(a.sector ? [['Sector', a.sector] as [string, string]] : []),
      ...(a.zone ? [['Zone', a.zone] as [string, string]] : []),
      ...(a.industryName ? [['Industry', a.industryName] as [string, string]] : []),
      [t.accepts, groups.length ? groups.map(g => FILE_GROUPS[g].label).join(', ') : t.anyFileType],
    ];

    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card dark>
            <View style={styles.heroTop}>
              {statusPill(a.status, sub, a.marks)}
              <Text style={styles.heroId}>{a.id}</Text>
            </View>
            <Text style={styles.heroTitle}>{a.name}</Text>
            <View style={styles.heroStats}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>{t.deadline}</Text>
                <Text style={styles.heroValue}>{a.deadlineLabel || a.submissionDate || '—'}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>{t.marksShort}</Text>
                <Text style={styles.heroValue}>{a.marks}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.block}>
            {facts.map(([k, v]) => (
              <View key={k} style={styles.factRow}>
                <Text style={styles.factKey}>{k}</Text>
                <Text style={styles.factVal}>{v}</Text>
              </View>
            ))}
            {a.details ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.micro}>{t.instructionsTitle.replace(':', '')}</Text>
                <Text style={styles.body}>{a.details}</Text>
              </View>
            ) : null}
            {a.attachment ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.micro, { marginBottom: 8 }]}>{t.assignmentBrief}</Text>
                {fileRow(a.attachment, 0)}
              </View>
            ) : null}
          </Card>

          {sub ? (
            <Card style={styles.block}>
              <View style={styles.subHead}>
                <Text style={styles.cardTitle}>{t.yourSubmission}</Text>
                {sub.late ? <Pill label={t.lateTag} tone="red" /> : null}
              </View>
              <Text style={styles.caption}>{t.submittedOn} · {sub.submittedAt}</Text>
              <View style={{ marginTop: 10 }}>{(sub.attachments || []).map((f, i) => fileRow(f as any, i))}</View>
              {sub.text ? <Text style={[styles.body, { fontStyle: 'italic' }]}>“{sub.text}”</Text> : null}
              {sub.remarks ? <Remarks label={t.remarks} text={sub.remarks} /> : null}
            </Card>
          ) : null}
        </ScrollView>
        {canSubmit
          ? primaryButton(sub ? t.resubmit : t.uploadAnswer, () => { resetForm(); setView('upload'); }, 'upload')
          : (
            <View style={styles.footerBar}>
              <View style={styles.lockedBar}>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.green} />
                <Text style={styles.lockedText}>{t.gradedLocked}</Text>
              </View>
            </View>
          )}
      </View>
    );
  };

  const renderUpload = () => selected && (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.micro}>{t.uploadAnswer}</Text>
          <Text style={styles.cardTitle}>{selected.name}</Text>
          <Text style={styles.caption}>{t.deadline} · {selected.deadlineLabel || selected.submissionDate || '—'}</Text>
        </Card>
        {fileComposer(selected.allowedFileTypes)}
      </ScrollView>
      {primaryButton(t.submit, submitAnswer)}
    </View>
  );

  const renderNew = () => (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.micro}>{t.enterAssignmentName}</Text>
          <TextInput
            style={styles.input}
            value={ownName}
            onChangeText={setOwnName}
            placeholder={t.assignmentNamePlaceholder}
            placeholderTextColor={colors.faint}
            maxLength={140}
          />
          <Text style={[styles.caption, { marginTop: 8 }]}>{t.uploadOwnHint}</Text>
        </Card>
        {fileComposer()}
      </ScrollView>
      {primaryButton(t.submit, submitOwn)}
    </View>
  );

  const title = view === 'new' ? t.newAssignment : view === 'upload' ? t.uploadAnswer : view === 'detail' ? t.assignmentDetail : t.assignment;

  return (
    <View style={styles.container}>
      <Header title={title} subtitle={traineeName} onBack={handleBack} />
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.teal} /></View>
      ) : view === 'home' ? renderHome() : view === 'detail' ? renderDetail() : view === 'upload' ? renderUpload() : renderNew()}

      <DocumentViewerModal
        visible={!!viewer}
        topic={viewer ? {
          id: viewer.url,
          title: viewer.name,
          description: selected ? selected.name : t.assignment,
          fileType: 'PDF',
          fileName: viewer.name,
          fileUrl: viewer.url,
          contentSummary: '',
          readStatus: true,
        } : null}
        onClose={() => setViewer(null)}
      />
    </View>
  );
};

const Empty: React.FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}><MaterialCommunityIcons name={icon as any} size={26} color={colors.teal} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySub}>{sub}</Text>
  </View>
);

const Remarks: React.FC<{ label: string; text: string }> = ({ label, text }) => (
  <View style={styles.remarks}>
    <Text style={styles.remarksLabel}>{label}</Text>
    <Text style={styles.remarksText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 28 },
  block: { marginTop: 14 },
  micro: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.muted },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 4 },
  caption: { fontSize: 12, color: colors.muted, marginTop: 3 },
  body: { fontSize: 13.5, color: colors.ink2, lineHeight: 20, marginTop: 6 },

  segWrap: { paddingHorizontal: 16, paddingTop: 14 },
  seg: { flexDirection: 'row', backgroundColor: '#E8EBF1', borderRadius: radius.md, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.surface, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segTextOn: { color: colors.teal, fontWeight: '800' },

  listCard: { marginBottom: 12, padding: 14 },
  listTop: { flexDirection: 'row', alignItems: 'center' },
  listIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  listSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  listMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },

  newCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, padding: 14 },
  newIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  newTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  newSub: { color: colors.navyMuted, fontSize: 12, marginTop: 2 },

  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroId: { color: colors.navyMuted, fontSize: 12, fontWeight: '600' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 14, letterSpacing: -0.3 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  heroLabel: { color: colors.navyMuted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 14 },

  factRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  factKey: { width: 110, fontSize: 12.5, color: colors.muted, fontWeight: '600' },
  factVal: { flex: 1, fontSize: 13.5, color: colors.ink, fontWeight: '500' },
  subHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  fileRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, marginBottom: 8 },
  fileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  fileName: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  fileMeta: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  acceptLine: { fontSize: 12.5, color: colors.ink2, marginTop: 4 },
  dropzone: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: radius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, backgroundColor: '#FAFBFD', gap: 6,
  },
  dropzoneText: { fontSize: 13.5, fontWeight: '700', color: colors.teal },
  input: {
    marginTop: 8, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.md, backgroundColor: colors.surface,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  remarks: { marginTop: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.tealSoft },
  remarksLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.teal },
  remarksText: { fontSize: 13, color: colors.tealDark, marginTop: 3, lineHeight: 19 },

  footerBar: { padding: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, backgroundColor: colors.teal },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  lockedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, backgroundColor: colors.greenSoft },
  lockedText: { color: colors.green, fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
});
