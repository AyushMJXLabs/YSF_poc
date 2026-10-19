import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Language, TraineeProfile, ProfileSection } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { colors, radius, Card, Pill } from '../theme';

interface ProfileScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
  /** Called with the new picture URL after a successful upload so the app header can refresh. */
  onAvatarChange?: (url: string) => void;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp'];
const extOf = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';

const SECTION_ICON: Record<ProfileSection['key'], { icon: string; fg: string; bg: string }> = {
  trainee: { icon: 'account-outline', fg: colors.blue, bg: colors.blueSoft },
  course: { icon: 'school-outline', fg: colors.teal, bg: colors.tealSoft },
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ language, onBack, traineeName, onAvatarChange }) => {
  const t = getTranslation(language);
  const labels = t as unknown as Record<string, string | undefined>;
  const [profile, setProfile] = useState<TraineeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiService.getProfile();
      setProfile(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Profile', traineeName);
    load();
    return () => {
      screenTimeTracker.onScreenLeave('Profile', traineeName);
    };
  }, []);

  // Android hardware back → previous screen instead of closing the app
  useHardwareBack(() => {
    onBack();
    return true;
  });

  const pickPhoto = async () => {
    if (uploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const f = result.assets[0];
      const isImage = (f.mimeType || '').startsWith('image/') || IMAGE_EXT.includes(extOf(f.name));
      if (!isImage) {
        Alert.alert(t.changePhoto, 'Please choose an image file (JPG or PNG).');
        return;
      }
      if (f.size && f.size > MAX_PHOTO_BYTES) {
        Alert.alert(t.changePhoto, 'This image is larger than 5 MB. Please choose a smaller picture.');
        return;
      }
      setUploading(true);
      const res = await apiService.setProfilePicture({
        uri: f.uri,
        name: f.name,
        mimeType: f.mimeType,
        file: (f as any).file,
        size: f.size,
      });
      if (!res.success || !res.avatar) {
        Alert.alert(t.changePhoto, res.message || 'Could not update the picture.');
        return;
      }
      const url = res.avatar;
      setProfile(p => (p ? { ...p, avatar: url } : p));
      onAvatarChange?.(url);
      screenTimeTracker.showToast(t.photoUpdated);
    } catch (err) {
      Alert.alert(t.changePhoto, 'Could not open the file picker.');
    } finally {
      setUploading(false);
    }
  };

  const name = profile?.fullName || traineeName;
  const status = profile?.status || 'Active';
  const statusTone = status === 'Active' ? 'navy' : status === 'Completed' ? 'blue' : 'red';
  const sections = (profile?.sections || []).filter(s => s.key === 'trainee' || s.key === 'course');

  const sectionTitle = (s: ProfileSection) => (s.key === 'trainee' ? t.traineeInformation : s.key === 'course' ? t.courseDetails : s.title);

  return (
    <View style={styles.container}>
      <Header title={t.profile} subtitle={traineeName} onBack={onBack} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[colors.teal]}
              tintColor={colors.teal}
            />
          }
        >
          {/* Identity hero */}
          <Card dark style={styles.hero}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} disabled={uploading} style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {profile?.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{(name || '?').trim().charAt(0).toUpperCase()}</Text>
                )}
                {uploading ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : null}
              </View>
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera" size={14} color={colors.navy} />
              </View>
            </TouchableOpacity>

            <Text style={styles.heroName} numberOfLines={2}>{name}</Text>
            <Text style={styles.heroCode}>{profile?.ysfCode || ''}</Text>
            <Pill label={status} tone={statusTone as any} dot style={styles.heroPill} />

            <TouchableOpacity style={styles.changeBtn} onPress={pickPhoto} disabled={uploading} activeOpacity={0.8}>
              <MaterialCommunityIcons name="image-edit-outline" size={16} color={colors.cyan} />
              <Text style={styles.changeBtnText}>{t.changePhoto}</Text>
            </TouchableOpacity>
          </Card>

          {/* Trainee Information + Course Details */}
          {sections.map(section => {
            const ic = SECTION_ICON[section.key] || SECTION_ICON.trainee;
            return (
              <Card key={section.key} style={styles.block}>
                <View style={styles.sectionHead}>
                  <View style={[styles.tile, { backgroundColor: ic.bg }]}>
                    <MaterialCommunityIcons name={ic.icon as any} size={19} color={ic.fg} />
                  </View>
                  <Text style={styles.sectionTitle}>{sectionTitle(section)}</Text>
                </View>
                {section.fields.map((field, i) => (
                  <View key={field.key} style={[styles.fieldRow, i === section.fields.length - 1 && styles.fieldRowLast]}>
                    <Text style={styles.fieldLabel}>{labels[field.key] ?? field.label}</Text>
                    <Text style={styles.fieldValue}>{field.value || '—'}</Text>
                  </View>
                ))}
              </Card>
            );
          })}

          {/* Read-only notice */}
          {profile?.notice ? (
            <View style={styles.notice}>
              <MaterialCommunityIcons name="information-outline" size={17} color={colors.amber} />
              <Text style={styles.noticeText}>{profile.notice}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const AVATAR = 92;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  block: { marginTop: 14 },

  hero: { alignItems: 'center', paddingVertical: 22 },
  avatarWrap: { width: AVATAR, height: AVATAR },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.navy2,
    borderWidth: 3,
    borderColor: 'rgba(155,231,242,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: colors.cyan, fontSize: 36, fontWeight: '800' },
  avatarOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17,26,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cyan,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 14, letterSpacing: -0.3, textAlign: 'center' },
  heroCode: { color: colors.navyMuted, fontSize: 13, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },
  heroPill: { alignSelf: 'center', marginTop: 10 },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155,231,242,0.35)',
    backgroundColor: 'rgba(155,231,242,0.08)',
  },
  changeBtnText: { color: colors.cyan, fontSize: 13, fontWeight: '700' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  fieldRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  fieldRowLast: { borderBottomWidth: 0, paddingBottom: 2 },
  fieldLabel: { width: 128, fontSize: 12.5, color: colors.muted, fontWeight: '600' },
  fieldValue: { flex: 1, fontSize: 13.5, color: colors.ink, fontWeight: '600', textAlign: 'right' },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
  },
  noticeText: { flex: 1, fontSize: 12.5, color: colors.amber, lineHeight: 18, fontWeight: '600' },
});
