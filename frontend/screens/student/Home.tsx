import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';
import LibraryCard from '../../components/LibraryCard';
import { CATEGORY_META, resolveNotificationCategory } from '../../constants/notificationCategoryUi';

export default function StudentHome() {
  const navigation = useNavigation<any>();
  const currentUser = useAppStore((s) => s.currentUser);
  const attendances = useAppStore((s) => s.attendances);
  const notifications = useAppStore((s) => s.notifications);
  const users = useAppStore((s) => s.users);
  const getStudentNotifications = useAppStore((s) => s.getStudentNotifications);
  const scrollBottom = useScrollBottomForTabBar();

  const studentAttendances = useMemo(
    () => (currentUser ? attendances.filter((a) => a.studentId === currentUser.id) : []),
    [attendances, currentUser]
  );

  const attendancePct = useMemo(() => {
    const d = new Date().getDate();
    return Math.min(100, Math.round((studentAttendances.length / Math.max(1, d)) * 100));
  }, [studentAttendances]);

  const recentActivity = useMemo(() => {
    if (!currentUser) return [];
    return [...getStudentNotifications(currentUser.id)]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [currentUser, getStudentNotifications, notifications, users]);

  if (!currentUser) return null;

  const daysLeft = differenceInDays(new Date(currentUser.expiryDate), new Date());
  const isExpired = daysLeft < 0;
  const isExpiringSoon = !isExpired && daysLeft <= 7;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottom + 24 }}
      >
        {/* ─────────────────────────────────────────
            SECTION 1 · Library Card (HERO, at top)
        ───────────────────────────────────────── */}
        <View style={styles.cardSection}>
          <LibraryCard user={currentUser} />
        </View>

        {/* ─────────────────────────────────────────
            SECTION 3 · Stat pills
        ───────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatPill
            icon="time-outline"
            label="Days Left"
            value={isExpired ? 'Expired' : `${daysLeft}`}
            valueColor={isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : '#10B981'}
            bg={isExpired ? '#FEF2F2' : isExpiringSoon ? '#FFFBEB' : '#ECFDF5'}
            border={isExpired ? '#FECACA' : isExpiringSoon ? '#FDE68A' : '#A7F3D0'}
          />
          <StatPill
            icon="checkmark-circle-outline"
            label="Attendance"
            value={`${attendancePct}%`}
            valueColor="#2563EB"
            bg="#EFF6FF"
            border="#BFDBFE"
          />
          <StatPill
            icon="cash-outline"
            label="Fee"
            value={currentUser.feeStatus === 'Half Paid' ? 'Half' : currentUser.feeStatus}
            valueColor={
              currentUser.feeStatus === 'Paid'
                ? '#059669'
                : currentUser.feeStatus === 'Half Paid'
                ? '#D97706'
                : '#DC2626'
            }
            bg={
              currentUser.feeStatus === 'Paid'
                ? '#ECFDF5'
                : currentUser.feeStatus === 'Half Paid'
                ? '#FFFBEB'
                : '#FEF2F2'
            }
            border={
              currentUser.feeStatus === 'Paid'
                ? '#A7F3D0'
                : currentUser.feeStatus === 'Half Paid'
                ? '#FDE68A'
                : '#FECACA'
            }
          />
        </View>

        {/* ─────────────────────────────────────────
            SECTION 4 · Big scan CTA
        ───────────────────────────────────────── */}
        <View style={styles.px}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Scan Attendance')}
            activeOpacity={0.88}
            style={styles.scanBtn}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanGrad}
            >
              <View style={styles.scanIconWrap}>
                <Ionicons name="qr-code-outline" size={28} color="#fff" />
              </View>
              <View style={styles.scanText}>
                <Text style={styles.scanTitle}>Scan Attendance</Text>
                <Text style={styles.scanSub}>Tap to mark today's visit</Text>
              </View>
              <View style={styles.scanArrow}>
                <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ─────────────────────────────────────────
            SECTION 5 · Membership alert (conditional)
        ───────────────────────────────────────── */}
        {(isExpired || isExpiringSoon) && (
          <View style={styles.px}>
            <LinearGradient
              colors={isExpired ? ['#991B1B', '#B91C1C'] : ['#92400E', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.alert}
            >
              <View style={styles.alertIcon}>
                <Ionicons
                  name={isExpired ? 'alert-circle' : 'hourglass-outline'}
                  size={22}
                  color="#fff"
                />
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>
                  {isExpired ? 'Membership Expired' : `Expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                </Text>
                <Text style={styles.alertSub}>
                  {isExpired
                    ? 'Please visit the library to renew.'
                    : 'Contact library to renew before expiry.'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ─────────────────────────────────────────
            SECTION 7 · Recent Activity
        ───────────────────────────────────────── */}
        <View style={styles.px}>
          <SectionHeader title="Recent Activity" />
          <View style={styles.actCard}>
            {recentActivity.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="newspaper-outline" size={32} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyTitle}>No updates yet</Text>
                <Text style={styles.emptySub}>Library announcements will appear here.</Text>
              </View>
            ) : (
              recentActivity.map((n, i) => {
                const isSystem = n.id.startsWith('sys-');
                const cat = resolveNotificationCategory(n.category, isSystem);
                const meta = CATEGORY_META[cat];
                return (
                  <View
                    key={n.id}
                    style={[styles.actRow, i < recentActivity.length - 1 && styles.actRowBorder]}
                  >
                    <View style={[styles.actIconBox, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                      <Ionicons name={meta.icon} size={17} color={meta.color} />
                    </View>
                    <View style={styles.actContent}>
                      <View style={styles.actHead}>
                        <Text style={styles.actTitle} numberOfLines={1}>{n.title}</Text>
                        <View style={[styles.catChip, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.catChipText, { color: meta.color }]}>{meta.short}</Text>
                        </View>
                      </View>
                      {!!n.message && (
                        <Text style={styles.actMsg} numberOfLines={2}>{n.message}</Text>
                      )}
                      <Text style={styles.actTime}>{format(new Date(n.date), 'dd MMM · hh:mm a')}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.secHeader}>
      <View style={styles.secDot} />
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

function StatPill({
  icon, label, value, valueColor, bg, border,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor: string;
  bg: string;
  border: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={16} color={valueColor} />
      <Text style={[styles.pillValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}


// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5FF' },
  px: { paddingHorizontal: 16, marginBottom: 16 },

  // ── Card section ──
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  pillValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  pillLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.2 },

  // ── Scan CTA ──
  scanBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  scanGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  scanIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { flex: 1 },
  scanTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  scanSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  scanArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Section header ──
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  secDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
  secTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  // ── Alert ──
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  alertSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 17 },

  // ── Activity card ──
  actCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    overflow: 'hidden',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  actIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 1,
  },
  actContent: { flex: 1, minWidth: 0 },
  actHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 19 },
  catChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  catChipText: { fontSize: 9, fontWeight: '800' },
  actMsg: { marginTop: 4, fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 17 },
  actTime: { marginTop: 5, fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: '800', color: '#334155' },
  emptySub: { marginTop: 6, fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
});
