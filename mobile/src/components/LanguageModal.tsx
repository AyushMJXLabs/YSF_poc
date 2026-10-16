import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Language } from '../types';
import { colors, radius } from '../theme';

interface LanguageModalProps {
  visible: boolean;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  visible,
  currentLanguage,
  onSelectLanguage,
  onClose,
}) => {
  const [selected, setSelected] = useState<Language>(currentLanguage);

  const handleConfirm = () => {
    onSelectLanguage(selected);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.dialogMicro}>Preferences</Text>
          <Text style={styles.dialogTitle}>Choose Language</Text>

          {/* Option: English */}
          <TouchableOpacity
            style={[styles.radioRow, selected === 'en' && styles.radioRowSelected]}
            onPress={() => setSelected('en')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, selected === 'en' && styles.radioOuterSelected]}>
              {selected === 'en' && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioLabel, selected === 'en' && styles.radioLabelSelected]}>English</Text>
          </TouchableOpacity>

          {/* Option: Marathi */}
          <TouchableOpacity
            style={[styles.radioRow, selected === 'mr' && styles.radioRowSelected]}
            onPress={() => setSelected('mr')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, selected === 'mr' && styles.radioOuterSelected]}>
              {selected === 'mr' && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioLabel, selected === 'mr' && styles.radioLabelSelected]}>मराठी</Text>
          </TouchableOpacity>

          {/* OK Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleConfirm} style={styles.okButton} activeOpacity={0.85}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17,26,51,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  dialogMicro: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.teal,
    marginBottom: 4,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    marginBottom: 8,
  },
  radioRowSelected: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: colors.teal,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.teal,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.ink2,
    fontWeight: '600',
  },
  radioLabelSelected: {
    color: colors.ink,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 12,
  },
  okButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
