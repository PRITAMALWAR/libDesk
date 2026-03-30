import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_W    = width - 40;

export default function StudentProfile() {
  const currentUser            = useAppStore((s) => s.currentUser);
  const attendances            = useAppStore((s) => s.attendances);
  const fetchStudentAttendance = useAppStore((s) => s.fetchStudentAttendance);
  const uploadStudentPhoto     = useAppStore((s) => s.uploadStudentPhoto);
  const logout                 = useAppStore((s) => s.logout);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) fetchStudentAttendance(currentUser.id);
    }, [currentUser, fetchStudentAttendance])
  );

  const stats = useMemo(() => {
    if (!currentUser) return { total: 0, thisMonth: 0, streak: 0, daysLeft: 0, isExpired: false };
    const now  = new Date();
    const mine = [...attendances.filter((a) => a.studentId === currentUser.id)]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const thisMonth = mine.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    // Simple streak: consecutive days from today backwards
    let streak = 0;
    const check = new Date(now);
    for (const rec of mine) {
      const d = new Date(rec.date);
      if (
        d.getDate() === check.getDate() &&
        d.getMonth() === check.getMonth() &&
        d.getFullYear() === check.getFullYear()
      ) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    const daysLeft = differenceInDays(new Date(currentUser.expiryDate), now);
    return { total: mine.length, thisMonth, streak, daysLeft, isExpired: daysLeft < 0 };
  }, [attendances, currentUser]);

  if (!currentUser) return null;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to update your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploading(true);
    const r = await uploadStudentPhoto(currentUser.id, result.assets[0].uri);
    setUploading(false);
    if (!r.ok) Alert.alert('Upload failed', r.message || 'Could not upload photo.');
  };

  const onLogout = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const feeColor = currentUser.feeStatus === 'Paid' ? '#16A34A'
    : currentUser.feeStatus === 'Half Paid'          ? '#D97706'
    : '#DC2626';
  const feeBg = currentUser.feeStatus === 'Paid' ? '#DCFCE7'
    : currentUser.feeStatus === 'Half Paid'        ? '#FEF3C7'
    : '#FEE2E2';
  const expiryColor = stats.isExpired ? '#DC2626' : stats.daysLeft <= 7 ? '#D97706' : '#16A34A';
  const ringColor   = stats.isExpired ? '#EF4444' : '#6366F1';

  // membership progress
  const joinTs  = new Date(currentUser.joinDate).getTime();
  const expTs   = new Date(currentUser.expiryDate).getTime();
  const prog    = Math.min(Math.max((Date.now() - joinTs) / (expTs - joinTs), 0), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Avatar + name ── */}
        <View style={styles.topSection}>
          <TouchableOpacity
            onPress={handlePickPhoto}
            disabled={uploading}
            activeOpacity={0.85}
            style={styles.avatarRingWrap}
          >
            <LinearGradient
              colors={stats.isExpired ? ['#EF4444', '#DC2626'] : ['#6366F1', '#8B5CF6']}
              style={styles.avatarRing}
            >
              {currentUser.photoUrl
                ? <Image source={{ uri: currentUser.photoUrl }} style={styles.avatar} />
                : <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{currentUser.name.charAt(0).toUpperCase()}</Text>
                  </View>
              }
            </LinearGradient>
            <View style={[styles.cameraBtn, { backgroundColor: ringColor }]}>
              <Ionicons name={uploading ? 'cloud-upload-outline' : 'camera-outline'} size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}  ·  {currentUser.mobile}</Text>

          {/* Status badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.pill, { backgroundColor: stats.isExpired ? '#FEE2E2' : '#ECFDF5', borderColor: stats.isExpired ? '#FCA5A5' : '#6EE7B7' }]}>
              <View style={[styles.pillDot, { backgroundColor: expiryColor }]} />
              <Text style={[styles.pillTxt, { color: expiryColor }]}>
                {stats.isExpired ? 'Expired' : 'Active'}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: feeBg, borderColor: feeColor + '66' }]}>
              <Ionicons name="cash-outline" size={10} color={feeColor} />
              <Text style={[styles.pillTxt, { color: feeColor }]}>{currentUser.feeStatus}</Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatBox value={stats.thisMonth} label="This month" icon="calendar" color="#6366F1" />
          <StatBox value={stats.total}     label="Total visits" icon="checkmark-circle" color="#0EA5E9" />
          <StatBox value={stats.streak}    label="Day streak"   icon="flame" color="#F97316" />
        </View>

        {/* ── Library membership card ── */}
        <LinearGradient
          colors={['#1E1B4B', '#3730A3', '#4F46E5']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.memberCard}
        >
          {/* decorations */}
          <View style={styles.mcCircle1} />
          <View style={styles.mcCircle2} />

          {/* top row */}
          <View style={styles.mcTop}>
            <View style={styles.mcIconBox}>
              <Ionicons name="library" size={16} color="#fff" />
            </View>
            <Text style={styles.mcLibrary}>LIBDESK LIBRARY</Text>
            <View style={[styles.mcChip, { backgroundColor: stats.isExpired ? '#EF4444' : '#22C55E' }]}>
              <Text style={styles.mcChipTxt}>{stats.isExpired ? 'EXPIRED' : 'VALID'}</Text>
            </View>
          </View>

          {/* name */}
          <Text style={styles.mcName}>{currentUser.name.toUpperCase()}</Text>

          {/* divider dots */}
          <View style={styles.mcDots}>
            {Array.from({ length: 24 }).map((_, i) => (
              <View key={i} style={styles.mcDot} />
            ))}
          </View>

          {/* dates + progress */}
          <View style={styles.mcDates}>
            <View>
              <Text style={styles.mcDateLbl}>VALID FROM</Text>
              <Text style={styles.mcDateVal}>{format(new Date(currentUser.joinDate), 'dd MMM yyyy')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.mcDateLbl}>VALID TO</Text>
              <Text style={[styles.mcDateVal, { color: stats.isExpired ? '#FCA5A5' : '#86EFAC' }]}>
                {format(new Date(currentUser.expiryDate), 'dd MMM yyyy')}
              </Text>
            </View>
          </View>

          {/* progress bar */}
          <View style={styles.mcProgressBg}>
            <LinearGradient
              colors={stats.isExpired ? ['#EF4444', '#DC2626'] : ['#6EE7B7', '#22C55E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.mcProgressFill, { width: `${Math.round(prog * 100)}%` as any }]}
            />
          </View>
          <Text style={styles.mcProgressLbl}>
            {stats.isExpired
              ? `Expired ${Math.abs(stats.daysLeft)}d ago`
              : `${Math.max(stats.daysLeft, 0)} days remaining`}
          </Text>
        </LinearGradient>

        {/* ── Fee section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Details</Text>
          <View style={styles.feeGrid}>
            <View style={[styles.feeBox, { backgroundColor: feeBg, borderColor: feeColor + '40' }]}>
              <Ionicons name="cash" size={22} color={feeColor} />
              <Text style={[styles.feeBoxVal, { color: feeColor }]}>{currentUser.feeStatus}</Text>
              <Text style={styles.feeBoxLbl}>Status</Text>
            </View>
            <View style={[styles.feeBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
              <Ionicons name="wallet" size={22} color="#4F46E5" />
              <Text style={[styles.feeBoxVal, { color: '#4F46E5' }]}>₹{currentUser.feeAmount}</Text>
              <Text style={styles.feeBoxLbl}>Amount</Text>
            </View>
          </View>
        </View>

        {/* ── Info section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person-outline"  label="Full Name" value={currentUser.name} />
            <InfoRow icon="at-outline"       label="Username"  value={currentUser.username} />
            <InfoRow icon="call-outline"     label="Mobile"    value={currentUser.mobile} last />
          </View>
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity onPress={onLogout} activeOpacity={0.85} style={styles.signOutBtn}>
          <View style={styles.signOutIconBox}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <Text style={styles.signOutTxt}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#FCA5A5" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <Text style={styles.versionTxt}>libDesk v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ value, label, icon, color }: {
  value: number; label: string;
  icon: keyof typeof Ionicons.glyphMap; color: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconBox}>
          <Ionicons name={icon} size={14} color="#6366F1" />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 36 },

  // ── Top section ──
  topSection: {
    alignItems: 'center',
    paddingTop: 24, paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  avatarRingWrap: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar:        { width: 90, height: 90, borderRadius: 45 },
  avatarFallback:{
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '900', color: '#4F46E5' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name:     { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4, marginBottom: 2 },
  username: { fontSize: 13, fontWeight: '500', color: '#94A3B8', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillTxt: { fontSize: 11, fontWeight: '700' },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12, marginHorizontal: 16,
    borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  statBox:    { flex: 1, alignItems: 'center', gap: 4 },
  statIconBox:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal:    { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  statLbl:    { fontSize: 10, fontWeight: '600', color: '#94A3B8' },

  // ── Membership card ──
  memberCard: {
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  mcCircle1: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mcCircle2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mcTop: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, gap: 8,
  },
  mcIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  mcLibrary:   { flex: 1, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  mcChip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mcChipTxt:   { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  mcName:      { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 14 },
  mcDots:      { flexDirection: 'row', gap: 3, marginBottom: 14 },
  mcDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  mcDates:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mcDateLbl:   { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginBottom: 2 },
  mcDateVal:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  mcProgressBg:  { height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  mcProgressFill:{ height: 5, borderRadius: 3 },
  mcProgressLbl: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', textAlign: 'right' },

  // ── Fee section ──
  section: { marginHorizontal: 16, marginTop: 14 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8,
  },
  feeGrid: { flexDirection: 'row', gap: 10 },
  feeBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 4,
    borderWidth: 1,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  feeBoxVal: { fontSize: 15, fontWeight: '800' },
  feeBoxLbl: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },

  // ── Info card ──
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  infoLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  infoLabel:  { fontSize: 14, fontWeight: '600', color: '#475569' },
  infoValue:  { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // ── Sign out ──
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FEE2E2',
    ...Platform.select({
      ios:     { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  signOutIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  signOutTxt: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  versionTxt: { textAlign: 'center', fontSize: 11, color: '#CBD5E1', marginTop: 20, fontWeight: '500' },
});
