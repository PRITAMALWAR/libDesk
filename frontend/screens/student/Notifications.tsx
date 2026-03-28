import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAppStore, type NotificationCategory } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';
import { CATEGORY_META, resolveNotificationCategory } from '../../constants/notificationCategoryUi';

type RowItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  isSystem: boolean;
  category: NotificationCategory;
};

const ACCENT: Record<string, string> = {
  general:  '#6366F1',
  festival: '#F59E0B',
  closure:  '#EF4444',
  hours:    '#3B82F6',
  rules:    '#10B981',
  event:    '#8B5CF6',
  system:   '#F59E0B',
};

export default function StudentNotifications() {
  const currentUser        = useAppStore((s) => s.currentUser);
  const notifications      = useAppStore((s) => s.notifications);
  const users              = useAppStore((s) => s.users);
  const fetchNotifications = useAppStore((s) => s.fetchNotifications);
  const getStudentNotifs   = useAppStore((s) => s.getStudentNotifications);
  const markNotifsRead     = useAppStore((s) => s.markNotifsRead);
  const scrollBottom       = useScrollBottomForTabBar();

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try { await fetchNotifications(currentUser.id); }
    finally { setRefreshing(false); }
  }, [currentUser, fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchNotifications(currentUser.id);
        markNotifsRead();
      }
    }, [currentUser, fetchNotifications, markNotifsRead])
  );

  const rows: RowItem[] = useMemo(() => {
    if (!currentUser) return [];
    return [...getStudentNotifs(currentUser.id)]
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
  }, [currentUser, getStudentNotifs, notifications, users]);

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: scrollBottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />
        }
        ListHeaderComponent={null}
        renderItem={({ item }) => {
          const meta   = CATEGORY_META[item.category];
          const accent = item.isSystem ? ACCENT.system : (ACCENT[item.category] ?? '#6366F1');
          let ago = '';
          try { ago = formatDistanceToNow(new Date(item.date), { addSuffix: true }); } catch {}

          return (
            <View style={styles.card}>
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
              <View style={styles.cardBody}>
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons
                    name={item.isSystem ? 'alert-circle' : meta.icon}
                    size={18}
                    color={item.isSystem ? '#D97706' : meta.color}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMsg}>{item.message}</Text>
                  <Text style={styles.cardTime}>{ago}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Library announcements will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  heading: {
    fontSize: 24, fontWeight: '800', color: '#0F172A',
    letterSpacing: -0.4, marginBottom: 16,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  accentBar: { width: 4 },
  cardBody: {
    flex: 1, flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14, gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: '#0F172A',
    lineHeight: 20, marginBottom: 4,
  },
  cardMsg: {
    fontSize: 13, color: '#64748B', lineHeight: 19,
    fontWeight: '400', marginBottom: 6,
  },
  cardTime: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },

  emptyWrap:  { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptySub:   { marginTop: 4, fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
