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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Input, Button } from '@/components/form';
import { Habit, CreateHabitData, UpdateHabitData } from '@/services/habits';

interface HabitFormModalProps {
  visible: boolean;
  habit?: Habit | null;
  onClose: () => void;
  onSubmit: (data: CreateHabitData | UpdateHabitData) => Promise<void>;
  onDelete?: (habitId: string) => Promise<void>;
}

const DIFFICULTIES: Array<{ label: string; value: 'easy' | 'medium' | 'hard' | 'extreme' }> = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Extreme', value: 'extreme' },
];

const FREQUENCIES: Array<{ label: string; value: 'daily' | 'weekly' | 'custom' }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

export function HabitFormModal({
  visible,
  habit,
  onClose,
  onSubmit,
  onDelete,
}: HabitFormModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (habit) {
      setTitle(habit.title || '');
      setDescription(habit.description || '');
      setDifficulty(habit.difficulty || 'medium');
      setFrequency(habit.frequency || 'daily');
    } else {
      // Reset form for new habit
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setFrequency('daily');
    }
    setErrors({});
  }, [habit, visible]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
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
      const data: CreateHabitData | UpdateHabitData = {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        frequency,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting habit:', error);
    } finally {
      setLoading(false);
    }
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
                {habit ? 'Edit Habit' : 'Create Habit'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <Input
                label="Title *"
                placeholder="Enter habit title"
                value={title}
                onChangeText={setTitle}
                error={errors.title}
                leftIcon="pencil"
              />

              {/* Description Input */}
              <Input
                label="Description"
                placeholder="Enter habit description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                leftIcon="document-text"
              />

              {/* Difficulty Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Difficulty
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

              {/* Frequency Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Frequency
                </Text>
                <View style={styles.optionsContainer}>
                  {FREQUENCIES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            frequency === item.value
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor:
                            frequency === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                        theme.shadows.sm,
                      ]}
                      onPress={() => setFrequency(item.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              frequency === item.value
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

              {/* Actions */}
              <View style={styles.actions}>
                {habit && onDelete && (
                  <Button
                    title="Delete"
                    variant="ghost"
                    onPress={async () => {
                      if (onDelete) {
                        await onDelete(habit.id);
                        onClose();
                      }
                    }}
                    style={[styles.deleteButton, { borderColor: theme.colors.danger }]}
                  />
                )}
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                />
                <Button
                  title={habit ? 'Update' : 'Create'}
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
    minWidth: 80,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
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

