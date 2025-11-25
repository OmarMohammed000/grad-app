import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontWeights, Fonts } from '../../constants/theme';
import { ChallengeService, ChallengeTaskCompletion } from '../../services/challenges';
import api from '../../services/api';
import { useTheme } from '@/contexts/ThemeContext';

interface VerificationQueueProps {
  visible?: boolean;
  challengeId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  visible = true,
  challengeId,
  onClose,
  isModal = true,
}) => {
  const theme = useTheme();
  const [verifications, setVerifications] = useState<ChallengeTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<ChallengeTaskCompletion | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (visible || !isModal) {
      loadVerifications();
    }
  }, [visible, isModal]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/challenges/${challengeId}/verifications`);
      console.log('📦 Verifications received:', response.data.verifications);
      console.log('📦 First verification:', JSON.stringify(response.data.verifications[0], null, 2));
      setVerifications(response.data.verifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (completionId: string, status: 'approved' | 'rejected', reason?: string) => {
    setProcessingId(completionId);
    try {
      await api.post(`/challenges/${challengeId}/completions/${completionId}/verify`, {
        status,
        rejectionReason: reason,
      });

      // Remove from list
      setVerifications(prev => prev.filter(v => v.id !== completionId));

      if (status === 'rejected') {
        setRejectModalVisible(false);
        setRejectionReason('');
        setSelectedCompletion(null);
      }
    } catch (error) {
      console.error('Error verifying task:', error);
      Alert.alert('Error', 'Failed to update verification status');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (completion: ChallengeTaskCompletion) => {
    setSelectedCompletion(completion);
    setRejectModalVisible(true);
  };

  const renderItem = ({ item }: { item: ChallengeTaskCompletion }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.challengeTask?.title}</Text>
        <Text style={[styles.points, { color: theme.colors.primary }]}>{item.pointsEarned} pts</Text>
      </View>


      <View style={styles.userRow}>
        <View style={styles.avatarContainer}>
          {item.user?.profile?.avatarUrl ? (
            <Image
              source={{ uri: item.user.profile.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person-circle" size={32} color={theme.colors.textSecondary} />
          )}
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {item.user?.profile?.displayName || 'Unknown User'}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{new Date(item.completedAt).toLocaleDateString()}</Text>
      </View>



      {item.proofImageUrl ? (
        <>
          {console.log('🖼️ Displaying image:', item.proofImageUrl)}
          <Image
            source={{
              uri: item.proofImageUrl,
              headers: {
                'ngrok-skip-browser-warning': 'true'
              }
            }}
            style={styles.proofImage}
            resizeMode="cover"
          />
        </>
      ) : (
        <View style={[styles.noProofContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.noProofText, { color: theme.colors.textSecondary }]}>No image proof provided</Text>
        </View>
      )}


      {item.proof && (
        <Text style={[styles.proofText, { color: theme.colors.text }]}>{item.proof}</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton, { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger + '10' }]}
          onPress={() => openRejectModal(item)}
          disabled={!!processingId}
        >
          <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
          <Text style={[styles.actionText, { color: theme.colors.danger }]}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton, { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '10' }]}
          onPress={() => handleVerify(item.id, 'approved')}
          disabled={!!processingId}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.success} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.actionText, { color: theme.colors.success }]}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isModal && (
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Pending Verifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : verifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>All caught up! No pending verifications.</Text>
        </View>
      ) : (
        <FlatList
          data={verifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Reject Submission</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Please provide a reason for rejection:</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g., Image is blurry, wrong task..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.danger }]}
                onPress={() => selectedCompletion && handleVerify(selectedCompletion.id, 'rejected', rejectionReason)}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  date: {
    fontSize: 12,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  noProofContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  noProofText: {
    fontStyle: 'italic',
  },
  proofText: {
    fontSize: 14,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectButton: {
    // Styles applied inline with theme
  },
  approveButton: {
    // Styles applied inline with theme
  },
  actionText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  input: {
    borderRadius: 8,
    padding: Spacing.md,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    // Styles applied inline with theme
  },
  modalButtonText: {
    fontWeight: '500',
  },
});
