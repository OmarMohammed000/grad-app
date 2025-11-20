import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  backgroundColor: string;
  activeColor: string;
  textColor: string;
  activeTextColor: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  backgroundColor,
  activeColor,
  textColor,
  activeTextColor,
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isActive && { backgroundColor: activeColor },
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? activeTextColor : textColor },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segment: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});


