import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FooterProps {
  title?: string;
  subtitle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  title = "Learning Management System",
  subtitle = "Powered By Yuvashakti Foundation",
}) => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#0288D1',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitleText: {
    color: '#B3E5FC',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
