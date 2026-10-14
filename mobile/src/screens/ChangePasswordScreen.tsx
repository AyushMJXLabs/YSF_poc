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
          {/* Old Password */}
          <Text style={styles.inputLabel}>{t.oldPassword}</Text>
          <TextInput
            style={styles.underlineInput}
            placeholder={t.oldPassword}
            placeholderTextColor="#B0BEC5"
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
            style={styles.underlineInput}
            placeholder={t.newPassword}
            placeholderTextColor="#B0BEC5"
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
            style={styles.underlineInput}
            placeholder={t.confirmPassword}
            placeholderTextColor="#B0BEC5"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(txt) => {
              setConfirmPassword(txt);
              if (errorMsg) setErrorMsg(null);
            }}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* CHANGE PASSWORD Button matching screenshot p20_img0_Image121.jpg */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#424242" />
            ) : (
              <Text style={styles.submitButtonText}>CHANGE PASSWORD</Text>
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
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 24,
  },
  formContainer: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 16,
  },
  underlineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#90A4AE',
    fontSize: 16,
    color: '#212121',
    paddingVertical: 8,
    marginBottom: 10,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#CFD8DC', // light grey matching screenshot p20_img0_Image121.jpg
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 36,
  },
  submitButtonText: {
    color: '#37474F',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
