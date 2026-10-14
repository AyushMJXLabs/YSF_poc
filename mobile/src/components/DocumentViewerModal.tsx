import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LearningTopic } from '../types';

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
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>{topic.title}</Text>
            <Text style={styles.headerBadge}>
              {topic.fileType} Document &bull; Protected In-App Viewer
            </Text>
          </View>
          <View style={styles.securityBadge}>
            <MaterialIcons name="lock" size={16} color="#B3E5FC" />
          </View>
        </View>

        {/* Anti-Download Constraint Banner */}
        <View style={styles.protectedBanner}>
          <MaterialIcons name="security" size={16} color="#D32F2F" />
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
                  color="#ffffff"
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
                        size={14}
                        color="#ffffff"
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
                    <MaterialIcons name="chevron-left" size={24} color={currentSlideIndex === 0 ? "#BDBDBD" : "#0288D1"} />
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
                    <MaterialIcons name="chevron-right" size={24} color={currentSlideIndex === slides.length - 1 ? "#BDBDBD" : "#0288D1"} />
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
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#0288D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerBadge: {
    color: '#E1F5FE',
    fontSize: 11,
    marginTop: 2,
  },
  securityBadge: {
    padding: 4,
  },
  protectedBanner: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  protectedText: {
    color: '#C62828',
    fontSize: 11,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 380,
    justifyContent: 'space-between',
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
    backgroundColor: '#0288D1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slideTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  fileName: {
    color: '#757575',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 14,
  },
  slideBody: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 24,
    flex: 1,
  },
  watermarkBox: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
  },
  watermarkText: {
    color: '#BDBDBD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  watermarkSub: {
    color: '#E0E0E0',
    fontSize: 9,
    marginTop: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: '#0288D1',
    fontWeight: '600',
    fontSize: 14,
  },
  navBtnTextDisabled: {
    color: '#BDBDBD',
  },
  pageIndicator: {
    color: '#616161',
    fontWeight: '700',
    fontSize: 13,
  },
  videoPlayerContainer: {
    flex: 1,
    padding: 16,
  },
  videoScreen: {
    backgroundColor: '#1A1A24',
    height: 240,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  videoStatusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  videoDurationText: {
    color: '#90CAF9',
    fontSize: 12,
    marginTop: 4,
  },
  videoInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  videoInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  videoInfoDesc: {
    fontSize: 13,
    color: '#616161',
    marginTop: 6,
    lineHeight: 18,
  },
  videoWatermark: {
    marginTop: 16,
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
  },
});
