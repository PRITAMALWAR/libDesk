import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAppStore, type NotificationCategory } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';
import { CATEGORY_META, resolveNotificationCategory } from '../../constants/notificationCategoryUi';

type FilterTab = 'all' | 'reminders' | 'updates';

type RowItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  isSystem: boolean;
  category: NotificationCategory;
};

export default function StudentNotifications() {
  const currentUser = useAppStore((state) => state.currentUser);
  const notifications = useAppStore((state) => state.notifications);
  const users = useAppStore((state) => state.users);
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const getStudentNotifications = useAppStore((state) => state.getStudentNotifications);
  const scrollBottom = useScrollBottomForTabBar();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      await fetchNotifications(currentUser.id);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser, fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) fetchNotifications(currentUser.id);
    }, [currentUser, fetchNotifications])
  );

  const sortedRows: RowItem[] = useMemo(() => {
    if (!currentUser) return [];
    const raw = getStudentNotifications(currentUser.id);
    return [...raw]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((n) => {
        const isSystem = n.id.startsWith('sys-');
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          date: n.date,
          isSystem,
          category: resolveNotificationCategory(n.category, isSystem),
        };
      });
  }, [currentUser, getStudentNotifications, notifications, users]);

  const filtered = useMemo(() => {
    if (filter === 'reminders') return sortedRows.filter((r) => r.isSystem);
    if (filter === 'updates') return sortedRows.filter((r) => !r.isSystem);
    return sortedRows;
  }, [sortedRows, filter]);

  const reminderCount = sortedRows.filter((r) => r.isSystem).length;
  const updateCount = sortedRows.filter((r) => !r.isSystem).length;

  const renderNotif = ({ item, index }: { item: RowItem; index: number }) => {
    const meta = CATEGORY_META[item.category];
    const isLast = index === filtered.length - 1;

    let relative: string;
    try {
      relative = formatDistanceToNow(new Date(item.date), { addSuffix: true });
    } catch {
      relative = '';
    }

    return (
      <View style={styles.timelineRow}>
        <View style={styles.rail}>
          <View
            style={[
              styles.railDot,
              {
                backgroundColor: item.isSystem ? '#F59E0B' : meta.color,
                borderColor: item.isSystem ? '#FEF3C7' : meta.bg,
              },
            ]}
          />
          {!isLast && <View style={styles.railLine} />}
        </View>

        <View style={styles.cardWrap}>
          <View
            style={[
              styles.card,
              item.isSystem && styles.cardSystem,
              !item.isSystem && { borderTopColor: meta.color },
            ]}
          >
            <View style={styles.cardTopBar}>
              <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                <Ionicons
                  name={item.isSystem ? 'alert-circle' : meta.icon}
                  size={22}
                  color={item.isSystem ? '#D97706' : meta.color}
                />
              </View>
              <View style={styles.cardHeadText}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#94A3B8" />
                  <Text style={styles.metaRelative}>{relative}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaFull}>
                    {format(new Date(item.date), 'MMM d, yyyy · h:mm a')}
                  </Text>
                </View>
              </View>
              {!item.isSystem && (
                <View style={[styles.pill, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                  <Text style={[styles.pillText, { color: meta.color }]}>{meta.short}</Text>
                </View>
              )}
              {item.isSystem && (
                <View style={[styles.pill, styles.pillAlert]}>
                  <Text style={styles.pillAlertText}>Reminder</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="mail-unread-outline" size={28} color="#fff" />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroKicker}>Library inbox</Text>
            <Text style={styles.heroTitle}>Stay in the loop</Text>
            <Text style={styles.heroSub}>
              Announcements, closures, festivals, and membership reminders — all in one place.
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.filterLabel}>Show</Text>
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all' as const, label: 'All', count: sortedRows.length },
            { key: 'updates' as const, label: 'Updates', count: updateCount },
            { key: 'reminders' as const, label: 'Reminders', count: reminderCount },
          ] as const
        ).map((tab) => {
          const on = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              android_ripple={null}
              style={[styles.filterChip, on && styles.filterChipOn]}
            >
              <Text style={[styles.filterChipText, on && styles.filterChipTextOn]}>{tab.label}</Text>
              {tab.count > 0 && (
                <View style={[styles.filterCount, on && styles.filterCountOn]}>
                  <Text style={[styles.filterCountText, on && styles.filterCountTextOn]}>{tab.count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {filtered.length > 0 && (
        <Text style={styles.listSectionTitle}>Activity</Text>
      )}
    </>
  );

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNotif}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: scrollBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-outline" size={40} color="#A5B4FC" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'Nothing here yet' : 'No items in this filter'}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'When your library posts news or reminders, they will show up here.'
                : 'Try another tab or pull down to refresh.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    backgroundColor: '#1E1B4B',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#312E81',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipOn: {
    backgroundColor: '#312E81',
    borderColor: '#312E81',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextOn: {
    color: '#fff',
  },
  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountOn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  filterCountTextOn: {
    color: '#fff',
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rail: {
    width: 22,
    alignItems: 'center',
    marginRight: 4,
  },
  railDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    marginTop: 22,
    zIndex: 2,
  },
  railLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: '#E2E8F0',
    marginTop: -2,
    marginBottom: -8,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 4,
    borderTopColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#EEF2FF',
    ...theme.shadow.card,
  },
  cardSystem: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderTopColor: '#F59E0B',
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  metaRelative: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  metaDot: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  metaFull: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillAlert: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  pillAlertText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardMessage: {
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
  },
});
