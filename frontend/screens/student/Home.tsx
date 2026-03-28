import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';

export default function StudentHome() {
  const navigation = useNavigation();
  const currentUser = useAppStore((state) => state.currentUser);
  const attendances = useAppStore((state) => state.attendances);
  const notifications = useAppStore((state) => state.notifications);
  const users = useAppStore((state) => state.users);
  const getStudentNotifications = useAppStore((state) => state.getStudentNotifications);

  if (!currentUser) return null;

  const daysRemaining = differenceInDays(new Date(currentUser.expiryDate), new Date());
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 7;

  const studentAttendances = useMemo(
    () => attendances.filter((a) => a.studentId === currentUser.id),
    [attendances, currentUser.id]
  );
  const attendancePct = Math.min(
    100,
    Math.round((studentAttendances.length / Math.max(1, new Date().getDate())) * 100)
  );

  const recentActivity = useMemo(() => {
    const list = getStudentNotifications(currentUser.id);
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [currentUser.id, getStudentNotifications, notifications, users]);

  const scrollBottom = useScrollBottomForTabBar();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Library Student Card</Text>
          <Text style={styles.cardName}>{currentUser.name}</Text>
          <Text style={styles.cardUser}>@{currentUser.username}</Text>

          <View style={styles.cardRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaKey}>Active From</Text>
              <Text style={styles.metaVal}>{format(new Date(currentUser.joinDate), 'dd MMM yyyy')}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaKey}>Active To</Text>
              <Text style={styles.metaVal}>{format(new Date(currentUser.expiryDate), 'dd MMM yyyy')}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={[styles.statusBadge, isExpired ? styles.badStatus : styles.goodStatus]}>
              <Text style={[styles.statusText, isExpired ? styles.badText : styles.goodText]}>
                {isExpired ? 'Expired' : 'Active Member'}
              </Text>
            </View>
            <Text style={styles.mobile}>Mobile: {currentUser.mobile}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Open scan attendance"
          onPress={() => (navigation as any).navigate('Scan Attendance')}
        >
          <Ionicons name="qr-code-outline" size={16} color="#fff" />
          <Text style={styles.scanText}>Quick Scan Entrance</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Fee Status</Text>
            <Text style={styles.statValue}>{currentUser.feeStatus}</Text>
            <Text style={styles.statMeta}>Amount: Rs {currentUser.feeAmount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Attendance</Text>
            <Text style={styles.statValue}>{attendancePct}%</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${attendancePct}%` }]} />
            </View>
          </View>
        </View>

        {/* Membership Status — clear copy for active / expired / expiring soon */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Membership Status</Text>
        </View>
        <View
          style={[
            styles.membershipCard,
            isExpired && styles.membershipCardExpired,
            isExpiringSoon && !isExpired && styles.membershipCardWarn,
          ]}
        >
          <View style={styles.membershipHeader}>
            <View
              style={[
                styles.membershipIconWrap,
                isExpired && styles.membershipIconExpired,
                isExpiringSoon && !isExpired && styles.membershipIconWarn,
              ]}
            >
              <Ionicons
                name={isExpired ? 'alert-circle' : isExpiringSoon ? 'hourglass-outline' : 'shield-checkmark'}
                size={22}
                color={isExpired ? '#B91C1C' : isExpiringSoon ? '#B45309' : '#059669'}
              />
            </View>
            <View style={styles.membershipHeadText}>
              <Text style={styles.membershipHeadline}>
                {isExpired
                  ? 'Membership expired'
                  : isExpiringSoon
                    ? 'Renew soon'
                    : 'Membership active'}
              </Text>
              <Text style={styles.membershipSub}>
                Valid until {format(new Date(currentUser.expiryDate), 'EEEE, d MMM yyyy')}
              </Text>
            </View>
          </View>
          {!isExpired ? (
            <View style={styles.membershipDaysRow}>
              <Text style={[styles.membershipBig, isExpiringSoon && styles.membershipBigWarn]}>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
              </Text>
              <Text style={styles.membershipHint}>Contact the library to renew before expiry.</Text>
            </View>
          ) : (
            <Text style={styles.membershipExpiredMsg}>
              Your access may be limited. Please visit the library to renew your membership.
            </Text>
          )}
        </View>

        {/* Recent Activity — only this student’s announcements + system reminders */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionCaption}>Updates for you</Text>
        </View>
        <View style={styles.listCard}>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="newspaper-outline" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No updates yet</Text>
              <Text style={styles.emptyText}>Library announcements will appear here.</Text>
            </View>
          ) : (
            recentActivity.map((n, index) => (
              <View
                key={n.id}
                style={[styles.itemRow, index < recentActivity.length - 1 && styles.itemRowBorder]}
              >
                <View style={styles.itemIconCircle}>
                  <Ionicons
                    name={n.id.startsWith('sys-') ? 'information-circle' : 'notifications-outline'}
                    size={18}
                    color={n.id.startsWith('sys-') ? '#D97706' : '#4F46E5'}
                  />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {n.title}
                  </Text>
                  {!!n.message && (
                    <Text style={styles.itemBody} numberOfLines={2}>
                      {n.message}
                    </Text>
                  )}
                  <Text style={styles.itemMeta}>{format(new Date(n.date), 'dd MMM yyyy, hh:mm a')}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF1F7' },
  content: { padding: 14, paddingBottom: 0 },
  card: {
    backgroundColor: '#3F51B5',
    borderRadius: 14,
    padding: 14,
  },
  cardLabel: { color: '#C7D2FE', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardName: { marginTop: 6, color: '#fff', fontSize: 24, fontWeight: '800' },
  cardUser: { marginTop: 2, color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
  cardRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaPill: { flex: 1, backgroundColor: '#1E2D8F', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  metaKey: { color: '#A5B4FC', fontSize: 9, fontWeight: '700' },
  metaVal: { color: '#E0E7FF', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  goodStatus: { backgroundColor: '#DCFCE7' },
  badStatus: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: '700' },
  goodText: { color: '#166534' },
  badText: { color: '#B91C1C' },
  mobile: { color: '#E0E7FF', fontSize: 11, fontWeight: '700' },
  scanButton: {
    marginTop: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, ...theme.shadow.card },
  statTitle: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  statValue: { marginTop: 4, fontSize: 20, color: '#1E1B4B', fontWeight: '800' },
  statMeta: { marginTop: 2, fontSize: 11, color: '#94A3B8' },
  progressBg: { marginTop: 8, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB' },
  progressFill: { height: 4, borderRadius: 999, backgroundColor: '#3F51B5' },
  sectionRow: { marginTop: 18, marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  sectionCaption: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#64748B' },
  membershipCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadow.card,
  },
  membershipCardWarn: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  membershipCardExpired: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  membershipHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  membershipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipIconWarn: { backgroundColor: '#FEF3C7' },
  membershipIconExpired: { backgroundColor: '#FEE2E2' },
  membershipHeadText: { flex: 1, minWidth: 0 },
  membershipHeadline: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  membershipSub: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#64748B', lineHeight: 17 },
  membershipDaysRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  membershipBig: { fontSize: 28, fontWeight: '800', color: '#059669', letterSpacing: -0.5 },
  membershipBigWarn: { color: '#B45309' },
  membershipHint: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#64748B', lineHeight: 18 },
  membershipExpiredMsg: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 20,
  },
  listCard: { backgroundColor: '#fff', borderRadius: 14, padding: 4, ...theme.shadow.card, borderWidth: 1, borderColor: '#F1F5F9' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 10 },
  itemRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9' },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemTextWrap: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14, color: '#0F172A', fontWeight: '700', lineHeight: 19 },
  itemBody: { marginTop: 4, fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 17 },
  itemMeta: { marginTop: 6, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  emptyBlock: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '800', color: '#475569' },
  emptyText: { marginTop: 6, fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
});
