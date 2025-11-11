import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface DatePickerProps {
  label?: string;
  value?: string; // ISO date string
  onChange?: (date: string | undefined) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  
  // Set minimum date to today if not provided
  const minDate = minimumDate || new Date();
  minDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Initialize with selected date or today (whichever is later)
  const getInitialDate = () => {
    if (value) {
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      // If selected date is before today, use today instead
      if (selectedDate < minDate) {
        return minDate;
      }
      return selectedDate;
    }
    return minDate;
  };

  const initialDate = getInitialDate();
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());

  // Refs for scrolling to selected values
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Parse the value string to Date object
  const selectedDate = value ? new Date(value) : null;
  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Filter available months based on minimum date
  const availableMonths = months.map((month, index) => {
    const isAvailable = selectedYear > minDate.getFullYear() || 
                        (selectedYear === minDate.getFullYear() && index >= minDate.getMonth());
    return { month, index, available: isAvailable };
  });

  // Get available days based on selected year/month and minimum date
  const getAvailableDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const minDay = (selectedYear === minDate.getFullYear() && selectedMonth === minDate.getMonth())
      ? minDate.getDate()
      : 1;
    return Array.from({ length: daysInMonth - minDay + 1 }, (_, i) => minDay + i);
  };

  const availableDays = getAvailableDays();

  // Filter available years (only today and future)
  const availableYears = years.filter(year => year >= minDate.getFullYear());

  // Scroll to selected item when modal opens
  useEffect(() => {
    if (showModal) {
      // Scroll to selected month
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({
          y: selectedMonth * 56, // Approximate height per item
          animated: true,
        });
      }, 100);

      // Scroll to selected day
      setTimeout(() => {
        const dayIndex = availableDays.indexOf(selectedDay);
        if (dayIndex >= 0) {
          dayScrollRef.current?.scrollTo({
            y: dayIndex * 56,
            animated: true,
          });
        }
      }, 150);

      // Scroll to selected year
      setTimeout(() => {
        const yearIndex = availableYears.indexOf(selectedYear);
        if (yearIndex >= 0) {
          yearScrollRef.current?.scrollTo({
            y: yearIndex * 56,
            animated: true,
          });
        }
      }, 200);
    }
  }, [showModal, selectedMonth, selectedDay, selectedYear, availableDays, availableYears]);

  const handleOpenModal = () => {
    const dateToUse = value ? new Date(value) : minDate;
    const date = dateToUse < minDate ? minDate : dateToUse;
    
    setSelectedYear(date.getFullYear());
    setSelectedMonth(date.getMonth());
    
    // Set day to max of selected day or minimum day for that month
    const minDay = (date.getFullYear() === minDate.getFullYear() && date.getMonth() === minDate.getMonth())
      ? minDate.getDate()
      : 1;
    setSelectedDay(Math.max(minDay, date.getDate()));
    
    setShowModal(true);
  };

  const handleConfirm = () => {
    const date = new Date(Date.UTC(selectedYear, selectedMonth, selectedDay));
    const isoDate = date.toISOString();
    onChange?.(isoDate);
    setShowModal(false);
  };

  const handleClear = () => {
    onChange?.(undefined);
  };

  const borderColor = error
    ? theme.colors.danger
    : showModal
    ? theme.colors.primary
    : 'transparent';

  const borderWidth = error || showModal ? 2 : 0;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor,
            borderWidth,
          },
          theme.shadows.sm,
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={error ? theme.colors.danger : theme.colors.icon}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          {displayDate ? (
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {displayDate}
            </Text>
          ) : (
            <Text style={[styles.placeholder, { color: theme.colors.textMuted }]}>
              {placeholder}
            </Text>
          )}
        </View>

        {displayDate && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                  Month
                </Text>
                <ScrollView 
                  ref={monthScrollRef}
                  style={styles.pickerScroll} 
                  showsVerticalScrollIndicator={false}
                >
                  {availableMonths.map(({ month, index, available }) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && {
                          backgroundColor: theme.colors.primary,
                        },
                        !available && {
                          opacity: 0.3,
                        },
                      ]}
                      disabled={!available}
                      onPress={() => {
                        setSelectedMonth(index);
                        const daysInMonth = getDaysInMonth(selectedYear, index);
                        const minDay = (selectedYear === minDate.getFullYear() && index === minDate.getMonth())
                          ? minDate.getDate()
                          : 1;
                        if (selectedDay > daysInMonth || selectedDay < minDay) {
                          setSelectedDay(Math.max(minDay, Math.min(selectedDay, daysInMonth)));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.colors.text },
                          selectedMonth === index && { color: '#ffffff' },
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                  Day
                </Text>
                <ScrollView 
                  ref={dayScrollRef}
                  style={styles.pickerScroll} 
                  showsVerticalScrollIndicator={false}
                >
                  {availableDays.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.colors.text },
                          selectedDay === day && { color: '#ffffff' },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                  Year
                </Text>
                <ScrollView 
                  ref={yearScrollRef}
                  style={styles.pickerScroll} 
                  showsVerticalScrollIndicator={false}
                >
                  {availableYears.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        const daysInMonth = getDaysInMonth(year, selectedMonth);
                        const minDay = (year === minDate.getFullYear() && selectedMonth === minDate.getMonth())
                          ? minDate.getDate()
                          : 1;
                        if (selectedDay > daysInMonth || selectedDay < minDay) {
                          setSelectedDay(Math.max(minDay, Math.min(selectedDay, daysInMonth)));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.colors.text },
                          selectedYear === year && { color: '#ffffff' },
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.backgroundSecondary },
                ]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
  },
  placeholder: {
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 300,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
