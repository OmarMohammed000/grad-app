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
import { Input, Button, DatePicker } from '@/components/form';
import { Todo, CreateTodoData, UpdateTodoData } from '@/services/todos';

interface TodoFormModalProps {
  visible: boolean;
  todo?: Todo | null;
  onClose: () => void;
  onSubmit: (data: CreateTodoData | UpdateTodoData) => Promise<void>;
  onDelete?: (todoId: string) => void;
}

const PRIORITIES: Array<{ label: string; value: 'low' | 'medium' | 'high' | 'critical' }> = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const DIFFICULTIES: Array<{ label: string; value: 'easy' | 'medium' | 'hard' | 'extreme' }> = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Extreme', value: 'extreme' },
];

export function TodoFormModal({
  visible,
  todo,
  onClose,
  onSubmit,
  onDelete,
}: TodoFormModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDescription(todo.description || '');
      setPriority(todo.priority || 'medium');
      setDifficulty(todo.difficulty || 'medium');
      setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString() : undefined);
      setTags(todo.tags || []);
    } else {
      // Reset form for new todo
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDifficulty('medium');
      setDueDate(undefined);
      setTags([]);
      setTagInput('');
    }
  }, [todo, visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      // dueDate is already in ISO format from DatePicker, or undefined
      const data: CreateTodoData | UpdateTodoData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        difficulty,
        dueDate: dueDate, // Already in ISO format from DatePicker
        tags: tags.length > 0 ? tags : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getPriorityColor = (value: string) => {
    switch (value) {
      case 'critical':
        return theme.colors.danger;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.textMuted;
      default:
        return theme.colors.border;
    }
  };

  const getDifficultyColor = (value: string) => {
    switch (value) {
      case 'extreme':
        return theme.colors.danger;
      case 'hard':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'easy':
        return theme.colors.success;
      default:
        return theme.colors.border;
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
        style={styles.container}
      >
        <View style={styles.overlay} onTouchEnd={onClose} />
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {todo ? 'Edit Todo' : 'New Todo'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Input
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter todo title"
                autoFocus
              />

              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              {/* Priority Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Priority
                </Text>
                <View style={styles.options}>
                  {PRIORITIES.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            priority === option.value
                              ? getPriorityColor(option.value)
                              : theme.colors.backgroundSecondary,
                          borderColor:
                            priority === option.value
                              ? getPriorityColor(option.value)
                              : theme.colors.border,
                        },
                      ]}
                      onPress={() => setPriority(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              priority === option.value
                                ? '#ffffff'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Difficulty
                </Text>
                <View style={styles.options}>
                  {DIFFICULTIES.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            difficulty === option.value
                              ? getDifficultyColor(option.value)
                              : theme.colors.backgroundSecondary,
                          borderColor:
                            difficulty === option.value
                              ? getDifficultyColor(option.value)
                              : theme.colors.border,
                        },
                      ]}
                      onPress={() => setDifficulty(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              difficulty === option.value
                                ? '#ffffff'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date */}
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select due date (optional)"
                minimumDate={new Date()} // Prevent selecting past dates
              />

              {/* Tags */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Tags
                </Text>
                <View style={styles.tagInputContainer}>
                  <Input
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add tag"
                    style={styles.tagInput}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    style={[styles.addTagButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAddTag}
                  >
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: theme.colors.primary + '20',
                            borderColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                          {tag}
                        </Text>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                />
                {todo && onDelete && (
                  <TouchableOpacity
                    style={[
                      styles.deleteButtonCustom,
                      {
                        borderColor: theme.colors.danger,
                        backgroundColor: 'transparent',
                      },
                      theme.shadows.sm,
                    ]}
                    onPress={() => {
                      console.log('Delete button pressed for todo:', todo.id);
                      if (onDelete) {
                        onDelete(todo.id);
                      } else {
                        console.warn('onDelete handler is not provided');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    <Text style={[styles.deleteButtonText, { color: theme.colors.danger }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
                <Button
                  title={todo ? 'Update' : 'Create'}
                  variant="primary"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  deleteButton: {
    borderWidth: 2,
    minWidth: 100,
  },
  deleteButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

