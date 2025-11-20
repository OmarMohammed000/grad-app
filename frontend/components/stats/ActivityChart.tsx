import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityPoint } from '@/services/leaderboard';

interface ActivityChartProps {
  data: ActivityPoint[];
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  mutedTextColor: string;
}

export function ActivityChart({
  data,
  primaryColor,
  secondaryColor,
  textColor,
  mutedTextColor,
}: ActivityChartProps) {
  const maxValue = Math.max(...data.map((point) => point.tasks + point.habits), 1);

  if (data.length === 0) {
    return (
      <Text style={[styles.empty, { color: mutedTextColor }]}>
        No activity recorded yet.
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.chart}>
        {data.map((point) => {
          const combined = point.tasks + point.habits;
          const totalHeight = (combined / maxValue) * 140 || 4;
          const tasksHeight =
            combined === 0 ? 0 : (point.tasks / combined) * totalHeight;
          const habitsHeight =
            combined === 0 ? 0 : (point.habits / combined) * totalHeight;

          return (
            <View key={point.label} style={styles.column}>
              <View style={styles.barShell}>
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: Math.max(tasksHeight, 4),
                      backgroundColor: primaryColor,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: Math.max(habitsHeight, 4),
                      backgroundColor: secondaryColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, { color: mutedTextColor }]}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Legend color={primaryColor} label="Tasks" textColor={mutedTextColor} />
        <Legend color={secondaryColor} label="Habits" textColor={mutedTextColor} />
      </View>
    </View>
  );
}

interface LegendProps {
  color: string;
  label: string;
  textColor: string;
}

function Legend({ color, label, textColor }: LegendProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    height: 180,
    marginBottom: 12,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barShell: {
    width: 24,
    justifyContent: 'flex-end',
    gap: 4,
  },
  barSegment: {
    width: '100%',
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});


