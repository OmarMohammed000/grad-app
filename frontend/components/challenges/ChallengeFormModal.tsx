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
import { Challenge, CreateChallengeData } from '@/services/challenges';

interface ChallengeFormModalProps {
  visible: boolean;
  challenge?: Challenge | null;
  onClose: () => void;
  onSubmit: (data: CreateChallengeData) => Promise<void>;
}

const CHALLENGE_TYPES: Array<{ label: string; value: 'competitive' | 'collaborative' }> = [
  { label: 'Competitive', value: 'competitive' },
  { label: 'Collaborative', value: 'collaborative' },
];

const GOAL_TYPES: Array<{ label: string; value: 'task_count' | 'total_xp' | 'habit_streak' | 'custom' }> = [
  { label: 'Task Count', value: 'task_count' },
  { label: 'Total XP', value: 'total_xp' },
  { label: 'Habit Streak', value: 'habit_streak' },
  { label: 'Custom Goal', value: 'custom' },
];

const DIFFICULTY_LEVELS: Array<{ label: string; value: 'beginner' | 'intermediate' | 'advanced' | 'expert' }> = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
];

export function ChallengeFormModal({
  visible,
  challenge,
  onClose,
  onSubmit,
}: ChallengeFormModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'competitive' | 'collaborative'>('competitive');
  const [goalType, setGoalType] = useState<'task_count' | 'total_xp' | 'habit_streak' | 'custom'>('task_count');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [xpReward, setXpReward] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [tags, setTags] = useState('');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isTeamBased, setIsTeamBased] = useState(false);
  const [teamSize, setTeamSize] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title || '');
      setDescription(challenge.description || '');
      setChallengeType(challenge.challengeType || 'competitive');
      setGoalType(challenge.goalType || 'task_count');
      setGoalTarget(String(challenge.goalTarget || ''));
      setGoalDescription(challenge.goalDescription || '');
      setIsPublic(challenge.isPublic ?? true);
      setMaxParticipants(challenge.maxParticipants ? String(challenge.maxParticipants) : '');
      setXpReward(String(challenge.xpReward || 0));
      setStartDate(challenge.startDate);
      setEndDate(challenge.endDate);
      setTags(challenge.tags?.join(', ') || '');
      setRules(challenge.rules || '');
      setPrizeDescription(challenge.prizeDescription || '');
      setRequiresVerification(challenge.requiresVerification || false);
      setIsTeamBased(challenge.isTeamBased || false);
      setTeamSize(challenge.teamSize ? String(challenge.teamSize) : '');
      setDifficultyLevel(challenge.difficultyLevel || 'intermediate');
    } else {
      // Reset form for new challenge
      setTitle('');
      setDescription('');
      setChallengeType('competitive');
      setGoalType('task_count');
      setGoalTarget('');
      setGoalDescription('');
      setIsPublic(true);
      setMaxParticipants('');
      setXpReward('');
      setStartDate(undefined);
      setEndDate(undefined);
      setTags('');
      setRules('');
      setPrizeDescription('');
      setRequiresVerification(false);
      setIsTeamBased(false);
      setTeamSize('');
      setDifficultyLevel('intermediate');
    }
    setErrors({});
  }, [challenge, visible]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!goalTarget || isNaN(Number(goalTarget)) || Number(goalTarget) < 1) {
      newErrors.goalTarget = 'Goal target must be at least 1';
    }

    if (goalType === 'custom' && !goalDescription.trim()) {
      newErrors.goalDescription = 'Goal description is required for custom goals';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (maxParticipants && (isNaN(Number(maxParticipants)) || Number(maxParticipants) < 2)) {
      newErrors.maxParticipants = 'Max participants must be at least 2';
    }

    if (xpReward && (isNaN(Number(xpReward)) || Number(xpReward) < 0)) {
      newErrors.xpReward = 'XP reward must be 0 or greater';
    }

    if (isTeamBased && (!teamSize || isNaN(Number(teamSize)) || Number(teamSize) < 2)) {
      newErrors.teamSize = 'Team size must be at least 2';
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

      const data: CreateChallengeData = {
        title: title.trim(),
        description: description.trim() || undefined,
        challengeType,
        goalType,
        goalTarget: Number(goalTarget),
        goalDescription: goalDescription.trim() || undefined,
        isPublic,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        xpReward: xpReward ? Number(xpReward) : 0,
        startDate: startDate!,
        endDate: endDate!,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        rules: rules.trim() || undefined,
        prizeDescription: prizeDescription.trim() || undefined,
        requiresVerification,
        isTeamBased,
        teamSize: isTeamBased ? Number(teamSize) : undefined,
        difficultyLevel,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinimumEndDate = (): Date | undefined => {
    if (startDate) {
      const minDate = new Date(startDate);
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
                {challenge ? 'Edit Challenge' : 'Create Challenge'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <Input
                label="Title *"
                placeholder="Enter challenge title"
                value={title}
                onChangeText={setTitle}
                error={errors.title}
                leftIcon="trophy"
              />

              {/* Description Input */}
              <Input
                label="Description"
                placeholder="Enter challenge description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                leftIcon="document-text"
              />

              {/* Challenge Type Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Challenge Type
                </Text>
                <View style={styles.optionsContainer}>
                  {CHALLENGE_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            challengeType === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            challengeType === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setChallengeType(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              challengeType === item.value
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

              {/* Goal Type Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Goal Type *
                </Text>
                <View style={styles.optionsContainer}>
                  {GOAL_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            goalType === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            goalType === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setGoalType(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              goalType === item.value
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

              {/* Goal Target */}
              <Input
                label="Goal Target *"
                placeholder="Enter target number"
                value={goalTarget}
                onChangeText={setGoalTarget}
                error={errors.goalTarget}
                keyboardType="numeric"
                leftIcon="flag"
              />

              {/* Goal Description (for custom goals) */}
              {goalType === 'custom' && (
                <Input
                  label="Goal Description *"
                  placeholder="Describe your custom goal"
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  error={errors.goalDescription}
                  multiline
                  numberOfLines={2}
                  leftIcon="bulb"
                />
              )}

              {/* Dates */}
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="Start Date *"
                    value={startDate}
                    onChange={setStartDate}
                    error={errors.startDate}
                    minimumDate={new Date()}
                    placeholder="Select start date"
                  />
                </View>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="End Date *"
                    value={endDate}
                    onChange={setEndDate}
                    error={errors.endDate}
                    minimumDate={getMinimumEndDate()}
                    placeholder="Select end date"
                  />
                </View>
              </View>

              {/* Difficulty Level */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Difficulty Level
                </Text>
                <View style={styles.optionsContainer}>
                  {DIFFICULTY_LEVELS.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            difficultyLevel === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            difficultyLevel === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setDifficultyLevel(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              difficultyLevel === item.value
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

              {/* Additional Settings */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Additional Settings
                </Text>

                {/* Public/Private Toggle */}
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="globe-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                      Public Challenge
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Requires Verification Toggle */}
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                      Requires Verification
                    </Text>
                  </View>
                  <Switch
                    value={requiresVerification}
                    onValueChange={setRequiresVerification}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Team Based Toggle */}
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="people-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                      Team Based
                    </Text>
                  </View>
                  <Switch
                    value={isTeamBased}
                    onValueChange={setIsTeamBased}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Optional Fields */}
              <Input
                label="Max Participants"
                placeholder="Leave empty for unlimited"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                error={errors.maxParticipants}
                keyboardType="numeric"
                leftIcon="people"
              />

              {isTeamBased && (
                <Input
                  label="Team Size *"
                  placeholder="Enter team size"
                  value={teamSize}
                  onChangeText={setTeamSize}
                  error={errors.teamSize}
                  keyboardType="numeric"
                  leftIcon="people-circle"
                />
              )}

              <Input
                label="XP Reward"
                placeholder="Enter XP reward (default: 0)"
                value={xpReward}
                onChangeText={setXpReward}
                error={errors.xpReward}
                keyboardType="numeric"
                leftIcon="star"
              />

              <Input
                label="Tags"
                placeholder="Comma-separated tags (e.g., fitness, reading)"
                value={tags}
                onChangeText={setTags}
                leftIcon="pricetag"
              />

              <Input
                label="Rules"
                placeholder="Enter challenge rules (optional)"
                value={rules}
                onChangeText={setRules}
                multiline
                numberOfLines={3}
                leftIcon="document-text-outline"
              />

              <Input
                label="Prize Description"
                placeholder="Describe prizes or rewards (optional)"
                value={prizeDescription}
                onChangeText={setPrizeDescription}
                multiline
                numberOfLines={2}
                leftIcon="gift"
              />

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                />
                <Button
                  title={challenge ? 'Update' : 'Create'}
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
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
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

