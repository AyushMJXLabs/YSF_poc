import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LearningTopic } from '../types';
import { colors, radius, shadow } from '../theme';

interface DocumentViewerModalProps {
  visible: boolean;
  topic: LearningTopic | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  topic,
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!topic) return null;

  const slides = topic.slides || [
    { slideNo: 1, title: topic.title, text: topic.contentSummary }
  ];

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Protected Document Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>{topic.title}</Text>
            <Text style={styles.headerBadge}>
              {topic.fileType} Document &bull; Protected In-App Viewer
            </Text>
          </View>
          <View style={styles.securityBadge}>
            <MaterialIcons name="lock" size={16} color={colors.teal} />
          </View>
        </View>

        {/* Anti-Download Constraint Banner */}
        <View style={styles.protectedBanner}>
          <MaterialIcons name="security" size={16} color={colors.red} />
          <Text style={styles.protectedText}>
            Protected Resource: Local file download is strictly disabled per YSF policy.
          </Text>
        </View>

        {/* Document Content View */}
        <View style={styles.contentArea}>
          {topic.fileType === 'VIDEO' ? (
            <View style={styles.videoPlayerContainer}>
              <View style={styles.videoScreen}>
                <Ionicons
                  name={isVideoPlaying ? "pause-circle" : "play-circle"}
                  size={72}
                  color={colors.cyan}
                  onPress={() => setIsVideoPlaying(!isVideoPlaying)}
                />
                <Text style={styles.videoStatusText}>
                  {isVideoPlaying ? "Video Streaming Live..." : "Tap to Play Video Stream"}
                </Text>
                <Text style={styles.videoDurationText}>Duration: {topic.videoDuration || "14:20"}</Text>
              </View>
              <View style={styles.videoInfoCard}>
                <Text style={styles.videoInfoTitle}>{topic.title}</Text>
                <Text style={styles.videoInfoDesc}>{topic.description}</Text>
                <Text style={styles.videoWatermark}>Trainee: KUMARI K | ID: W2307C00001</Text>
              </View>
            </View>
          ) : (
            <View style={styles.readerContainer}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Slide / Page Header */}
                <View style={styles.slideCard}>
                  <View style={styles.slideHeader}>
                    <View style={styles.slideTag}>
                      <FontAwesome5
                        name={topic.fileType === 'PDF' ? "file-pdf" : "file-powerpoint"}
                        size={12}
                        color={colors.teal}
                      />
                      <Text style={styles.slideTagText}>
                        {topic.fileType === 'PDF' ? `Page ${currentSlideIndex + 1} of ${slides.length}` : `Slide ${currentSlideIndex + 1} of ${slides.length}`}
                      </Text>
                    </View>
                    <Text style={styles.fileName}>{topic.fileName}</Text>
                  </View>

                  <Text style={styles.slideTitle}>{slides[currentSlideIndex].title}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.slideBody}>{slides[currentSlideIndex].text}</Text>

                  {/* Watermark overlay */}
                  <View style={styles.watermarkBox}>
                    <Text style={styles.watermarkText}>CONFIDENTIAL - YSF KAUSHALYA LMS</Text>
                    <Text style={styles.watermarkSub}>W2307C00001 - DO NOT DISTRIBUTE</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Slide / Page Controls */}
              {slides.length > 1 && (
                <View style={styles.controlsBar}>
                  <TouchableOpacity
                    style={[styles.navBtn, currentSlideIndex === 0 && styles.navBtnDisabled]}
                    onPress={handlePrevSlide}
                    disabled={currentSlideIndex === 0}
                  >
                    <MaterialIcons name="chevron-left" size={24} color={currentSlideIndex === 0 ? colors.faint : colors.teal} />
                    <Text style={[styles.navBtnText, currentSlideIndex === 0 && styles.navBtnTextDisabled]}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    {currentSlideIndex + 1} / {slides.length}
                  </Text>

                  <TouchableOpacity
                    style={[styles.navBtn, currentSlideIndex === slides.length - 1 && styles.navBtnDisabled]}
                    onPress={handleNextSlide}
                    disabled={currentSlideIndex === slides.length - 1}
                  >
                    <Text style={[styles.navBtnText, currentSlideIndex === slides.length - 1 && styles.navBtnTextDisabled]}>Next</Text>
                    <MaterialIcons name="chevron-right" size={24} color={currentSlideIndex === slides.length - 1 ? colors.faint : colors.teal} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerBadge: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  securityBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  protectedBanner: {
    backgroundColor: colors.redSoft,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  protectedText: {
    color: colors.red,
    fontSize: 11.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  readerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    padding: 16,
  },
  slideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 380,
    justifyContent: 'space-between',
    ...shadow,
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slideTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  slideTagText: {
    color: colors.teal,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  fileName: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: 'monospace',
    flexShrink: 1,
    marginLeft: 8,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 14,
  },
  slideBody: {
    fontSize: 15,
    color: colors.ink2,
    lineHeight: 24,
    flex: 1,
  },
  watermarkBox: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: 'center',
  },
  watermarkText: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  watermarkSub: {
    color: colors.lineStrong,
    fontSize: 9,
    marginTop: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: colors.teal,
    fontWeight: '700',
    fontSize: 14,
  },
  navBtnTextDisabled: {
    color: colors.faint,
  },
  pageIndicator: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  videoPlayerContainer: {
    flex: 1,
    padding: 16,
  },
  videoScreen: {
    backgroundColor: colors.navy,
    height: 240,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  videoStatusText: {
    color: colors.navyInk,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  videoDurationText: {
    color: colors.navyMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  videoInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  videoInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  videoInfoDesc: {
    fontSize: 13.5,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  videoWatermark: {
    marginTop: 16,
    fontSize: 10.5,
    color: colors.faint,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
