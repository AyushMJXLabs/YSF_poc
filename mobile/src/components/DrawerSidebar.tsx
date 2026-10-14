import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { ScreenName, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface DrawerSidebarProps {
  visible: boolean;
  onClose: () => void;
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  language: Language;
  onOpenLanguageModal: () => void;
  onLogout: () => void;
  traineeName: string;
  ysfCode: string;
}

export const DrawerSidebar: React.FC<DrawerSidebarProps> = ({
  visible,
  onClose,
  currentScreen,
  onNavigate,
  language,
  onOpenLanguageModal,
  onLogout,
  traineeName,
  ysfCode,
}) => {
  const t = getTranslation(language);

  const menuItems: { name: ScreenName; label: string; icon: string; iconType: 'material' | 'ionicons' | 'fa5' }[] = [
    { name: 'DASHBOARD', label: 'Home Dashboard', icon: 'dashboard', iconType: 'material' },
    { name: 'LEARNING_RESOURCES', label: t.learningResource, icon: 'book', iconType: 'material' },
    { name: 'ASSIGNMENTS', label: t.assignment, icon: 'assignment', iconType: 'material' },
    { name: 'TEST_MODULE', label: t.testModule, icon: 'clipboard-list', iconType: 'fa5' },
    { name: 'EVENTS', label: t.events, icon: 'calendar-today', iconType: 'material' },
    { name: 'NOTICES', label: t.notice, icon: 'notifications', iconType: 'material' },
    { name: 'PROFILE', label: t.profile, icon: 'person', iconType: 'material' },
    { name: 'TECHNICAL_QUERY', label: t.technicalQuery, icon: 'headset-mic', iconType: 'material' },
    { name: 'CHANGE_PASSWORD', label: t.changePassword, icon: 'vpn-key', iconType: 'material' },
  ];

  const handleItemPress = (screen: ScreenName) => {
    onNavigate(screen);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.drawerContent}>
          {/* Header Profile Box */}
          <View style={styles.drawerHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{traineeName.charAt(0)}</Text>
            </View>
            <Text style={styles.userName}>{traineeName}</Text>
            <Text style={styles.userCode}>{ysfCode}</Text>
            <Text style={styles.headerCompany}>Yuvashakti Foundation</Text>
          </View>

          {/* Navigation Links */}
          <ScrollView style={styles.menuScroll}>
            {menuItems.map(item => {
              const isActive = currentScreen === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleItemPress(item.name)}
                >
                  <View style={styles.menuIconBox}>
                    {item.iconType === 'material' && (
                      <MaterialIcons name={item.icon as any} size={22} color={isActive ? '#0288D1' : '#616161'} />
                    )}
                    {item.iconType === 'fa5' && (
                      <FontAwesome5 name={item.icon} size={18} color={isActive ? '#0288D1' : '#616161'} />
                    )}
                  </View>
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.divider} />

            {/* Language Switcher Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onOpenLanguageModal();
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="language" size={22} color="#0288D1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Change Language</Text>
                <Text style={styles.subLabel}>Current: {language === 'en' ? 'English' : 'मराठी'}</Text>
              </View>
            </TouchableOpacity>

            {/* Logout Option */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                onClose();
                onLogout();
              }}
            >
              <View style={styles.menuIconBox}>
                <MaterialIcons name="power-settings-new" size={22} color="#D32F2F" />
              </View>
              <Text style={[styles.menuLabel, { color: '#D32F2F', fontWeight: '700' }]}>{t.logout}</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.drawerFooter}>
            <Text style={styles.footerVersion}>Kaushalya LMS v1.0.0 (YSF)</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#0288D1',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E1F5FE',
  },
  avatarText: {
    color: '#0288D1',
    fontSize: 26,
    fontWeight: '800',
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userCode: {
    color: '#E1F5FE',
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  headerCompany: {
    color: '#B3E5FC',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuScroll: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemActive: {
    backgroundColor: '#E1F5FE',
    borderLeftWidth: 4,
    borderLeftColor: '#0288D1',
  },
  menuIconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#0288D1',
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 11,
    color: '#757575',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  logoutItem: {
    marginTop: 4,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
  },
  footerVersion: {
    fontSize: 11,
    color: '#9E9E9E',
  },
});
