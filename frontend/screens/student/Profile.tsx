import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store';
import { useFocusEffect } from '@react-navigation/native';

export default function StudentProfile() {
  const currentUser            = useAppStore((s) => s.currentUser);
  const attendances            = useAppStore((s) => s.attendances);
  const fetchStudentAttendance = useAppStore((s) => s.fetchStudentAttendance);
  const uploadStudentPhoto     = useAppStore((s) => s.uploadStudentPhoto);
  const logout                 = useAppStore((s) => s.logout);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) fetchStudentAttendance(currentUser.id);
    }, [currentUser, fetchStudentAttendance])
  );

  const stats = useMemo(() => {
    if (!currentUser) return { total: 0, thisMonth: 0, daysLeft: 0, isExpired: false };
    const now  = new Date();
    const mine = attendances.filter((a) => a.studentId === currentUser.id);
    const thisMonth = mine.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const daysLeft = differenceInDays(new Date(currentUser.expiryDate), now);
    return { total: mine.length, thisMonth, daysLeft, isExpired: daysLeft < 0 };
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
    setUploadingPhoto(true);
    const upload = await uploadStudentPhoto(currentUser.id, result.assets[0].uri);
    setUploadingPhoto(false);
    if (!upload.ok) Alert.alert('Upload failed', upload.message || 'Could not upload photo.');
  };

  const onLogout = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const feeColor =
    currentUser.feeStatus === 'Paid'        ? '#059669'
    : currentUser.feeStatus === 'Half Paid' ? '#D97706'
    : '#DC2626';

  const daysLeftColor = stats.isExpired ? '#DC2626' : stats.daysLeft <= 7 ? '#D97706' : '#059669';

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile card (horizontal) ── */}
        <View style={styles.profileCard}>
          {/* Left accent bar */}
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.cardAccent}
          />

          {/* Avatar */}
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} activeOpacity={0.85} style={styles.avatarWrap}>
            {currentUser.photoUrl
              ? <Image source={{ uri: currentUser.photoUrl }} style={styles.avatar} />
              : <LinearGradient colors={['#EEF2FF', '#C7D2FE']} style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{currentUser.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
            }
            <View style={styles.editDot}>
              <Ionicons name={uploadingPhoto ? 'cloud-upload-outline' : 'camera'} size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{currentUser.name}</Text>
            <Text style={styles.cardUsername}>@{currentUser.username}</Text>

            <View style={styles.cardBadges}>
              <View style={[
                styles.badge,
                { backgroundColor: stats.isExpired ? '#FEF2F2' : '#ECFDF5',
                  borderColor:      stats.isExpired ? '#FCA5A5' : '#6EE7B7' },
              ]}>
                <View style={[styles.badgeDot, { backgroundColor: stats.isExpired ? '#EF4444' : '#10B981' }]} />
                <Text style={[styles.badgeTxt, { color: stats.isExpired ? '#B91C1C' : '#065F46' }]}>
                  {stats.isExpired ? 'Expired' : 'Active'}
                </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Ionicons name="cash-outline" size={10} color={feeColor} />
                <Text style={[styles.badgeTxt, { color: feeColor }]}>{currentUser.feeStatus}</Text>
              </View>
            </View>
          </View>

          {/* Days pill on right */}
          <View style={styles.daysPill}>
            <Text style={[styles.daysNum, { color: daysLeftColor }]}>
              {stats.isExpired ? '0' : Math.max(stats.daysLeft, 0)}
            </Text>
            <Text style={styles.daysSub}>days{'\n'}left</Text>
          </View>
        </View>

        {/* ── Stat tiles ── */}
        <View style={styles.tilesRow}>
          <View style={[styles.tile, { borderTopColor: '#4F46E5' }]}>
            <Ionicons name="calendar" size={18} color="#4F46E5" />
            <Text style={[styles.tileNum, { color: '#4F46E5' }]}>{stats.thisMonth}</Text>
            <Text style={styles.tileLbl}>This Month</Text>
          </View>
          <View style={[styles.tile, { borderTopColor: '#0369A1' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#0369A1" />
            <Text style={[styles.tileNum, { color: '#0369A1' }]}>{stats.total}</Text>
            <Text style={styles.tileLbl}>Total Visits</Text>
          </View>
          <View style={[styles.tile, { borderTopColor: '#7C3AED' }]}>
            <Ionicons name="cash" size={18} color="#7C3AED" />
            <Text style={[styles.tileNum, { color: '#7C3AED', fontSize: 13 }]}>{currentUser.feeStatus}</Text>
            <Text style={styles.tileLbl}>Fee Status</Text>
          </View>
        </View>

        {/* ── Section: Personal ── */}
        <SectionLabel title="Personal" icon="person-circle-outline" />
        <View style={styles.infoCard}>
          <InfoItem icon="person-outline"   label="Name"     value={currentUser.name} />
          <InfoItem icon="at-outline"        label="Username" value={currentUser.username} />
          <InfoItem icon="call-outline"      label="Mobile"   value={currentUser.mobile} last />
        </View>

        {/* ── Section: Membership ── */}
        <SectionLabel title="Membership" icon="card-outline" />
        <View style={styles.infoCard}>
          <InfoItem icon="calendar-outline"  label="Joined"   value={format(new Date(currentUser.joinDate), 'dd MMM yyyy')} />
          <InfoItem icon="hourglass-outline" label="Expires"  value={format(new Date(currentUser.expiryDate), 'dd MMM yyyy')} />
          <InfoItem
            icon="time-outline"
            label="Days Left"
            value={stats.isExpired ? 'Expired' : `${Math.max(stats.daysLeft, 0)} days`}
            valueColor={daysLeftColor}
          />
          <InfoItem icon="cash-outline"   label="Fee Status" value={currentUser.feeStatus}         valueColor={feeColor} />
          <InfoItem icon="wallet-outline" label="Fee Amount"  value={`Rs ${currentUser.feeAmount}`} last />
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity onPress={onLogout} activeOpacity={0.85} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={17} color="#DC2626" />
          <Text style={styles.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.secLabel}>
      <Ionicons name={icon} size={14} color="#6366F1" />
      <Text style={styles.secLabelTxt}>{title}</Text>
    </View>
  );
}

function InfoItem({ icon, label, value, valueColor, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; valueColor?: string; last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={15} color="#94A3B8" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '800' } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40, gap: 0 },

  // ── Profile card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#E8EDFB',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  avatarWrap: {
    margin: 16, position: 'relative',
    width: 68, height: 68,
  },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: '#4F46E5' },
  editDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  cardInfo: { flex: 1, paddingVertical: 16 },
  cardName:     { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  cardUsername: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginBottom: 8 },
  cardBadges:   { flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  daysPill: { paddingHorizontal: 16, alignItems: 'center' },
  daysNum:  { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  daysSub:  { fontSize: 10, fontWeight: '600', color: '#94A3B8', textAlign: 'center', lineHeight: 14 },

  // ── Tiles ──
  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tile: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    borderTopWidth: 3, gap: 3,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  tileNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  tileLbl: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },

  // ── Section label ──
  secLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, marginTop: 4, paddingHorizontal: 4,
  },
  secLabelTxt: {
    fontSize: 12, fontWeight: '800',
    color: '#64748B', letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Info card ──
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  infoLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // ── Sign out ──
  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FEE2E2',
    marginTop: 4,
  },
  signOutTxt: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
});
