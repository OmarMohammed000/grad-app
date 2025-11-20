import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SummaryCardData {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  accentColor: string;
}

interface SummaryCardsProps {
  cards: SummaryCardData[];
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
}

export function SummaryCards({
  cards,
  backgroundColor,
  textColor,
  subTextColor,
}: SummaryCardsProps) {
  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View
          key={card.label}
          style={[styles.card, { backgroundColor }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${card.accentColor}22` },
            ]}
          >
            <Ionicons name={card.icon} size={18} color={card.accentColor} />
          </View>
          <Text style={[styles.value, { color: textColor }]}>{card.value}</Text>
          <Text style={[styles.label, { color: subTextColor }]}>{card.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 16,
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
  },
});


