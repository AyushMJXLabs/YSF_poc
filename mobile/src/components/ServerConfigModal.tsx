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
                <Ionicons name="cloud-outline" size={20} color="#0284C7" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.title}>Cloud Server Settings</Text>
                <Text style={styles.subtitle}>Render Production Backend & Atlas Sync</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
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
              <Ionicons name="link-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="https://ysf-kaushalya-lms.onrender.com/api"
                placeholderTextColor="#94A3B8"
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
                    color={testResult.ok ? '#10B981' : '#EF4444'}
                  />
                  <Text style={[
                    styles.resultTitle,
                    { color: testResult.ok ? '#065F46' : '#991B1B' }
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
              <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC'
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  statusUrl: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    color: '#0284C7'
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 12
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  resultCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1
  },
  resultSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  resultError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6
  },
  resultDetails: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 4,
    marginLeft: 24,
    fontWeight: '500'
  },
  resultErrorText: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 4,
    marginLeft: 24
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 10
  },
  infoBannerText: {
    fontSize: 11,
    color: '#0369A1',
    marginLeft: 6,
    flex: 1,
    lineHeight: 15
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center'
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
