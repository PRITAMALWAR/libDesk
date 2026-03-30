import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';

type QuickAction = {
  key: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  onPress: () => void;
};

export default function AdminDashboard() {
  const navigation = useNavigation<any>();
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const notifications = useAppStore((s) => s.notifications);
  const fetchStudents = useAppStore((s) => s.fetchStudents);
  const fetchTodayAttendance = useAppStore((s) => s.fetchTodayAttendance);
  const fetchNotifications = useAppStore((s) => s.fetchNotifications);
  const getTodayAttendance = useAppStore((s) => s.getTodayAttendance);
  const logout = useAppStore((s) => s.logout);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();
    fetchNotifications();
  }, [fetchStudents, fetchTodayAttendance, fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStudents(), fetchTodayAttendance(), fetchNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStudents, fetchTodayAttendance, fetchNotifications]);

  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);
  const totalStudents = students.length;
  const todayList = getTodayAttendance();
  const todayAttendance = todayList.length;
  const activeStudents = students.filter((s) => differenceInDays(new Date(s.expiryDate), new Date()) >= 0).length;
  const expiredStudents = students.filter((s) => differenceInDays(new Date(s.expiryDate), new Date()) < 0).length;
  const blockedStudents = students.filter((s) => s.isBlocked).length;
  const pendingFee = students.filter((s) => s.feeStatus === 'Pending').length;
  const halfPaid = students.filter((s) => s.feeStatus === 'Half Paid').length;
  const paidFull = students.filter((s) => s.feeStatus === 'Paid').length;

  const attendanceRate =
    totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

  const recentStudents = useMemo(
    () =>
      [...students].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).slice(0, 6),
    [students]
  );

  const parentNav = () => navigation.getParent();

  const goForm = (studentId?: string) => {
    parentNav()?.navigate('AdminStudentForm', studentId ? { studentId } : undefined);
  };

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        key: 'add',
        label: 'Add student',
        sub: 'New membership',
        icon: 'person-add',
        color: '#1D4ED8',
        bg: '#DBEAFE',
        onPress: () => goForm(),
      },
      {
        key: 'students',
        label: 'All students',
        sub: `${totalStudents} total`,
        icon: 'people',
        color: '#047857',
        bg: '#D1FAE5',
        onPress: () => navigation.navigate('Students'),
      },
      {
        key: 'attendance',
        label: 'Attendance',
        sub: 'QR & records',
        icon: 'qr-code',
        color: '#6D28D9',
        bg: '#EDE9FE',
        onPress: () => navigation.navigate('Attendance'),
      },
      {
        key: 'notify',
        label: 'Alerts',
        sub: `${notifications.length} items`,
        icon: 'notifications',
        color: '#B45309',
        bg: '#FEF3C7',
        onPress: () => navigation.navigate('Notifications'),
      },
    ],
    [navigation, totalStudents, notifications.length]
  );

  const onLogout = () => {
    Alert.alert('Logout', 'Sign out of the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const adminName = currentUser?.name ?? 'Admin';
  const scrollBottom = useScrollBottomForTabBar();

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroKicker}>Library admin</Text>
              <Text style={styles.heroTitle}>Hello, {adminName}</Text>
              <Text style={styles.heroDate}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} accessibilityLabel="Logout">
              <Ionicons name="log-out-outline" size={22} color="#FECACA" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroStat}>
            <View style={styles.heroStatLeft}>
              <Text style={styles.heroStatLabel}>Present today</Text>
              <Text style={styles.heroStatValue}>
                {todayAttendance}
                <Text style={styles.heroStatSlash}> / {totalStudents}</Text>
              </Text>
            </View>
            <View style={styles.ringWrap}>
              <Text style={styles.ringText}>{attendanceRate}%</Text>
              <Text style={styles.ringSub}>check-in</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick actions</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity key={a.key} style={styles.actionTile} onPress={a.onPress} activeOpacity={0.88}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.actionTitle}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI row */}
        <Text style={styles.sectionLabel}>Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          <View style={[styles.kpiCard, styles.kpiIndigo]}>
            <Ionicons name="school-outline" size={20} color="#C7D2FE" />
            <Text style={styles.kpiVal}>{totalStudents}</Text>
            <Text style={styles.kpiLab}>Students</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiGreen]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#A7F3D0" />
            <Text style={styles.kpiVal}>{activeStudents}</Text>
            <Text style={styles.kpiLab}>Active</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiAmber]}>
            <Ionicons name="wallet-outline" size={20} color="#FDE68A" />
            <Text style={styles.kpiVal}>{pendingFee + halfPaid}</Text>
            <Text style={styles.kpiLab}>Fee follow-up</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiRed]}>
            <Ionicons name="alert-circle-outline" size={20} color="#FECACA" />
            <Text style={styles.kpiVal}>{expiredStudents + blockedStudents}</Text>
            <Text style={styles.kpiLab}>Attention</Text>
          </View>
        </ScrollView>

        {/* Insight chips */}
        <View style={styles.chipsRow}>
          {expiredStudents > 0 && (
            <View style={[styles.chip, styles.chipWarn]}>
              <Ionicons name="time-outline" size={14} color="#92400E" />
              <Text style={styles.chipText}>{expiredStudents} expired</Text>
            </View>
          )}
          {blockedStudents > 0 && (
            <View style={[styles.chip, styles.chipBad]}>
              <Ionicons name="ban-outline" size={14} color="#991B1B" />
              <Text style={styles.chipText}>{blockedStudents} blocked</Text>
            </View>
          )}
          {halfPaid > 0 && (
            <View style={[styles.chip, styles.chipSoft]}>
              <Ionicons name="pie-chart-outline" size={14} color="#B45309" />
              <Text style={styles.chipText}>{halfPaid} half paid</Text>
            </View>
          )}
          {paidFull > 0 && expiredStudents === 0 && blockedStudents === 0 && halfPaid === 0 && (
            <View style={[styles.chip, styles.chipOk]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#166534" />
              <Text style={styles.chipText}>Fees on track</Text>
            </View>
          )}
        </View>

        {/* Recent students */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabelFlat}>Recent students</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Students')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentStudents.length === 0 ? (
          <View style={[styles.listCard, styles.emptyBox]}>
            <Ionicons name="people-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No students yet</Text>
            <Text style={styles.emptySub}>Add a student to start tracking memberships.</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => goForm()}>
              <Text style={styles.emptyCtaText}>Add first student</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studentGrid}>
            {recentStudents.map((student) => {
              const daysLeft   = differenceInDays(new Date(student.expiryDate), new Date());
              const isExpired  = daysLeft < 0;
              const isExpiring = !isExpired && daysLeft <= 7;
              const statusColor = student.isBlocked ? '#DC2626' : isExpired ? '#DC2626' : isExpiring ? '#D97706' : '#10B981';
              const statusLabel = student.isBlocked ? 'Blocked' : isExpired ? 'Expired' : isExpiring ? `${daysLeft}d left` : 'Active';
              const statusBg    = student.isBlocked ? '#FEE2E2' : isExpired ? '#FEF2F2' : isExpiring ? '#FFFBEB' : '#ECFDF5';
              const feeColor    = student.feeStatus === 'Paid' ? '#059669' : student.feeStatus === 'Half Paid' ? '#D97706' : '#DC2626';

              return (
                <TouchableOpacity
                  key={student.id}
                  onPress={() => goForm(student.id)}
                  activeOpacity={0.85}
                  style={styles.scRow}
                >
                  {/* Left accent */}
                  <View style={[styles.scAccent, { backgroundColor: statusColor }]} />

                  {/* Avatar */}
                  {student.photoUrl
                    ? <Image source={{ uri: student.photoUrl }} style={styles.scPhoto} />
                    : <View style={[styles.scInitialBox, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.scInitial, { color: statusColor }]}>
                          {student.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                  }

                  {/* Info */}
                  <View style={styles.scInfo}>
                    <Text style={styles.scName} numberOfLines={1}>{student.name}</Text>
                    <Text style={styles.scSub} numberOfLines={1}>
                      @{student.username} · {student.mobile}
                    </Text>
                  </View>

                  {/* Right: status + fee */}
                  <View style={styles.scRight}>
                    <View style={[styles.scStatusBadge, { backgroundColor: statusBg }]}>
                      <View style={[styles.scStatusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.scStatusTxt, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                    <Text style={[styles.scFeeTxt, { color: feeColor }]}>{student.feeStatus}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeePill({ status }: { status: string }) {
  const paid = status === 'Paid';
  const half = status === 'Half Paid';
  return (
    <View
      style={[
        styles.feePill,
        paid ? styles.feePaid : half ? styles.feeHalf : styles.feePending,
      ]}
    >
      <Text style={[styles.feePillText, paid ? styles.feePaidT : half ? styles.feeHalfT : styles.feePendingT]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingBottom: 8 },
  hero: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: '#1E293B',
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroKicker: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: { marginTop: 6, fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroDate: { marginTop: 4, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
  },
  heroStat: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroStatLeft: { flex: 1 },
  heroStatLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  heroStatValue: { marginTop: 4, fontSize: 28, fontWeight: '800', color: '#fff' },
  heroStatSlash: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.35)',
  },
  ringText: { fontSize: 18, fontWeight: '800', color: '#EEF2FF' },
  ringSub: { fontSize: 10, fontWeight: '700', color: '#A5B4FC', marginTop: 2, textTransform: 'uppercase' },
  sectionLabel: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLabelFlat: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  sectionHead: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  actionTile: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    ...theme.shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  actionSub: { marginTop: 2, fontSize: 12, color: theme.colors.mutedText, fontWeight: '600' },
  kpiScroll: { paddingHorizontal: theme.spacing.md, gap: 10, paddingVertical: 2 },
  kpiCard: {
    width: 124,
    borderRadius: theme.radius.md,
    padding: 14,
    minHeight: 108,
    justifyContent: 'space-between',
  },
  kpiIndigo: { backgroundColor: '#312E81' },
  kpiGreen: { backgroundColor: '#065F46' },
  kpiAmber: { backgroundColor: '#B45309' },
  kpiRed: { backgroundColor: '#991B1B' },
  kpiVal: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 8 },
  kpiLab: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipWarn: { backgroundColor: '#FEF3C7' },
  chipBad: { backgroundColor: '#FEE2E2' },
  chipSoft: { backgroundColor: '#FFEDD5' },
  chipOk: { backgroundColor: '#DCFCE7' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  listCard: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },

  // ── Recent students list ──
  studentGrid: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  scRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F8FAFC',
  },
  scAccent: { width: 4, alignSelf: 'stretch' },
  scPhoto: { width: 42, height: 42, borderRadius: 21 },
  scInitialBox: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  scInitial:    { fontSize: 17, fontWeight: '800' },
  scInfo:       { flex: 1, minWidth: 0 },
  scName:       { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  scSub:        { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  scRight:      { alignItems: 'flex-end', gap: 4 },
  scStatusBadge:{
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  scStatusDot:  { width: 6, height: 6, borderRadius: 3 },
  scStatusTxt:  { fontSize: 10, fontWeight: '700' },
  scFeeTxt:     { fontSize: 10, fontWeight: '600' },

  emptyBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '800', color: theme.colors.text },
  emptySub: { marginTop: 6, fontSize: 13, color: theme.colors.mutedText, textAlign: 'center', lineHeight: 20 },
  emptyCta: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
