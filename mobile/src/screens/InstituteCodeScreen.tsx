import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Footer } from '../components/Footer';
import { apiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ServerConfigModal } from '../components/ServerConfigModal';

interface InstituteCodeScreenProps {
  language: Language;
  onCodeValidated: () => void;
  onTermsPressed: () => void;
}

export const InstituteCodeScreen: React.FC<InstituteCodeScreenProps> = ({
  language,
  onCodeValidated,
  onTermsPressed,
}) => {
  const t = getTranslation(language);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverModalVisible, setServerModalVisible] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      setErrorMessage(t.invalidInstituteCode);
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const res = await apiService.validateInstitute(code.trim());
    setLoading(false);

    if (res.success) {
      onCodeValidated();
    } else {
      setErrorMessage(res.message || t.invalidInstituteCode);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Titles & Cloud Server Configurator */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.serverGearBtn}
            onPress={() => setServerModalVisible(true)}
            accessibilityLabel="Cloud Server Settings"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-sharp" size={18} color="#0284C7" />
          </TouchableOpacity>
          <Text style={styles.skillSchoolText}>{t.skillSchool}</Text>
          <Text style={styles.lmsSub}>{t.lmsHeader}</Text>
        </View>

        {/* Circular Wheel Graphic Simulation */}
        <View style={styles.wheelWrapper}>
          <View style={styles.wheelCircle}>
            {/* Sector wedges */}
            <View style={[styles.wedge, styles.wedgeTop]}>
              <Text style={styles.wedgeText}>EDUCATION</Text>
            </View>
            <View style={[styles.wedge, styles.wedgeTopRight]}>
              <Text style={styles.wedgeText}>HR SERVICES</Text>
            </View>
            <View style={[styles.wedge, styles.wedgeRight]}>
              <Text style={styles.wedgeText}>COUNSELLING & TRAINING</Text>
            </View>
            <View style={[styles.wedge, styles.wedgeBottomRight]}>
              <Text style={styles.wedgeText}>SKILL DEVELOPMENT</Text>
            </View>
            <View style={[styles.wedge, styles.wedgeBottomLeft]}>
              <Text style={styles.wedgeText}>WORKFORCE PROJECTS</Text>
            </View>
            <View style={[styles.wedge, styles.wedgeLeft]}>
              <Text style={styles.wedgeText}>APPRENTICESHIP & OJT</Text>
            </View>

            {/* Institute Code Input box inside / overlay */}
            <View style={styles.inputCard}>
              <TextInput
                style={styles.inputField}
                placeholder={t.enterInstituteCode}
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                maxLength={10}
              />
            </View>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsArea}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleValidate}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.doneButtonText}>{loading ? 'VALIDATING...' : t.done}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onTermsPressed} style={styles.termsLink}>
            <Text style={styles.termsText}>{t.termsConditions}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createInstituteButton}
            onPress={() => Alert.alert("YSF Admin", "To create or register a new institute, please contact YSF support at 098810-88850.")}
            activeOpacity={0.8}
          >
            <Text style={styles.createInstituteText}>{t.createInstitute}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Manual-accurate Footer */}
      <Footer title={t.lmsHeader} subtitle={t.poweredBy} />

      {/* In-App Cloud Server Configurator Modal */}
      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF6FB',
  },
  serverGearBtn: {
    position: 'absolute',
    top: -5,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    zIndex: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  skillSchoolText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#15314B',
    letterSpacing: 1.5,
  },
  lmsSub: {
    fontSize: 16,
    fontWeight: '500',
    color: '#37474F',
    marginTop: 4,
  },
  wheelWrapper: {
    width: 280,
    height: 280,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelCircle: {
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 6,
    borderColor: '#B3E5FC',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wedge: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wedgeTop: {
    top: 15,
    backgroundColor: '#E0F2F1',
  },
  wedgeTopRight: {
    top: 55,
    right: 15,
    backgroundColor: '#EDE7F6',
  },
  wedgeRight: {
    bottom: 75,
    right: 10,
    backgroundColor: '#FFF3E0',
  },
  wedgeBottomRight: {
    bottom: 20,
    backgroundColor: '#FCE4EC',
  },
  wedgeBottomLeft: {
    bottom: 75,
    left: 10,
    backgroundColor: '#FFEBEE',
  },
  wedgeLeft: {
    top: 55,
    left: 10,
    backgroundColor: '#E1F5FE',
  },
  wedgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#37474F',
    textAlign: 'center',
  },
  inputCard: {
    width: 210,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#455A64',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  inputField: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263238',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 10,
    maxWidth: 300,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsArea: {
    width: '100%',
    maxWidth: 290,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButton: {
    backgroundColor: '#00A0E3',
    width: '55%',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  termsLink: {
    marginVertical: 12,
  },
  termsText: {
    color: '#1E88E5',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  createInstituteButton: {
    backgroundColor: '#00A0E3',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  createInstituteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
