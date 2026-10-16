import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

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
    backgroundColor: colors.navy,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleText: {
    color: colors.navyInk,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitleText: {
    color: colors.navyMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
