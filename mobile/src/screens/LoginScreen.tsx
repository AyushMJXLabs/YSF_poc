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
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Footer } from '../components/Footer';
import { apiService } from '../services/api';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { colors, radius, shadow } from '../theme';

interface LoginScreenProps {
  language: Language;
  onLoginSuccess: (trainee: any) => void;
  onTermsPressed: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLoginSuccess,
  onTermsPressed,
}) => {
  const t = getTranslation(language);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<'user' | 'pass' | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMsg(t.loginError);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await apiService.login(username.trim(), password);
    setLoading(false);

    if (res.success && res.trainee) {
      onLoginSuccess(res.trainee);
    } else {
      setErrorMsg(res.message || t.loginError);
    }
  };

  const handleGuestLogin = () => {
    // Guest access defaults to standard trainee view
    onLoginSuccess({
      id: 'T001',
      ysfCode: 'W2307C00001',
      fullName: 'KUMARI K (Guest)',
      courseName: 'Diploma in Automotive Manufacturing Technology',
      status: 'Active'
    });
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t.forgotPassword,
      "Please contact YSF LMS technical support at 098810-88850 or lmssupport@ysfskills.com with your YSF Code to reset your password.",
      [{ text: t.ok }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header & Cloud Server Configurator */}
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

        <View style={styles.topHeader}>
          <Text style={styles.lmsSubText}>{t.lmsSubtitle}</Text>
          <Text style={styles.companyNameText}>{t.companyName}</Text>
        </View>

        {/* Input Card */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <Text style={styles.inputLabel}>{t.userName}</Text>
          <View style={[styles.inputCard, focusedField === 'user' && styles.inputCardFocused]}>
            <FontAwesome name="user" size={18} color={focusedField === 'user' ? colors.teal : colors.faint} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder={t.userName}
              placeholderTextColor={colors.faint}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMsg) setErrorMsg(null);
              }}
              onFocus={() => setFocusedField('user')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>{t.password}</Text>
          <View style={[styles.inputCard, focusedField === 'pass' && styles.inputCardFocused]}>
            <MaterialIcons name="lock" size={19} color={focusedField === 'pass' ? colors.teal : colors.faint} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder={t.password}
              placeholderTextColor={colors.faint}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMsg) setErrorMsg(null);
              }}
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassLink}>
            <Text style={styles.forgotPassText}>{t.forgotPassword}</Text>
          </TouchableOpacity>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={colors.red} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Buttons Stack */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>{t.login}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleGuestLogin}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>{t.guest}</Text>
          </TouchableOpacity>

        </View>

        {/* Copyright & Terms */}
        <View style={styles.termsBox}>
          <Text style={styles.copyrightText}>{t.copyright}</Text>
          <TouchableOpacity onPress={onTermsPressed}>
            <Text style={styles.termsText}>{t.termsConditions}</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
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
  topHeader: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 20,
  },
  lmsSubText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.teal,
  },
  companyNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  formContainer: {
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
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 4,
    marginBottom: 14,
  },
  inputCardFocused: {
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  forgotPassLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
  },
  forgotPassText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    color: colors.red,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.teal,
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  termsBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  copyrightText: {
    color: colors.muted,
    fontSize: 12,
  },
  termsText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});
