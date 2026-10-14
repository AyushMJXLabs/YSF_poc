import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenName, Language } from './src/types';
import { Toast } from './src/components/Toast';
import { LanguageModal } from './src/components/LanguageModal';
import { DrawerSidebar } from './src/components/DrawerSidebar';
import { InstituteCodeScreen } from './src/screens/InstituteCodeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LearningResourcesScreen } from './src/screens/LearningResourcesScreen';
import { AssignmentsScreen } from './src/screens/AssignmentsScreen';
import { TestModuleScreen } from './src/screens/TestModuleScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { NoticesScreen } from './src/screens/NoticesScreen';
import { TechnicalQueryScreen } from './src/screens/TechnicalQueryScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { screenTimeTracker } from './src/services/ScreenTimeTracker';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('INSTITUTE_CODE');
  const [isInstituteValidated, setIsInstituteValidated] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [trainee, setTrainee] = useState({
    id: 'T001',
    fullName: 'KUMARI K',
    ysfCode: 'W2307C00001',
    courseName: 'Diploma in Automotive Manufacturing Technology',
    status: 'Active',
  });

  // Hook up screen time tracker toast callback
  useEffect(() => {
    screenTimeTracker.setToastCallback((msg: string) => {
      setToastMessage(msg);
    });

    // Check language selection & cached institute validation
    const initializeAppState = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('@ysf_language');
        if (!storedLang) {
          // First launch: show language selection pop-up per Page 4 & Page 6 manual instructions
          setShowLanguageModal(true);
        } else {
          setLanguage(storedLang as Language);
        }

        const validated = await AsyncStorage.getItem('@ysf_institute_validated');
        if (validated === 'true') {
          setIsInstituteValidated(true);
          // Optional: remain on LOGIN if already validated
          // setCurrentScreen('LOGIN');
        }
      } catch (err) {
        console.warn('Error reading app storage state:', err);
      }
    };

    initializeAppState();
  }, []);

  const handleLanguageSelect = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('@ysf_language', lang);
    } catch (err) {
      console.warn('Error saving language preference:', err);
    }
  };

  const handleInstituteValidated = async () => {
    setIsInstituteValidated(true);
    await AsyncStorage.setItem('@ysf_institute_validated', 'true');
    setCurrentScreen('LOGIN');
    screenTimeTracker.showToast("Institute Code Validated");
  };

  const handleChangeInstitute = async () => {
    setIsInstituteValidated(false);
    await AsyncStorage.removeItem('@ysf_institute_validated');
    setCurrentScreen('INSTITUTE_CODE');
  };

  const handleLoginSuccess = (traineeData: any) => {
    setTrainee(traineeData);
    setCurrentScreen('DASHBOARD');
    screenTimeTracker.showToast("Welcome to Kaushalya LMS");
  };

  const handleLogout = async () => {
    screenTimeTracker.showToast("Logged out successfully");
    setCurrentScreen('LOGIN');
  };

  const handleShowTerms = () => {
    Alert.alert(
      "Terms and Conditions",
      "YSF Kaushalya LMS Terms:\n\n1. Attendance in offline classes and On-the-Job Training (OJT) must exceed 85%.\n2. Trainees must record daily learnings in their OJT Diary / Logbook.\n3. Content and learning materials are proprietary and downloading to local storage is restricted.\n4. Screen time telemetry is recorded and synced to the administrative panel.\n5. Assessment modules are strictly administered in English.",
      [{ text: "I Understand" }]
    );
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />

      {/* Main Screen Router */}
      <View style={styles.screenWrapper}>
        {currentScreen === 'INSTITUTE_CODE' && (
          <InstituteCodeScreen
            language={language}
            onCodeValidated={handleInstituteValidated}
            onTermsPressed={handleShowTerms}
          />
        )}

        {currentScreen === 'LOGIN' && (
          <LoginScreen
            language={language}
            onLoginSuccess={handleLoginSuccess}
            onChangeInstitute={handleChangeInstitute}
            onTermsPressed={handleShowTerms}
          />
        )}

        {currentScreen === 'DASHBOARD' && (
          <DashboardScreen
            language={language}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onLogout={handleLogout}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'PROFILE' && (
          <ProfileScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'LEARNING_RESOURCES' && (
          <LearningResourcesScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'ASSIGNMENTS' && (
          <AssignmentsScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'TEST_MODULE' && (
          <TestModuleScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'EVENTS' && (
          <EventsScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'NOTICES' && (
          <NoticesScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'TECHNICAL_QUERY' && (
          <TechnicalQueryScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}

        {currentScreen === 'CHANGE_PASSWORD' && (
          <ChangePasswordScreen
            language={language}
            onBack={() => setCurrentScreen('DASHBOARD')}
            traineeName={trainee.fullName}
          />
        )}
      </View>

      {/* Global Navigation Drawer */}
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

      {/* Language Selection Modal (Pop-up on First Launch / Restart) */}
      <LanguageModal
        visible={showLanguageModal}
        currentLanguage={language}
        onSelectLanguage={handleLanguageSelect}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Telemetry Status / Action Toast */}
      <Toast
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0288D1',
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
