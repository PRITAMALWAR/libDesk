import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Alert,
  Image, Platform,
} from 'react-native';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format, formatDistanceToNow, isToday, subDays } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';

type ActivityItem = {
  id: string;
  type: 'checkin' | 'joined' | 'notification' | 'expired';
  label: string;
  sub: string;
  date: string;
  photoUrl?: string | null;
  initial?: string;
  iconColor: string;
  iconBg: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function AdminDashboard() {
  const navigation           = useNavigation<any>();
  const currentUser          = useAppStore((s) => s.currentUser);
  const users                = useAppStore((s) => s.users);
  const notifications        = useAppStore((s) => s.notifications);
  const attendances          = useAppStore((s) => s.attendances);
  const fetchStudents        = useAppStore((s) => s.fetchStudents);
  const fetchTodayAttendance = useAppStore((s) => s.fetchTodayAttendance);
  const fetchNotifications   = useAppStore((s) => s.fetchNotifications);
  const getTodayAttendance   = useAppStore((s) => s.getTodayAttendance);
  const logout               = useAppStore((s) => s.logout);
  const scrollBottom         = useScrollBottomForTabBar();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();
    fetchNotifications();
  }, [fetchStudents, fetchTodayAttendance, fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([fetchStudents(), fetchTodayAttendance(), fetchNotifications()]); }
    finally { setRefreshing(false); }
  }, [fetchStudents, fetchTodayAttendance, fetchNotifications]);

  const students        = useMemo(() => users.filter((u) => u.role === 'student'), [users]);
  const todayList       = getTodayAttendance();
  const todayCount      = todayList.length;
  const total           = students.length;
  const activeCount     = students.filter((s) => !s.isBlocked && differenceInDays(new Date(s.expiryDate), new Date()) >= 0).length;
  const expiredCount    = students.filter((s) => differenceInDays(new Date(s.expiryDate), new Date()) < 0).length;
  const blockedCount    = students.filter((s) => s.isBlocked).length;
  const pendingFeeCount = students.filter((s) => s.feeStatus !== 'Paid').length;
  const attendancePct   = total > 0 ? Math.round((todayCount / total) * 100) : 0;

  // ── Recent activity feed ──────────────────────────────────────────────────
  const activityFeed: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    // Today's check-ins
    for (const a of todayList) {
      const s = users.find((u) => u.id === a.studentId);
      items.push({
        id: `ci-${a.id}`,
        type: 'checkin',
        label: s?.name ?? 'Unknown student',
        sub: 'Scanned attendance QR',
        date: a.date,
        photoUrl: s?.photoUrl,
        initial: (s?.name ?? '?').charAt(0).toUpperCase(),
        icon: 'qr-code',
        iconColor: '#6366F1',
        iconBg: '#EEF2FF',
      });
    }

    // Recently joined (last 14 days)
    const cutoff = subDays(new Date(), 14).getTime();
    for (const s of students) {
      if (new Date(s.joinDate).getTime() >= cutoff) {
        items.push({
          id: `join-${s.id}`,
          type: 'joined',
          label: s.name,
          sub: 'New member joined',
          date: s.joinDate,
          photoUrl: s.photoUrl,
          initial: s.name.charAt(0).toUpperCase(),
          icon: 'person-add',
          iconColor: '#10B981',
          iconBg: '#ECFDF5',
        });
      }
    }

    // Recent notifications (last 7 days)
    for (const n of notifications.slice(0, 5)) {
      items.push({
        id: `notif-${n.id}`,
        type: 'notification',
        label: n.title,
        sub: 'Notification sent to students',
        date: n.date,
        icon: 'megaphone',
        iconColor: '#F59E0B',
        iconBg: '#FFFBEB',
      });
    }

    // Sort newest first, take top 8
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [todayList, students, notifications, users]);

  const parentNav = () => navigation.getParent();
  const goForm    = (id?: string) => parentNav()?.navigate('AdminStudentForm', id ? { studentId: id } : undefined);

  const onLogout = () =>
    Alert.alert('Logout', 'Sign out of the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const name     = currentUser?.name ?? 'Admin';

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {greeting}, {name} 👋</Text>
            <Text style={styles.subDate}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* ── Today summary row ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <StatChip label="Total" value={total}        color="#6366F1" icon="people" />
          <StatChip label="Today" value={todayCount}   color="#8B5CF6" icon="calendar" />
          <StatChip label="Active" value={activeCount} color="#10B981" icon="shield-checkmark" />
          <StatChip label="Expired" value={expiredCount} color="#EF4444" icon="time" />
          <StatChip label="Fee Due" value={pendingFeeCount} color="#F59E0B" icon="wallet" />
        </ScrollView>

        {/* ── Attendance banner ── */}
        <LinearGradient
          colors={['#4338CA', '#6D28D9']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerCircle} />
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerEyebrow}>TODAY'S ATTENDANCE</Text>
            <View style={styles.bannerCountRow}>
              <Text style={styles.bannerCount}>{todayCount}</Text>
              <Text style={styles.bannerOf}>/{total} students</Text>
            </View>
            <View style={styles.bannerBarBg}>
              <View style={[styles.bannerBarFill, { width: `${attendancePct}%` as any }]} />
            </View>
            <Text style={styles.bannerPct}>{attendancePct}% attendance rate</Text>
          </View>
          <TouchableOpacity style={styles.bannerAction} onPress={() => navigation.navigate('Attendance')}>
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
            <Text style={styles.bannerActionTxt}>Open QR</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Quick actions ── */}
        <View style={styles.actionsGrid}>
          <QuickAction icon="person-add"  label="Add"        color="#6366F1" bg="#EEF2FF" onPress={() => goForm()} />
          <QuickAction icon="people"      label="Students"   color="#10B981" bg="#ECFDF5" onPress={() => navigation.navigate('Students')} />
          <QuickAction icon="qr-code"     label="Attendance" color="#8B5CF6" bg="#F5F3FF" onPress={() => navigation.navigate('Attendance')} />
          <QuickAction icon="megaphone"   label="Notify"     color="#F59E0B" bg="#FFFBEB" onPress={() => navigation.navigate('Notifications')} />
          <QuickAction icon="wallet"      label="Fees"       color="#0EA5E9" bg="#F0F9FF" onPress={() => parentNav()?.navigate('AdminFees')} />
        </View>

        {/* ── Alerts ── */}
        {(expiredCount > 0 || blockedCount > 0 || pendingFeeCount > 0) && (
          <View style={styles.alertsWrap}>
            {expiredCount > 0 && (
              <TouchableOpacity style={[styles.alertPill, { backgroundColor: '#FEF2F2' }]} onPress={() => navigation.navigate('Students')}>
                <Ionicons name="time" size={13} color="#EF4444" />
                <Text style={[styles.alertPillTxt, { color: '#EF4444' }]}>{expiredCount} expired</Text>
              </TouchableOpacity>
            )}
            {blockedCount > 0 && (
              <TouchableOpacity style={[styles.alertPill, { backgroundColor: '#FEE2E2' }]} onPress={() => navigation.navigate('Students')}>
                <Ionicons name="ban" size={13} color="#DC2626" />
                <Text style={[styles.alertPillTxt, { color: '#DC2626' }]}>{blockedCount} blocked</Text>
              </TouchableOpacity>
            )}
            {pendingFeeCount > 0 && (
              <TouchableOpacity style={[styles.alertPill, { backgroundColor: '#FFFBEB' }]} onPress={() => parentNav()?.navigate('AdminFees')}>
                <Ionicons name="cash" size={13} color="#D97706" />
                <Text style={[styles.alertPillTxt, { color: '#D97706' }]}>{pendingFeeCount} fee due</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Recent Activity ── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {activityFeed.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="pulse-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyTxt}>No recent activity</Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {activityFeed.map((item, idx) => {
              let ago = '';
              try { ago = formatDistanceToNow(new Date(item.date), { addSuffix: true }); } catch {}
              const isLast = idx === activityFeed.length - 1;

              return (
                <View key={item.id} style={styles.activityItemWrap}>
                  {/* Timeline line */}
                  {!isLast && <View style={styles.timelineLine} />}

                  <View style={styles.activityItem}>
                    {/* Avatar or icon */}
                    {(item.type === 'checkin' || item.type === 'joined') ? (
                      <View style={styles.activityAvatar}>
                        {item.photoUrl
                          ? <Image source={{ uri: item.photoUrl }} style={styles.activityPhoto} />
                          : <View style={[styles.activityInitialBox, { backgroundColor: item.iconBg }]}>
                              <Text style={[styles.activityInitial, { color: item.iconColor }]}>{item.initial}</Text>
                            </View>
                        }
                        {/* Type badge on avatar */}
                        <View style={[styles.activityTypeBadge, { backgroundColor: item.iconBg }]}>
                          <Ionicons name={item.icon} size={9} color={item.iconColor} />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.activityIconBox, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={18} color={item.iconColor} />
                      </View>
                    )}

                    {/* Text */}
                    <View style={styles.activityBody}>
                      <Text style={styles.activityLabel} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.activitySub} numberOfLines={1}>{item.sub}</Text>
                    </View>

                    {/* Time */}
                    <Text style={styles.activityTime}>{ago}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ label, value, color, icon }: {
  label: string; value: number;
  color: string; icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statChipIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.statChipVal, { color }]}>{value}</Text>
      <Text style={styles.statChipLbl}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, bg, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; color: string; bg: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.qa}>
      <View style={[styles.qaIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4,
  },
  greeting:  { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  subDate:   { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Stats row ──
  statsRow: {
    paddingHorizontal: 18, paddingVertical: 14, gap: 10,
  },
  statChip: {
    alignItems: 'center', gap: 4,
    backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    minWidth: 72,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  statChipIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statChipVal:  { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  statChipLbl:  { fontSize: 10, fontWeight: '600', color: '#94A3B8' },

  // ── Banner ──
  banner: {
    marginHorizontal: 18, borderRadius: 20,
    padding: 20, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios:     { shadowColor: '#4338CA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  bannerCircle: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bannerLeft:    { flex: 1 },
  bannerEyebrow: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, marginBottom: 4 },
  bannerCountRow:{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  bannerCount:   { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  bannerOf:      { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  bannerBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3, marginTop: 8, marginBottom: 5, overflow: 'hidden' },
  bannerBarFill: { height: 5, backgroundColor: '#fff', borderRadius: 3 },
  bannerPct:     { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  bannerAction:  {
    alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginLeft: 12,
  },
  bannerActionTxt: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // ── Quick actions ──
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 18, marginBottom: 10, gap: 8,
  },
  qa: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  qaIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 9, fontWeight: '700', color: '#475569' },

  // ── Alerts ──
  alertsWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 18, gap: 8, marginBottom: 4,
  },
  alertPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  alertPillTxt: { fontSize: 11, fontWeight: '700' },

  // ── Section header ──
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, marginTop: 16, marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  sectionTitle:    { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  seeAll:          { fontSize: 13, fontWeight: '700', color: '#6366F1' },

  // ── Activity card ──
  activityCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    paddingHorizontal: 16, paddingVertical: 8,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  activityItemWrap: { position: 'relative' },
  timelineLine: {
    position: 'absolute',
    left: 19, top: 48, bottom: 0,
    width: 1.5, backgroundColor: '#F1F5F9',
  },
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
  },

  // Avatar with badge
  activityAvatar:  { position: 'relative', width: 40, height: 40, flexShrink: 0 },
  activityPhoto:   { width: 40, height: 40, borderRadius: 20 },
  activityInitialBox: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  activityInitial: { fontSize: 16, fontWeight: '800' },
  activityTypeBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },

  // Icon (for notifications etc)
  activityIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  activityBody:  { flex: 1, minWidth: 0 },
  activityLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  activitySub:   { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  activityTime:  { fontSize: 10, fontWeight: '600', color: '#CBD5E1', flexShrink: 0 },

  // ── Empty ──
  emptyActivity: {
    marginHorizontal: 18, backgroundColor: '#fff',
    borderRadius: 18, alignItems: 'center', paddingVertical: 32,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  emptyTxt: { marginTop: 10, fontSize: 14, fontWeight: '600', color: '#94A3B8' },
});
