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
          <ActivityIndicator size="large" color="#0288D1" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar and Identity Card */}
          <View style={styles.identityCard}>
            <View style={styles.avatarBox}>
              <View style={styles.avatarInner}>
                <FontAwesome5 name="user-alt" size={48} color="#0288D1" />
              </View>
            </View>
            <Text style={styles.traineeNameText}>{profile?.traineeInfo.fullName || traineeName}</Text>
            <Text style={styles.traineeCodeText}>{profile?.traineeInfo.ysfCode || 'W2307C00001'}</Text>
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
                  <Text style={[styles.dataValue, { color: '#2E7D32', fontWeight: '700' }]}>
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
                    <MaterialIcons name="verified-user" size={14} color="#10B981" />
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
            <MaterialIcons name="info-outline" size={18} color="#0288D1" />
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
    backgroundColor: '#F5F9FC',
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  identityCard: {
    backgroundColor: '#02A9EA',
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarBox: {
    width: 90,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E1F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  traineeNameText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  traineeCodeText: {
    color: '#E1F5FE',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginHorizontal: 12,
    backgroundColor: '#0288D1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0277BD',
  },
  tabButtonActive: {
    backgroundColor: '#01579B',
  },
  tabButtonText: {
    color: '#E1F5FE',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#01579B',
    marginBottom: 16,
    textAlign: 'center',
  },
  dataRow: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '600',
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 14,
    color: '#263238',
    fontWeight: '700',
  },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    marginHorizontal: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  readOnlyText: {
    color: '#0277BD',
    fontSize: 11.5,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  enrollmentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  enrollmentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  aadhaarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },
  aadhaarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'monospace',
    marginLeft: 6,
  },
});
