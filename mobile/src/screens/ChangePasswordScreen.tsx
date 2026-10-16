import React, { useState, useEffect } from 'react';
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
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { screenTimeTracker } from '../services/ScreenTimeTracker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

interface ChangePasswordScreenProps {
  language: Language;
  onBack: () => void;
  traineeName: string;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  language,
  onBack,
  traineeName,
}) => {
  const t = getTranslation(language);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'old' | 'new' | 'confirm' | null>(null);

  useEffect(() => {
    screenTimeTracker.onScreenEnter('Change Password', traineeName);
    // Show manual-accurate status toast per screenshot p20_img0_Image121.jpg
    screenTimeTracker.showToast(t.toastStatusOk);

    return () => {
      screenTimeTracker.onScreenLeave('Change Password', traineeName);
    };
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(t.passwordMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await apiService.changePassword(oldPassword, newPassword);
    setLoading(false);

    if (res.success) {
      Alert.alert("Success", t.passwordChangedSuccess, [
        { text: t.ok, onPress: onBack }
      ]);
    } else {
      setErrorMsg(res.message || "Failed to change password.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header
        title={t.changePassword}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <MaterialIcons name="vpn-key" size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMicro}>Security</Text>
              <Text style={styles.cardTitle}>{t.changePassword}</Text>
            </View>
          </View>
          {/* Old Password */}
          <Text style={styles.inputLabel}>{t.oldPassword}</Text>
          <TextInput
            style={[styles.underlineInput, focusedField === 'old' && styles.inputFocused]}
            placeholder={t.oldPassword}
            placeholderTextColor={colors.faint}
            onFocus={() => setFocusedField('old')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            value={oldPassword}
            onChangeText={(txt) => {
              setOldPassword(txt);
              if (errorMsg) setErrorMsg(null);
            }}
          />

          {/* New Password */}
          <Text style={styles.inputLabel}>{t.newPassword}</Text>
          <TextInput
            style={[styles.underlineInput, focusedField === 'new' && styles.inputFocused]}
            placeholder={t.newPassword}
            placeholderTextColor={colors.faint}
            onFocus={() => setFocusedField('new')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            value={newPassword}
            onChangeText={(txt) => {
              setNewPassword(txt);
              if (errorMsg) setErrorMsg(null);
            }}
          />

          {/* Confirm Password */}
          <Text style={styles.inputLabel}>{t.confirmPassword}</Text>
          <TextInput
            style={[styles.underlineInput, focusedField === 'confirm' && styles.inputFocused]}
            placeholder={t.confirmPassword}
            placeholderTextColor={colors.faint}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(txt) => {
              setConfirmPassword(txt);
              if (errorMsg) setErrorMsg(null);
            }}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={colors.red} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardMicro: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.teal,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
    marginTop: 16,
  },
  underlineInput: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 16,
  },
  errorText: {
    color: colors.red,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
