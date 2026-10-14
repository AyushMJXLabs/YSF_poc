import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Language } from '../types';

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
          <Text style={styles.dialogTitle}>Choose Language</Text>

          {/* Option: English */}
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setSelected('en')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, selected === 'en' && styles.radioOuterSelected]}>
              {selected === 'en' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>English</Text>
          </TouchableOpacity>

          {/* Option: Marathi */}
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setSelected('mr')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, selected === 'mr' && styles.radioOuterSelected]}>
              {selected === 'mr' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>मराठी</Text>
          </TouchableOpacity>

          {/* OK Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleConfirm} style={styles.okButton}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#757575',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioOuterSelected: {
    borderColor: '#0288D1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0288D1',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  okButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  okButtonText: {
    color: '#0288D1',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
