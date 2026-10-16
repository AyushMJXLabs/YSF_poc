import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { colors, radius } from '../theme';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string) => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  visible,
  onClose,
  onSaved
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status: string;
    mongoStatus?: any;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      loadActiveUrl();
      setTestResult(null);
    }
  }, [visible]);

  const loadActiveUrl = async () => {
    const url = await apiService.getApiBaseUrl();
    setCurrentUrl(url);
    setInputUrl(url);
  };

  const handleTestAndSave = async () => {
    if (!inputUrl.trim()) {
      Alert.alert('Required', 'Please enter a valid server URL');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await apiService.testServerConnection(inputUrl.trim());
    setTesting(false);
    setTestResult(result);

    if (result.ok) {
      const savedUrl = await apiService.setCustomApiBaseUrl(inputUrl.trim());
      setCurrentUrl(savedUrl);
      if (onSaved) onSaved(savedUrl);
      Alert.alert(
        'Cloud Server Connected!',
        `Successfully linked to ${savedUrl}\nMongoDB Atlas: ${result.mongoStatus?.connected ? 'Connected (Atlas Cluster)' : 'Local Fallback'}\nLatency: ${result.latencyMs}ms`,
        [{ text: 'OK', onPress: onClose }]
      );
    } else {
      Alert.alert(
        'Connection Warning',
        `Could not verify health check at:\n${inputUrl.trim()}\n\nReason: ${result.error || result.status}\n\nDo you still want to save this URL?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            onPress: async () => {
              const savedUrl = await apiService.setCustomApiBaseUrl(inputUrl.trim());
              setCurrentUrl(savedUrl);
              if (onSaved) onSaved(savedUrl);
              onClose();
            }
          }
        ]
      );
    }
  };

  const handleReset = async () => {
    setTesting(true);
    const def = await apiService.resetApiBaseUrl();
    setTesting(false);
    setCurrentUrl(def);
    setInputUrl(def);
    setTestResult(null);
    Alert.alert('Reset to Cloud Default', `Server reset to: ${def}`);
  };

  const handlePreset = (presetUrl: string) => {
    setInputUrl(presetUrl);
    setTestResult(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="cloud-outline" size={20} color={colors.teal} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.title}>Cloud Server Settings</Text>
                <Text style={styles.subtitle}>Render Production Backend & Atlas Sync</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* Active URL Status Card */}
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>CURRENT ACTIVE ENDPOINT</Text>
              <Text style={styles.statusUrl} numberOfLines={2} ellipsizeMode="middle">
                {currentUrl || 'Detecting...'}
              </Text>
            </View>

            {/* Quick Presets */}
            <Text style={styles.sectionLabel}>QUICK SERVER PRESETS</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePreset('https://ysf-kaushalya-lms.onrender.com/api')}
              >
                <Text style={styles.presetChipText}>☁️ Render Cloud</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePreset(Platform.OS === 'android' ? 'http://10.0.2.2:5002/api' : 'http://localhost:5002/api')}
              >
                <Text style={styles.presetChipText}>💻 Local (5002)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePreset('http://192.168.1.7:5002/api')}
              >
                <Text style={styles.presetChipText}>📶 Local Wi-Fi</Text>
              </TouchableOpacity>
            </View>

            {/* URL Input */}
            <Text style={styles.sectionLabel}>SERVER URL (RENDER / CUSTOM HOST)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="link-outline" size={18} color={colors.faint} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="https://ysf-kaushalya-lms.onrender.com/api"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Test Feedback Result */}
            {testResult && (
              <View style={[
                styles.resultCard,
                testResult.ok ? styles.resultSuccess : styles.resultError
              ]}>
                <View style={styles.resultRow}>
                  <Ionicons
                    name={testResult.ok ? 'checkmark-circle' : 'alert-circle'}
                    size={18}
                    color={testResult.ok ? colors.green : colors.red}
                  />
                  <Text style={[
                    styles.resultTitle,
                    { color: testResult.ok ? colors.green : colors.red }
                  ]}>
                    {testResult.ok ? `Backend Healthy (${testResult.latencyMs}ms)` : 'Connection Check Failed'}
                  </Text>
                </View>

                {testResult.mongoStatus && (
                  <Text style={styles.resultDetails}>
                    {testResult.mongoStatus.connected
                      ? `🟢 MongoDB Atlas: Connected • ${testResult.mongoStatus.dbName || 'ysf_kaushalya_lms'}`
                      : `🟡 Database: Local Disk Fallback`}
                  </Text>
                )}

                {testResult.error && (
                  <Text style={styles.resultErrorText}>{testResult.error}</Text>
                )}
              </View>
            )}

            {/* Info Notice */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={colors.teal} />
              <Text style={styles.infoBannerText}>
                Any custom Render URL entered here is saved directly to your phone. It persists across app restarts!
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              disabled={testing}
            >
              <Text style={styles.resetBtnText}>Reset Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, testing && { opacity: 0.7 }]}
              onPress={handleTestAndSave}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Test &amp; Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17,26,51,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.teal,
    marginTop: 2
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  statusBox: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16
  },
  statusLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.navyMuted,
    letterSpacing: 0.9,
    marginBottom: 6
  },
  statusUrl: {
    fontSize: 12.5,
    fontFamily: mono,
    fontWeight: '600',
    color: colors.cyan
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 2
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    marginBottom: 12
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: colors.ink,
    fontFamily: mono
  },
  resultCard: {
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1
  },
  resultSuccess: {
    backgroundColor: colors.greenSoft,
    borderColor: '#BBF7D0'
  },
  resultError: {
    backgroundColor: colors.redSoft,
    borderColor: '#F9CFD0'
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 6
  },
  resultDetails: {
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 4,
    marginLeft: 24,
    fontWeight: '500'
  },
  resultErrorText: {
    fontSize: 11.5,
    color: colors.red,
    marginTop: 4,
    marginLeft: 24
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.tealDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  resetBtn: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center'
  },
  resetBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink2
  },
  saveBtn: {
    flex: 1.3,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
