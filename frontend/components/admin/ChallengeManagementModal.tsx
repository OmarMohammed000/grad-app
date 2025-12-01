import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import adminService, { ChallengeCreateData } from '@/services/admin';
import Toast from 'react-native-toast-message';

interface ChallengeManagementModalProps {
  isVisible: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
  challengeToEdit?: any; // If provided, we're in edit mode
}

export default function ChallengeManagementModal({
  isVisible,
  onClose,
  onChallengeCreated,
  challengeToEdit
}: ChallengeManagementModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'competitive' | 'collaborative'>('competitive');
  const [goalType, setGoalType] = useState<'task_count' | 'total_xp'>('task_count');
  const [goalTarget, setGoalTarget] = useState('10');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +1 week
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [xpReward, setXpReward] = useState('100');
  const [verificationType, setVerificationType] = useState<'none' | 'manual' | 'ai'>('none');

  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !goalTarget || !xpReward) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields'
      });
      return;
    }

    if (endDate <= startDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'End date must be after start date'
      });
      return;
    }

    setLoading(true);
    try {
      const challengeData: ChallengeCreateData = {
        title,
        description,
        challengeType,
        goalType,
        goalTarget: parseInt(goalTarget),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        difficultyLevel,
        xpReward: parseInt(xpReward),
        verificationType,
        isPublic: true,
        isGlobal: true,
      };

      if (challengeToEdit) {
        await adminService.updateGlobalChallenge(challengeToEdit.id, challengeData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Challenge updated successfully'
        });
      } else {
        await adminService.createGlobalChallenge(challengeData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Challenge created successfully'
        });
      }

      onChallengeCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error saving challenge:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to save challenge'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setChallengeType('competitive');
    setGoalType('task_count');
    setGoalTarget('10');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setDifficultyLevel('intermediate');
    setXpReward('100');
    setVerificationType('none');
  };

  const renderLabel = (text: string, required = false) => (
    <Text style={[styles.label, { color: theme.colors.text }]}>
      {text} {required && <Text style={{ color: theme.colors.danger }}>*</Text>}
    </Text>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {challengeToEdit ? 'Edit Challenge' : 'Create Global Challenge'}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>

            <View style={styles.formGroup}>
              {renderLabel('Title', true)}
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                placeholder="Ex: 30 Days of Code"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              {renderLabel('Description', true)}
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                placeholder="Describe the challenge..."
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                {renderLabel('Type')}
                <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
                  <TouchableOpacity
                    style={[styles.pickerOption, challengeType === 'competitive' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setChallengeType('competitive')}
                  >
                    <Text style={[styles.pickerText, { color: challengeType === 'competitive' ? '#fff' : theme.colors.text }]}>Compete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, challengeType === 'collaborative' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setChallengeType('collaborative')}
                  >
                    <Text style={[styles.pickerText, { color: challengeType === 'collaborative' ? '#fff' : theme.colors.text }]}>Collab</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                {renderLabel('Difficulty')}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.chip,
                        { backgroundColor: difficultyLevel === level ? theme.colors.primary : theme.colors.card, marginRight: 8 }
                      ]}
                      onPress={() => setDifficultyLevel(level)}
                    >
                      <Text style={{ color: difficultyLevel === level ? '#fff' : theme.colors.text, fontSize: 12 }}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                {renderLabel('Goal Type')}
                <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
                  <TouchableOpacity
                    style={[styles.pickerOption, goalType === 'task_count' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setGoalType('task_count')}
                  >
                    <Text style={[styles.pickerText, { color: goalType === 'task_count' ? '#fff' : theme.colors.text }]}>Tasks</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, goalType === 'total_xp' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setGoalType('total_xp')}
                  >
                    <Text style={[styles.pickerText, { color: goalType === 'total_xp' ? '#fff' : theme.colors.text }]}>XP</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                {renderLabel('Target', true)}
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                  placeholder="10"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              {renderLabel('XP Reward', true)}
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                placeholder="100"
                placeholderTextColor={theme.colors.textSecondary}
                value={xpReward}
                onChangeText={setXpReward}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              {renderLabel('Verification Type')}
              <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
                {(['none', 'manual', 'ai'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pickerOption, verificationType === type && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setVerificationType(type)}
                  >
                    <Text style={[styles.pickerText, { color: verificationType === type ? '#fff' : theme.colors.text }]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Dates Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Duration</Text>

            <View style={styles.formGroup}>
              {renderLabel('Start Date')}
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              {renderLabel('End Date')}
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    overflow: 'hidden',
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
  },
});
