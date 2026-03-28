import React, { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import { theme } from '../../theme';
import { useAppStore } from '../../store';

export default function StudentProfile() {
  const currentUser = useAppStore((state) => state.currentUser);
  const attendances = useAppStore((state) => state.attendances);
  const fetchTodayAttendance = useAppStore((state) => state.fetchTodayAttendance);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    if (!currentUser) return;
    fetchTodayAttendance();
  }, [currentUser, fetchTodayAttendance]);

  const stats = useMemo(() => {
    if (!currentUser) {
      return { totalAttendance: 0, currentMonthAttendance: 0, daysLeft: 0, isExpired: false };
    }

    const now = new Date();
    const totalAttendance = attendances.filter((a) => a.studentId === currentUser.id).length;
    const currentMonthAttendance = attendances.filter((a) => {
      if (a.studentId !== currentUser.id) return false;
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const daysLeft = differenceInDays(new Date(currentUser.expiryDate), now);
    return { totalAttendance, currentMonthAttendance, daysLeft, isExpired: daysLeft < 0 };
  }, [attendances, currentUser]);

  if (!currentUser) return null;

  const onLogout = () => {
    Alert.alert('Logout', 'Do you want to logout now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.name?.slice(0, 1).toUpperCase() || 'S'}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <View style={[styles.memberBadge, stats.isExpired ? styles.badgeDanger : styles.badgeGood]}>
            <Text style={[styles.memberBadgeText, stats.isExpired ? styles.badgeDangerText : styles.badgeGoodText]}>
              {stats.isExpired ? 'Membership Expired' : 'Active Member'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal details</Text>
          <Row icon="call-outline" label="Mobile" value={currentUser.mobile} />
          <Row icon="calendar-outline" label="Joined" value={format(new Date(currentUser.joinDate), 'dd MMM yyyy')} />
          <Row icon="hourglass-outline" label="Expiry" value={format(new Date(currentUser.expiryDate), 'dd MMM yyyy')} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS MONTH</Text>
            <Text style={styles.statValue}>{stats.currentMonthAttendance}</Text>
            <Text style={styles.statSub}>attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{stats.totalAttendance}</Text>
            <Text style={styles.statSub}>attendance</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Membership & fee</Text>
          <Row icon="cash-outline" label="Fee status" value={currentUser.feeStatus} />
          <Row icon="wallet-outline" label="Fee amount" value={`Rs ${currentUser.feeAmount}`} />
          <Row
            icon="time-outline"
            label="Days left"
            value={stats.isExpired ? 'Expired' : `${Math.max(stats.daysLeft, 0)} days`}
            valueStyle={stats.isExpired ? styles.dangerValue : undefined}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.9}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={16} color="#475569" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 14, paddingBottom: 110, gap: 10 },
  hero: {
    backgroundColor: '#312E81',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { marginTop: 8, color: '#fff', fontSize: 20, fontWeight: '800' },
  username: { marginTop: 2, color: '#C7D2FE', fontSize: 13, fontWeight: '600' },
  memberBadge: { marginTop: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeGood: { backgroundColor: '#DCFCE7' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  memberBadgeText: { fontWeight: '700', fontSize: 11 },
  badgeGoodText: { color: '#166534' },
  badgeDangerText: { color: '#B91C1C' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 12, color: '#64748B', fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 13, color: '#334155', fontWeight: '600' },
  rowValue: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  dangerValue: { color: '#B91C1C' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  statValue: { marginTop: 3, color: '#0F172A', fontSize: 24, fontWeight: '800' },
  statSub: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  logoutBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
