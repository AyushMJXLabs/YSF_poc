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
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0288D1"]} />}
        >
          {notices.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.noticeItem}
              onPress={() => setSelectedNotice(n)}
              activeOpacity={0.7}
            >
              <View style={styles.noticeTopRow}>
                <Text style={styles.noticeTitle}>{n.title}</Text>
                <View style={styles.dateAndStar}>
                  <Text style={styles.dateRedText}>{n.date}</Text>
                  <FontAwesome
                    name="star"
                    size={16}
                    color={n.starColor === 'red' ? '#E53935' : '#43A047'}
                    style={styles.starIcon}
                  />
                </View>
              </View>
              <Text style={styles.noticeExcerpt} numberOfLines={2}>
                {n.content}
              </Text>
            </TouchableOpacity>
          ))}
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
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedNotice?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedNotice(null)}>
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalMetaRow}>
              <Text style={styles.modalDate}>{selectedNotice?.fullDate || selectedNotice?.date}</Text>
              <Text style={styles.modalAuthor}>Issued by: YSF Central Academic Admin</Text>
            </View>

            <ScrollView style={styles.modalBodyScroll}>
              <Text style={styles.modalContentText}>{selectedNotice?.content}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedNotice(null)}
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
    backgroundColor: '#FAFAFA',
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 10,
  },
  noticeItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
  },
  noticeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
  },
  dateAndStar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRedText: {
    color: '#E53935', // red date matching screenshot p18_img1_Image108.jpg
    fontSize: 13,
    fontWeight: '600',
  },
  starIcon: {
    marginLeft: 10,
  },
  noticeExcerpt: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    flex: 1,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },
  modalAuthor: {
    fontSize: 11,
    color: '#757575',
  },
  modalBodyScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  modalContentText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  modalCloseBtn: {
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
