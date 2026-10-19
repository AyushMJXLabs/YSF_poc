import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Language, TechnicalQueryTicket } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { apiService } from '../services/api';
import { colors, radius, shadow } from '../theme';

interface TechnicalQueryScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const TechnicalQueryScreen: React.FC<TechnicalQueryScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Academic' | 'App Technical' | 'OJT Attendance' | 'General'>('Academic');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tickets history state
  const [tickets, setTickets] = useState<TechnicalQueryTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Android hardware back → previous screen instead of closing the app
  useHardwareBack(() => {
    onBack();
    return true;
  });

  // Load support phone and email from environment variables with fallback
  const supportPhone = process.env.EXPO_PUBLIC_YSF_SUPPORT_PHONE || '098810-88850';
  const supportPhoneAlt = process.env.EXPO_PUBLIC_YSF_SUPPORT_PHONE_ALT || '8956537504';
  const supportEmail = process.env.EXPO_PUBLIC_YSF_SUPPORT_EMAIL || 'lmssupport@ysfskills.com';
  const supportEmailAlt = process.env.EXPO_PUBLIC_YSF_SUPPORT_EMAIL_ALT || 'info@ysfskills.com';

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Technical Query', traineeName);
    loadTickets();

    return () => {
      screenTimeTracker.onScreenLeave('Technical Query', traineeName);
    };
  }, []);

  const loadTickets = async () => {
    const data = await apiService.getQueries();
    setTickets(data);
    setLoadingTickets(false);
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber.replace(/[^0-9]/g, '')}`);
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}?subject=Kaushalya%20LMS%20Support%20Request%20-%20${traineeName}`);
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      Alert.alert("Required", "Please enter a query subject.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Required", "Please describe your technical or academic query.");
      return;
    }

    setSubmitting(true);
    const res = await apiService.submitQuery({
      traineeId: apiService.traineeId,
      traineeName,
      ysfCode: apiService.traineeInfo.ysfCode,
      subject: subject.trim(),
      category,
      message: message.trim()
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setSubject('');
      setMessage('');
      Alert.alert(
        "Ticket Submitted",
        "Your query has been logged and synchronized with the Central LMS Admin Control Center. An instructor or admin will reply shortly."
      );
      // Reload tickets
      loadTickets();
    } else {
      Alert.alert("Error", res.message || "Failed to submit query.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching screenshot p19_img0_Image113.jpg */}
      <Header
        title="Yuvashakti Foundation"
        subtitle={traineeName}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* YSF Official Logo Graphic */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/ysf_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Live Helpdesk Ticket Form */}
        <View style={styles.ticketCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <MaterialIcons name="headset-mic" size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Raise a Support Query / Ticket</Text>
              <Text style={styles.cardSub}>Direct bi-directional sync with YSF Admin Desk</Text>
            </View>
          </View>

          {/* Subject */}
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Need clarification on Module 3 assessment"
            placeholderTextColor={colors.faint}
            value={subject}
            onChangeText={setSubject}
          />

          {/* Category Selector */}
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.categoryRow}>
            {(['Academic', 'App Technical', 'OJT Attendance', 'General'] as const).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message */}
          <Text style={styles.inputLabel}>Detailed Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Explain your doubt or technical issue clearly..."
            placeholderTextColor={colors.faint}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitTicket}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Submit Query to Admin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* My Tickets & Admin Responses */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>
            <FontAwesome5 name="history" size={14} color={colors.muted} style={{ marginRight: 6 }} />
            My Query Tickets ({tickets.length})
          </Text>

          {loadingTickets ? (
            <ActivityIndicator size="small" color={colors.teal} style={{ marginVertical: 12 }} />
          ) : tickets.length === 0 ? (
            <Text style={styles.emptyText}>No tickets logged yet. Submit a query above if you need assistance.</Text>
          ) : (
            tickets.map(t => {
              const isReplied = t.status === 'Replied';
              return (
                <View key={t.id} style={styles.ticketItem}>
                  <View style={styles.ticketTopRow}>
                    <Text style={styles.ticketSubject}>{t.subject}</Text>
                    <View style={[styles.statusBadge, isReplied ? styles.badgeReplied : styles.badgeOpen]}>
                      <Text style={[styles.statusBadgeText, isReplied ? styles.statusRepliedText : styles.statusOpenText]}>
                        {t.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ticketMetaRow}>
                    <Text style={styles.ticketCategory}>{t.category}</Text>
                    <Text style={styles.ticketDate}>{t.createdAt}</Text>
                  </View>
                  <Text style={styles.ticketMessage}>"{t.message}"</Text>

                  {/* Official Admin Reply */}
                  {t.reply ? (
                    <View style={styles.replyBox}>
                      <View style={styles.replyHeader}>
                        <MaterialIcons name="admin-panel-settings" size={16} color={colors.green} />
                        <Text style={styles.replyByText}>{t.repliedBy || 'YSF Admin Desk'}</Text>
                        <Text style={styles.replyTimeText}>{t.repliedAt || ''}</Text>
                      </View>
                      <Text style={styles.replyBody}>"{t.reply}"</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Support Cards */}
        <View style={styles.contactList}>
          <Text style={styles.sectionHeader}>Instant Telephonic &amp; Email Helpdesk</Text>
          
          {/* Primary Phone */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleCall(supportPhone)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="call" size={20} color={colors.teal} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t.callUs}</Text>
              <Text style={styles.contactValue}>{supportPhone}</Text>
              <Text style={styles.altValue}>Alt: {supportPhoneAlt}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.faint} />
          </TouchableOpacity>

          <View style={{ height: 8 }} />

          {/* Support Email */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleEmail(supportEmail)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="email" size={20} color={colors.teal} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t.emailUs}</Text>
              <Text style={styles.contactValue}>{supportEmail}</Text>
              <Text style={styles.altValue}>Alt: {supportEmailAlt}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.faint} />
          </TouchableOpacity>
        </View>

        {/* Support Explanation Text */}
        <View style={styles.helpBox}>
          <MaterialIcons name="live-help" size={20} color={colors.teal} />
          <Text style={styles.helpText}>{t.needHelp}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  logoImage: {
    width: 220,
    height: 104,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    marginTop: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  catPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  catPillActive: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
  },
  catPillTextActive: {
    color: colors.teal,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: colors.surface,
    marginTop: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 14,
    lineHeight: 18,
  },
  ticketItem: {
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  badgeOpen: {
    backgroundColor: colors.amberSoft,
  },
  badgeReplied: {
    backgroundColor: colors.greenSoft,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusOpenText: {
    color: colors.amber,
  },
  statusRepliedText: {
    color: colors.green,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  ticketCategory: {
    fontSize: 10.5,
    color: colors.teal,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ticketDate: {
    fontSize: 11,
    color: colors.muted,
  },
  ticketMessage: {
    fontSize: 12.5,
    color: colors.ink2,
    lineHeight: 18,
  },
  replyBox: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyByText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.green,
    marginLeft: 4,
    flex: 1,
  },
  replyTimeText: {
    fontSize: 10.5,
    color: colors.muted,
  },
  replyBody: {
    fontSize: 12.5,
    color: colors.ink2,
    lineHeight: 18,
  },
  contactList: {
    backgroundColor: colors.surface,
    marginTop: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  contactValue: {
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  altValue: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.tealSoft,
    marginTop: 14,
    padding: 14,
    borderRadius: radius.md,
  },
  helpText: {
    fontSize: 12.5,
    color: colors.tealDark,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
});
