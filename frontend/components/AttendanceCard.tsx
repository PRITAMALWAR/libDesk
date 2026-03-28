import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type AttendanceDayStatus = 'present' | 'absent' | 'future' | 'empty';

interface AttendanceCardProps {
  day: number | null;
  status: AttendanceDayStatus;
  isToday?: boolean;
}

export default function AttendanceCard({ day, status, isToday = false }: AttendanceCardProps) {
  if (status === 'empty') {
    return <View style={styles.emptyCell} />;
  }

  const isFuture = status === 'future';

  return (
    <View style={[styles.cell, isToday && styles.todayCell, isFuture && styles.futureCell]}>
      <Text style={[styles.dayText, isFuture && styles.futureText]}>{day}</Text>
      {status === 'present' && <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />}
      {status === 'absent' && <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCell: {
    flex: 1,
    margin: 2,
    minHeight: 40,
  },
  cell: {
    flex: 1,
    margin: 2,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  todayCell: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  futureCell: {
    backgroundColor: '#F8FAFC',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  futureText: {
    color: '#CBD5E1',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
