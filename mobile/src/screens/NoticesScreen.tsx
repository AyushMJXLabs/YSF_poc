import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Language, NoticeItem } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { colors, radius, shadow, Pill } from '../theme';

interface NoticesScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const NoticesScreen: React.FC<NoticesScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotices = useCallback(async () => {
    const data = await apiService.getNotices();
    setNotices(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Notice', traineeName);
    loadNotices();

    return () => {
      screenTimeTracker.onScreenLeave('Notice', traineeName);
    };
  }, [loadNotices]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotices();
  };

  return (
    <View style={styles.container}>
      <Header
        title={t.notice}
        subtitle={traineeName}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} tintColor={colors.teal} />}
        >
          {notices.map((n) => {
            const isImportant = n.starColor === 'red';
            return (
              <TouchableOpacity
                key={n.id}
                style={styles.noticeItem}
                onPress={() => setSelectedNotice(n)}
                activeOpacity={0.7}
              >
                <View style={[styles.noticeIconTile, { backgroundColor: isImportant ? colors.redSoft : colors.tealSoft }]}>
                  <MaterialIcons name="campaign" size={20} color={isImportant ? colors.red : colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.noticeTopRow}>
                    <Text style={styles.noticeTitle} numberOfLines={2}>{n.title}</Text>
                    <FontAwesome
                      name="star"
                      size={14}
                      color={isImportant ? colors.red : colors.green}
                      style={styles.starIcon}
                    />
                  </View>
                  <Text style={styles.noticeExcerpt} numberOfLines={2}>
                    {n.content}
                  </Text>
                  <View style={styles.dateAndStar}>
                    <Pill label={n.date} tone={isImportant ? 'red' : 'neutral'} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Full Notice Modal Detail */}
      <Modal
        visible={selectedNotice !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMicro}>Notice</Text>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedNotice?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedNotice(null)} style={styles.modalCloseIcon}>
                <MaterialIcons name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalMetaRow}>
              <Pill label={String(selectedNotice?.fullDate || selectedNotice?.date || '')} tone="red" />
              <Text style={styles.modalAuthor}>Issued by: YSF Central Academic Admin</Text>
            </View>

            <ScrollView style={styles.modalBodyScroll}>
              <Text style={styles.modalContentText}>{selectedNotice?.content}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedNotice(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 32,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  noticeIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.1,
    flex: 1,
  },
  dateAndStar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  starIcon: {
    marginLeft: 10,
    marginTop: 2,
  },
  noticeExcerpt: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,26,51,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  modalMicro: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.teal,
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 10,
  },
  modalCloseIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 12,
  },
  modalAuthor: {
    fontSize: 11,
    color: colors.muted,
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  modalBodyScroll: {
    maxHeight: 220,
    marginBottom: 18,
  },
  modalContentText: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 22,
  },
  modalCloseBtn: {
    backgroundColor: colors.teal,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
