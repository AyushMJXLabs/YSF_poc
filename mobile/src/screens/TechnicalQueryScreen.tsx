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
import { apiService } from '../services/api';

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
      traineeId: 'T001',
      traineeName,
      ysfCode: 'W2307C00001',
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
              <MaterialIcons name="headset-mic" size={20} color="#0288D1" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Raise a Support Query / Ticket</Text>
              <Text style={styles.cardSub}>Direct bi-directional sync with YSF Admin Desk</Text>
            </View>
          </View>

          {/* Subject */}
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Need clarification on Module 3 assessment"
            placeholderTextColor="#94A3B8"
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
            placeholderTextColor="#94A3B8"
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
              <ActivityIndicator color="#ffffff" size="small" />
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
            <FontAwesome5 name="history" size={14} color="#475569" style={{ marginRight: 6 }} />
            My Query Tickets ({tickets.length})
          </Text>

          {loadingTickets ? (
            <ActivityIndicator size="small" color="#0288D1" style={{ marginVertical: 12 }} />
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
                        <MaterialIcons name="admin-panel-settings" size={16} color="#059669" />
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
              <MaterialIcons name="call" size={24} color="#0288D1" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t.callUs}</Text>
              <Text style={styles.contactValue}>{supportPhone}</Text>
              <Text style={styles.altValue}>Alt: {supportPhoneAlt}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Support Email */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleEmail(supportEmail)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="email" size={24} color="#0288D1" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t.emailUs}</Text>
              <Text style={styles.contactValue}>{supportEmail}</Text>
              <Text style={styles.altValue}>Alt: {supportEmailAlt}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Support Explanation Text */}
        <View style={styles.helpBox}>
          <MaterialIcons name="live-help" size={22} color="#0288D1" />
          <Text style={styles.helpText}>{t.needHelp}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logoImage: {
    width: 240,
    height: 120,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  catPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0288D1',
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 14,
    shadowColor: '#0288D1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  ticketItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeOpen: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeReplied: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusOpenText: {
    color: '#B45309',
  },
  statusRepliedText: {
    color: '#065F46',
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
    color: '#6366F1',
    fontWeight: '700',
  },
  ticketDate: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  ticketMessage: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  replyBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyByText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
    flex: 1,
  },
  replyTimeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  replyBody: {
    fontSize: 11.5,
    color: '#064E3B',
    lineHeight: 16,
  },
  contactList: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  contactValue: {
    fontSize: 13.5,
    color: '#0288D1',
    fontWeight: '700',
    marginTop: 1,
  },
  altValue: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 14,
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  helpText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
});
