import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, StatusBar, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenName, Language } from './src/types';
import { Toast } from './src/components/Toast';
import { LanguageModal } from './src/components/LanguageModal';
import { DrawerSidebar } from './src/components/DrawerSidebar';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LearningResourcesScreen } from './src/screens/LearningResourcesScreen';
import { AssignmentsScreen } from './src/screens/AssignmentsScreen';
import { TestModuleScreen } from './src/screens/TestModuleScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { NoticesScreen } from './src/screens/NoticesScreen';
import { TechnicalQueryScreen } from './src/screens/TechnicalQueryScreen';
import { screenTimeTracker } from './src/services/ScreenTimeTracker';
import { apiService } from './src/services/api';
import { getTranslation } from './src/i18n/translations';
import { colors } from './src/theme';

type Trainee = {
  id: string;
  fullName: string;
  ysfCode: string;
  courseName: string;
  status: string;
  avatar?: string;
};

export default function App() {
  // Trainees sign in directly — there is no institute-code step any more
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('LOGIN');
  const [language, setLanguage] = useState<Language>('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [trainee, setTrainee] = useState<Trainee>({
    id: 'T001',
    fullName: 'KUMARI K',
    ysfCode: 'W2307C00001',
    courseName: 'Diploma in Automotive Manufacturing Technology',
    status: 'Active',
  });

  useEffect(() => {
    screenTimeTracker.setToastCallback((msg: string) => {
      setToastMessage(msg);
    });

    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('@ysf_language');
        if (!storedLang) {
          setShowLanguageModal(true);
        } else {
          setLanguage(storedLang as Language);
        }
      } catch (err) {
        console.warn('Error reading app storage state:', err);
      }
    })();
  }, []);

  // Android hardware back: screens with their own sub-views handle it first
  // (see useHardwareBack); this is the fallback — any module returns to Home,
  // and on Home a second press within 2s closes the app.
  const screenRef = useRef(currentScreen);
  screenRef.current = currentScreen;
  const lastBackAt = useRef(0);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const screen = screenRef.current;
      if (screen === 'LOGIN') return false;
      if (screen !== 'DASHBOARD') {
        setCurrentScreen('DASHBOARD');
        return true;
      }
      const now = Date.now();
      if (now - lastBackAt.current < 2000) return false;
      lastBackAt.current = now;
      setToastMessage(getTranslation(language).pressBackAgainToExit);
      return true;
    });
    return () => sub.remove();
  }, [language]);

  const handleLanguageSelect = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('@ysf_language', lang);
    } catch (err) {
      console.warn('Error saving language preference:', err);
    }
  };

  const handleLoginSuccess = (traineeData: any) => {
    const next = { ...traineeData, avatar: traineeData.avatar ? apiService.rewriteFileUrl(traineeData.avatar) : undefined };
    setTrainee(next);
    apiService.setTrainee(next);
    setCurrentScreen('DASHBOARD');
    screenTimeTracker.showToast('Welcome to Kaushalya LMS');
  };

  const handleLogout = async () => {
    screenTimeTracker.showToast('Logged out successfully');
    setCurrentScreen('LOGIN');
  };

  const handleShowTerms = () => {
    Alert.alert(
      'Terms and Conditions',
      'YSF Kaushalya LMS Terms:\n\n1. Attendance in offline classes and On-the-Job Training (OJT) must exceed 85%.\n2. Trainees must record daily learnings in their OJT Diary / Logbook.\n3. Content and learning materials are proprietary and downloading to local storage is restricted.\n4. Screen time telemetry is recorded and synced to the administrative panel.\n5. Assessment modules are strictly administered in English.',
      [{ text: 'I Understand' }]
    );
  };

  const goHome = () => setCurrentScreen('DASHBOARD');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.rootContainer} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

        <View style={styles.screenWrapper}>
          {currentScreen === 'LOGIN' && (
            <LoginScreen language={language} onLoginSuccess={handleLoginSuccess} onTermsPressed={handleShowTerms} />
          )}

          {currentScreen === 'DASHBOARD' && (
            <DashboardScreen
              language={language}
              onNavigate={(screen) => setCurrentScreen(screen)}
              onOpenDrawer={() => setDrawerOpen(true)}
              onLogout={handleLogout}
              traineeName={trainee.fullName}
              ysfCode={trainee.ysfCode}
              avatarUrl={trainee.avatar}
            />
          )}

          {currentScreen === 'PROFILE' && (
            <ProfileScreen
              language={language}
              onBack={goHome}
              traineeName={trainee.fullName}
              onAvatarChange={(url: string) => setTrainee(prev => ({ ...prev, avatar: url }))}
            />
          )}

          {currentScreen === 'LEARNING_RESOURCES' && (
            <LearningResourcesScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}

          {currentScreen === 'ASSIGNMENTS' && (
            <AssignmentsScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}

          {currentScreen === 'TEST_MODULE' && (
            <TestModuleScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}

          {currentScreen === 'EVENTS' && (
            <EventsScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}

          {currentScreen === 'NOTICES' && (
            <NoticesScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}

          {currentScreen === 'TECHNICAL_QUERY' && (
            <TechnicalQueryScreen language={language} onBack={goHome} traineeName={trainee.fullName} />
          )}
        </View>

        <DrawerSidebar
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          language={language}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onLogout={handleLogout}
          traineeName={trainee.fullName}
          ysfCode={trainee.ysfCode}
        />

        <LanguageModal
          visible={showLanguageModal}
          currentLanguage={language}
          onSelectLanguage={handleLanguageSelect}
          onClose={() => setShowLanguageModal(false)}
        />

        <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
