import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Language, FullProfile } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { colors, radius, shadow } from '../theme';

interface ProfileScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'info' | 'course' | 'other'>('info');
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Profile', traineeName);

    const fetchProfile = async () => {
      const data = await apiService.getProfile();
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();

    return () => {
      screenTimeTracker.onScreenLeave('Profile', traineeName);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t.studentProfile} onBack={onBack} />

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar and Identity Card */}
          <View style={styles.identityCard}>
            <View style={styles.identityRow}>
              <View style={styles.avatarBox}>
                <View style={styles.avatarInner}>
                  <FontAwesome5 name="user-alt" size={26} color={colors.cyan} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.identityMicro}>{t.studentProfile}</Text>
                <Text style={styles.traineeNameText} numberOfLines={2}>{profile?.traineeInfo.fullName || traineeName}</Text>
                <Text style={styles.traineeCodeText}>{profile?.traineeInfo.ysfCode || 'W2307C00001'}</Text>
              </View>
            </View>
            <View style={styles.enrollmentStatusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.enrollmentStatusText}>Active &bull; In OJT Training</Text>
            </View>
          </View>

          {/* Three Tab Buttons matching screenshots */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'info' && styles.tabButtonActive]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'info' && styles.tabButtonTextActive]}>
                {t.tabTraineeInfo}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'course' && styles.tabButtonActive]}
              onPress={() => setActiveTab('course')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'course' && styles.tabButtonTextActive]}>
                {t.tabCourseInfo}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'other' && styles.tabButtonActive]}
              onPress={() => setActiveTab('other')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'other' && styles.tabButtonTextActive]}>
                {t.tabOtherInfo}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Box */}
          <View style={styles.detailsCard}>
            {activeTab === 'info' && (
              <View>
                <Text style={styles.sectionHeader}>{t.tabTraineeInfo}</Text>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.ysfCode}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.ysfCode}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.studentFullName}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.fullName}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.schemeName}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.schemeName}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.sectorName}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.sectorName}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.industryPartner}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.industryPartner}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.zoneName}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.zoneName}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.locationName}</Text>
                  <Text style={styles.dataValue}>{profile?.traineeInfo.locationName}</Text>
                </View>
              </View>
            )}

            {activeTab === 'course' && (
              <View>
                <Text style={styles.sectionHeader}>{t.tabCourseInfo}</Text>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.courseName}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.courseName}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.jobRoleAssigned}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.jobRoleAssigned}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.sectorSkillCouncil}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.sectorSkillCouncil}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.nsqLevel}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.nsqLevel}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.registrationDate}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.registrationDate}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.endDate}</Text>
                  <Text style={styles.dataValue}>{profile?.courseInfo.endDate}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.presentOJT}</Text>
                  <Text style={[styles.dataValue, { color: colors.green, fontWeight: '700' }]}>
                    {profile?.courseInfo.presentOJT}
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'other' && (
              <View>
                <Text style={styles.sectionHeader}>{t.tabOtherInfo}</Text>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.nativeAddress}</Text>
                  <Text style={styles.dataValue}>{profile?.otherInfo.nativeAddress}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.contact1}</Text>
                  <Text style={styles.dataValue}>{profile?.otherInfo.contact1}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.contact2}</Text>
                  <Text style={styles.dataValue}>{profile?.otherInfo.contact2}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.email}</Text>
                  <Text style={styles.dataValue}>{profile?.otherInfo.email}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t.aadharNumber}</Text>
                  <View style={styles.aadhaarBadge}>
                    <MaterialIcons name="verified-user" size={14} color={colors.green} />
                    <Text style={styles.aadhaarText}>
                      {profile?.otherInfo.aadharNumber || 'XXXX-XXXX-8921'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Read-Only Notice Box */}
          <View style={styles.readOnlyBox}>
            <MaterialIcons name="info-outline" size={18} color={colors.teal} />
            <Text style={styles.readOnlyText}>{t.profileReadOnlyNotice}</Text>
          </View>
        </ScrollView>
      )}
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
    paddingBottom: 40,
  },
  identityCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navy2,
    padding: 18,
    ...shadow,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.navy2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityMicro: {
    color: colors.navyMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  traineeNameText: {
    color: colors.navyInk,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  traineeCodeText: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 3,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#E7EAF0',
    borderRadius: radius.md,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButtonText: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: colors.teal,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    marginTop: 14,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  dataRow: {
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  dataLabel: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '600',
  },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealSoft,
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
  },
  readOnlyText: {
    color: colors.tealDark,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  enrollmentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.14)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    marginTop: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  enrollmentStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#4ADE80',
  },
  aadhaarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  aadhaarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: 'monospace',
    marginLeft: 6,
  },
});
