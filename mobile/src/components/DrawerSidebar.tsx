import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { ScreenName, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { colors, radius } from '../theme';

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
            <View style={styles.headerRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{traineeName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerCompany}>Yuvashakti Foundation</Text>
                <Text style={styles.userName} numberOfLines={1}>{traineeName}</Text>
              </View>
            </View>
            <View style={styles.codeChip}>
              <View style={styles.codeDot} />
              <Text style={styles.userCode}>{ysfCode}</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
            <Text style={styles.sectionLabel}>Menu</Text>
            {menuItems.map(item => {
              const isActive = currentScreen === item.name;
              const iconColor = isActive ? colors.teal : colors.muted;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleItemPress(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, isActive && styles.menuIconBoxActive]}>
                    {item.iconType === 'material' && (
                      <MaterialIcons name={item.icon as any} size={19} color={iconColor} />
                    )}
                    {item.iconType === 'fa5' && (
                      <FontAwesome5 name={item.icon} size={15} color={iconColor} />
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
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="language" size={19} color={colors.teal} />
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
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.redSoft }]}>
                <MaterialIcons name="power-settings-new" size={19} color={colors.red} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.red, fontWeight: '700' }]}>{t.logout}</Text>
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
    backgroundColor: 'rgba(17,26,51,0.45)',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    height: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: colors.navy,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.navy2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.cyan,
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    color: colors.navyInk,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 3,
  },
  headerCompany: {
    color: colors.navyMuted,
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  codeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 7,
  },
  userCode: {
    color: colors.navyInk,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.faint,
    marginLeft: 8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: colors.tealSoft,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconBoxActive: {
    backgroundColor: colors.surface,
  },
  menuLabel: {
    fontSize: 14,
    color: colors.ink2,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: colors.teal,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 10,
    marginHorizontal: 8,
  },
  logoutItem: {
    marginTop: 2,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: 'center',
  },
  footerVersion: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.faint,
  },
});
