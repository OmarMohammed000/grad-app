import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Input, Button, DatePicker } from '@/components/form';
import { ChallengeTask, AddChallengeTaskData } from '@/services/challenges';

interface ChallengeTaskFormModalProps {
  visible: boolean;
  challengeId: string;
  existingTasks?: ChallengeTask[];
  task?: ChallengeTask | null;
  onClose: () => void;
  onSubmit: (data: AddChallengeTaskData) => Promise<void>;
}

const TASK_TYPES: Array<{ label: string; value: 'required' | 'optional' | 'bonus' }> = [
  { label: 'Required', value: 'required' },
  { label: 'Optional', value: 'optional' },
  { label: 'Bonus', value: 'bonus' },
];

const DIFFICULTIES: Array<{ label: string; value: 'easy' | 'medium' | 'hard' | 'extreme' }> = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Extreme', value: 'extreme' },
];

export function ChallengeTaskFormModal({
  visible,
  challengeId,
  existingTasks = [],
  task,
  onClose,
  onSubmit,
}: ChallengeTaskFormModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<'required' | 'optional' | 'bonus'>('required');
  const [pointValue, setPointValue] = useState('');
  const [xpReward, setXpReward] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium');
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [maxCompletions, setMaxCompletions] = useState('');
  const [tags, setTags] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);
  const [proofInstructions, setProofInstructions] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [availableFrom, setAvailableFrom] = useState<string | undefined>();
  const [availableUntil, setAvailableUntil] = useState<string | undefined>();
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTaskType(task.taskType || 'required');
      setPointValue(String(task.pointValue || 1));
      setXpReward(String(task.xpReward || 10));
      setDifficulty(task.difficulty || 'medium');
      setIsRepeatable(task.isRepeatable || false);
      setMaxCompletions(task.maxCompletions ? String(task.maxCompletions) : '');
      setTags(task.tags?.join(', ') || '');
      setRequiresProof(task.requiresProof || false);
      setProofInstructions(task.proofInstructions || '');
      setEstimatedDuration(task.estimatedDuration ? String(task.estimatedDuration) : '');
      setAvailableFrom(task.availableFrom);
      setAvailableUntil(task.availableUntil);
      setPrerequisites(task.prerequisites || []);
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setTaskType('required');
      setPointValue('1');
      setXpReward('10');
      setDifficulty('medium');
      setIsRepeatable(false);
      setMaxCompletions('');
      setTags('');
      setRequiresProof(false);
      setProofInstructions('');
      setEstimatedDuration('');
      setAvailableFrom(undefined);
      setAvailableUntil(undefined);
      setPrerequisites([]);
    }
    setErrors({});
  }, [task, visible]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!pointValue || isNaN(Number(pointValue)) || Number(pointValue) < 0) {
      newErrors.pointValue = 'Point value must be 0 or greater';
    }

    if (!xpReward || isNaN(Number(xpReward)) || Number(xpReward) < 0) {
      newErrors.xpReward = 'XP reward must be 0 or greater';
    }

    if (isRepeatable && (!maxCompletions || isNaN(Number(maxCompletions)) || Number(maxCompletions) < 1)) {
      newErrors.maxCompletions = 'Max completions must be at least 1 for repeatable tasks';
    }

    if (estimatedDuration && (isNaN(Number(estimatedDuration)) || Number(estimatedDuration) < 1)) {
      newErrors.estimatedDuration = 'Estimated duration must be at least 1 minute';
    }

    if (availableFrom && availableUntil && new Date(availableUntil) <= new Date(availableFrom)) {
      newErrors.availableUntil = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      const data: AddChallengeTaskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        taskType,
        pointValue: Number(pointValue),
        xpReward: Number(xpReward),
        difficulty,
        isRepeatable,
        maxCompletions: isRepeatable && maxCompletions ? Number(maxCompletions) : undefined,
        orderIndex: existingTasks.length,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        requiresProof,
        proofInstructions: proofInstructions.trim() || undefined,
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        availableFrom,
        availableUntil,
        prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinimumEndDate = (): Date | undefined => {
    if (availableFrom) {
      const minDate = new Date(availableFrom);
      minDate.setDate(minDate.getDate() + 1);
      return minDate;
    }
    return undefined;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {task ? 'Edit Task' : 'Add Task'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <Input
                label="Title *"
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
                error={errors.title}
                leftIcon="checkmark-circle"
              />

              {/* Description Input */}
              <Input
                label="Description"
                placeholder="Enter task description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                leftIcon="document-text"
              />

              {/* Task Type Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Task Type *
                </Text>
                <View style={styles.optionsContainer}>
                  {TASK_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            taskType === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            taskType === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setTaskType(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              taskType === item.value
                                ? '#ffffff'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Difficulty *
                </Text>
                <View style={styles.optionsContainer}>
                  {DIFFICULTIES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            difficulty === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            difficulty === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setDifficulty(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              difficulty === item.value
                                ? '#ffffff'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rewards */}
              <View style={styles.rewardsRow}>
                <View style={styles.rewardInput}>
                  <Input
                    label="Point Value *"
                    placeholder="Points"
                    value={pointValue}
                    onChangeText={setPointValue}
                    error={errors.pointValue}
                    keyboardType="numeric"
                    leftIcon="trophy"
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Input
                    label="XP Reward *"
                    placeholder="XP"
                    value={xpReward}
                    onChangeText={setXpReward}
                    error={errors.xpReward}
                    keyboardType="numeric"
                    leftIcon="star"
                  />
                </View>
              </View>

              {/* Repeatable Toggle */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="repeat" size={20} color={theme.colors.text} />
                  <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                    Repeatable Task
                  </Text>
                </View>
                <Switch
                  value={isRepeatable}
                  onValueChange={setIsRepeatable}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Max Completions (if repeatable) */}
              {isRepeatable && (
                <Input
                  label="Max Completions *"
                  placeholder="Maximum times this task can be completed"
                  value={maxCompletions}
                  onChangeText={setMaxCompletions}
                  error={errors.maxCompletions}
                  keyboardType="numeric"
                  leftIcon="repeat"
                />
              )}

              {/* Requires Proof Toggle */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.text} />
                  <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                    Requires Proof
                  </Text>
                </View>
                <Switch
                  value={requiresProof}
                  onValueChange={setRequiresProof}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Proof Instructions (if proof required) */}
              {requiresProof && (
                <Input
                  label="Proof Instructions"
                  placeholder="Instructions for providing proof"
                  value={proofInstructions}
                  onChangeText={setProofInstructions}
                  multiline
                  numberOfLines={2}
                  leftIcon="document-text-outline"
                />
              )}

              {/* Optional Fields */}
              <Input
                label="Estimated Duration (minutes)"
                placeholder="Estimated time to complete"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                error={errors.estimatedDuration}
                keyboardType="numeric"
                leftIcon="time-outline"
              />

              <Input
                label="Tags"
                placeholder="Comma-separated tags (e.g., fitness, reading)"
                value={tags}
                onChangeText={setTags}
                leftIcon="pricetag"
              />

              {/* Availability Dates */}
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="Available From"
                    value={availableFrom}
                    onChange={setAvailableFrom}
                    placeholder="Optional start date"
                  />
                </View>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="Available Until"
                    value={availableUntil}
                    onChange={setAvailableUntil}
                    error={errors.availableUntil}
                    minimumDate={getMinimumEndDate()}
                    placeholder="Optional end date"
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                />
                <Button
                  title={task ? 'Update' : 'Add Task'}
                  variant="primary"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rewardInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    minWidth: 100,
  },
  submitButton: {
    flex: 1,
    minWidth: 100,
  },
});

