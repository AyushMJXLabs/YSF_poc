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
  Alert,
  StatusBar
} from 'react-native';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Footer } from '../components/Footer';
import { apiService } from '../services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { colors, radius, shadow } from '../theme';

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
  const [focused, setFocused] = useState(false);

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

  const sectors = [
    'EDUCATION',
    'HR SERVICES',
    'COUNSELLING & TRAINING',
    'SKILL DEVELOPMENT',
    'WORKFORCE PROJECTS',
    'APPRENTICESHIP & OJT',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top bar & Cloud Server Configurator */}
        <View style={styles.topBar}>
          <View style={styles.brandTile}>
            <MaterialIcons name="school" size={22} color={colors.cyan} />
          </View>
          <TouchableOpacity
            style={styles.serverGearBtn}
            onPress={() => setServerModalVisible(true)}
            accessibilityLabel="Cloud Server Settings"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-sharp" size={18} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Hero: Titles + Sector chips */}
        <View style={styles.heroCard}>
          <Text style={styles.lmsSub}>{t.lmsHeader}</Text>
          <Text style={styles.skillSchoolText}>{t.skillSchool}</Text>
          <View style={styles.sectorWrap}>
            {sectors.map((sector) => (
              <View key={sector} style={styles.wedge}>
                <Text style={styles.wedgeText}>{sector}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Institute Code Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>{t.enterInstituteCode}</Text>
          <View style={[styles.inputCard, focused && styles.inputCardFocused]}>
            <MaterialIcons name="apartment" size={19} color={focused ? colors.teal : colors.faint} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.inputField}
              placeholder={t.enterInstituteCode}
              placeholderTextColor={colors.faint}
              keyboardType="numeric"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                if (errorMessage) setErrorMessage(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={10}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={colors.red} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.doneButton, loading && { opacity: 0.75 }]}
            onPress={handleValidate}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.doneButtonText}>{loading ? 'Validating...' : t.done}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createInstituteButton}
            onPress={() => Alert.alert("YSF Admin", "To create or register a new institute, please contact YSF support at 098810-88850.")}
            activeOpacity={0.8}
          >
            <Text style={styles.createInstituteText}>{t.createInstitute}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onTermsPressed} style={styles.termsLink}>
          <Text style={styles.termsText}>{t.termsConditions}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverGearBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navy2,
    padding: 20,
    marginBottom: 14,
    ...shadow,
  },
  lmsSub: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.navyMuted,
  },
  skillSchoolText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navyInk,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  sectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  wedge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  wedgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.cyan,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    ...shadow,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 4,
  },
  inputCardFocused: {
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 12,
  },
  errorText: {
    color: colors.red,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  doneButton: {
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  termsLink: {
    marginTop: 18,
  },
  termsText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  createInstituteButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  createInstituteText: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: '700',
  },
});
