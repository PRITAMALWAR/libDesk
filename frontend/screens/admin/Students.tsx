import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAppStore, FeeStatus } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';
import { FLOATING_TAB_BAR_TOP_BUFFER } from '../../constants/tabBar';

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const users = useAppStore((state) => state.users);
  const fetchStudents = useAppStore((state) => state.fetchStudents);
  const deleteStudent = useAppStore((state) => state.deleteStudent);
  const toggleBlockStudent = useAppStore((state) => state.toggleBlockStudent);
  const navigation = useNavigation<any>();

  const scrollBottom = useScrollBottomForTabBar();
  const fabBottom = scrollBottom - FLOATING_TAB_BAR_TOP_BUFFER + 10;

  const parentNav = useCallback(() => navigation.getParent(), [navigation]);

  const goForm = (studentId?: string) => {
    parentNav()?.navigate('AdminStudentForm', studentId ? { studentId } : undefined);
  };

  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      sortedStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          s.mobile.includes(searchQuery.trim()) ||
          s.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ),
    [sortedStudents, searchQuery]
  );

  const stats = useMemo(() => {
    const active = students.filter((s) => differenceInDays(new Date(s.expiryDate), new Date()) >= 0).length;
    return { total: students.length, active };
  }, [students]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStudents();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStudents]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete student', `Remove ${name} from the library? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteStudent(id);
          if (!result.ok) {
            Alert.alert('Error', result.message || 'Could not delete student.');
          }
        },
      },
    ]);
  };

  const handleBlock = (id: string, name: string, blocked: boolean) => {
    Alert.alert(
      blocked ? 'Unblock student' : 'Block student',
      blocked ? `Allow ${name} to use the app again?` : `Block ${name} from signing in?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocked ? 'Unblock' : 'Block',
          style: blocked ? 'default' : 'destructive',
          onPress: async () => {
            const result = await toggleBlockStudent(id);
            if (!result.ok) {
              Alert.alert('Error', result.message || 'Could not update status.');
            }
          },
        },
      ]
    );
  };

  const renderStudent = ({ item }: { item: (typeof students)[0] }) => {
    const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
    const expired = daysLeft < 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardMain} onPress={() => goForm(item.id)} activeOpacity={0.75}>
          <View style={[styles.avatar, item.isBlocked && styles.avatarBlocked]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.name}
              </Text>
              <FeePill status={item.feeStatus} />
            </View>
            <Text style={styles.studentUser} numberOfLines={1}>
              @{item.username} · {item.mobile}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusDot, expired ? styles.dotBad : styles.dotOk]} />
              <Text style={styles.metaText}>
                {expired ? 'Expired' : `${Math.max(0, daysLeft)} days left`}
              </Text>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.metaText}>₹{item.feeAmount}</Text>
              {item.isBlocked && (
                <>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.metaBlocked}>Blocked</Text>
                </>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionChip} onPress={() => goForm(item.id)} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.actionChipText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipMuted]}
            onPress={() => handleBlock(item.id, item.name, item.isBlocked)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={item.isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
              size={18}
              color={item.isBlocked ? '#059669' : '#DC2626'}
            />
            <Text style={[styles.actionChipText, { color: item.isBlocked ? '#059669' : '#DC2626' }]}>
              {item.isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipDanger]}
            onPress={() => handleDelete(item.id, item.name)}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={[styles.actionChipText, { color: '#DC2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.flex}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{stats.total}</Text>
            <Text style={styles.summaryLab}>Students</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: '#059669' }]}>{stats.active}</Text>
            <Text style={styles.summaryLab}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{filteredStudents.length}</Text>
            <Text style={styles.summaryLab}>Showing</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, username, mobile…"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottom + 56 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={44} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {students.length === 0 ? 'No students yet' : 'No matches'}
              </Text>
              <Text style={styles.emptySub}>
                {students.length === 0
                  ? 'Add your first library member to see them here.'
                  : 'Try a different search term.'}
              </Text>
              {students.length === 0 && (
                <TouchableOpacity style={styles.emptyCta} onPress={() => goForm()} activeOpacity={0.9}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyCtaText}>Add student</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={() => goForm()} activeOpacity={0.92} accessibilityLabel="Add student">
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FeePill({ status }: { status: FeeStatus }) {
  const paid = status === 'Paid';
  const half = status === 'Half Paid';
  return (
    <View style={[styles.feePill, paid ? styles.fpPaid : half ? styles.fpHalf : styles.fpPending]}>
      <Text style={[styles.feePillText, paid ? styles.fptPaid : half ? styles.fptHalf : styles.fptPending]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  flex: { flex: 1 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  summaryLab: { marginTop: 2, fontSize: 11, fontWeight: '700', color: theme.colors.mutedText, textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 36, backgroundColor: theme.colors.border },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: theme.text.md,
    color: theme.colors.text,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 0,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlocked: { backgroundColor: '#FEE2E2' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#4338CA' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentName: { flex: 1, fontSize: 16, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.2 },
  studentUser: { marginTop: 4, fontSize: 13, color: theme.colors.mutedText, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  dotOk: { backgroundColor: '#10B981' },
  dotBad: { backgroundColor: '#EF4444' },
  metaText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  metaSep: { marginHorizontal: 6, color: '#CBD5E1', fontWeight: '700' },
  metaBlocked: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  feePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, maxWidth: 110 },
  feePillText: { fontSize: 10, fontWeight: '800' },
  fpPaid: { backgroundColor: '#DCFCE7' },
  fptPaid: { color: '#166534' },
  fpHalf: { backgroundColor: '#FEF3C7' },
  fptHalf: { color: '#92400E' },
  fpPending: { backgroundColor: '#FEE2E2' },
  fptPending: { color: '#991B1B' },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  actionChipMuted: { backgroundColor: '#F1F5F9' },
  actionChipDanger: { backgroundColor: '#FEF2F2' },
  actionChipText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '800', color: theme.colors.text },
  emptySub: { marginTop: 6, fontSize: 14, color: theme.colors.mutedText, textAlign: 'center', lineHeight: 20 },
  emptyCta: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
