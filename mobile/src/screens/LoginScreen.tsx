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
  ActivityIndicator
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Footer } from '../components/Footer';
import { apiService } from '../services/api';
import { ServerConfigModal } from '../components/ServerConfigModal';

interface LoginScreenProps {
  language: Language;
  onLoginSuccess: (trainee: any) => void;
  onChangeInstitute: () => void;
  onTermsPressed: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLoginSuccess,
  onChangeInstitute,
  onTermsPressed,
}) => {
  const t = getTranslation(language);
  const [username, setUsername] = useState('W2307C00001');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverModalVisible, setServerModalVisible] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header & Cloud Server Configurator */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.serverGearBtn}
            onPress={() => setServerModalVisible(true)}
            accessibilityLabel="Cloud Server Settings"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-sharp" size={18} color="#0284C7" />
          </TouchableOpacity>
          <Text style={styles.companyNameText}>{t.companyName}</Text>
          <Text style={styles.lmsSubText}>{t.lmsSubtitle}</Text>
        </View>

        {/* Input Cards */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <View style={styles.inputCard}>
            <FontAwesome name="user" size={22} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder={t.userName}
              placeholderTextColor="#757575"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMsg) setErrorMsg(null);
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputCard}>
            <MaterialIcons name="lock" size={24} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder={t.password}
              placeholderTextColor="#757575"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassLink}>
            <Text style={styles.forgotPassText}>{t.forgotPassword}</Text>
          </TouchableOpacity>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Buttons Stack */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>{t.login}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGuestLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{t.guest}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onChangeInstitute}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{t.changeInstitute}</Text>
          </TouchableOpacity>

          {/* Copyright & Terms */}
          <View style={styles.termsBox}>
            <Text style={styles.copyrightText}>{t.copyright}</Text>
            <TouchableOpacity onPress={onTermsPressed}>
              <Text style={styles.termsText}>{t.termsConditions}</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  companyNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0277BD',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  lmsSubText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#263238',
    marginTop: 6,
  },
  formContainer: {
    width: '100%',
    maxWidth: 310,
    alignItems: 'center',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#607D8B',
    borderRadius: 6,
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  forgotPassLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPassText: {
    color: '#0288D1',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#00A0E3',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  termsBox: {
    alignItems: 'center',
    marginTop: 10,
  },
  copyrightText: {
    color: '#78909C',
    fontSize: 12,
  },
  termsText: {
    color: '#0288D1',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '600',
    marginTop: 4,
  },
});
