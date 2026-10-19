import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
  /** Shows the trainee avatar (initial or photo) on the right when no rightAction is given. */
  avatarName?: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  showMenu = false,
  onMenu,
  rightAction,
  avatarName,
  avatarUrl,
  onAvatarPress,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [avatarUrl]);

  const leftIcon = showMenu ? 'menu' : showBack ? 'arrow-back' : null;
  const onLeft = showMenu ? onMenu : onBack;

  const renderRight = () => {
    if (rightAction) return rightAction;
    if (avatarName || avatarUrl) {
      return (
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8} disabled={!onAvatarPress}>
          <View style={styles.avatar}>
            {avatarUrl && !imgFailed ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} onError={() => setImgFailed(true)} />
            ) : (
              <Text style={styles.avatarText}>{(avatarName || '?').trim().charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.squareBtnGhost} />;
  };

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.contentRow}>
        {leftIcon ? (
          <TouchableOpacity onPress={onLeft} style={styles.squareBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
            <MaterialIcons name={leftIcon as any} size={22} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.squareBtnGhost} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        <View style={styles.rightSection}>{renderRight()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.surface,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  squareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareBtnGhost: { width: 40, height: 40 },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  titleText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleText: {
    color: colors.teal,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rightSection: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
