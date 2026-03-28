import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAppStore, NotificationCategory } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import AppInput from '../../components/ui/AppInput';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';
import { CATEGORY_META, CATEGORY_ORDER } from '../../constants/notificationCategoryUi';
type QuickTemplate = {
  id: string;
  category: NotificationCategory;
  chipLabel: string;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'fest-diwali',
    category: 'festival',
    chipLabel: 'Festival',
    title: 'Festival greetings',
    message:
      'Warm wishes on this festive occasion from the library team! Regular timings will resume after the holiday. Happy reading!',
    icon: 'sparkles-outline',
  },
  {
    id: 'close-day',
    category: 'closure',
    chipLabel: 'Library closed',
    title: 'Library closed — notice',
    message:
      'The library will remain closed on [DATE] due to [REASON]. Please plan your visits accordingly. We apologise for any inconvenience.',
    icon: 'close-circle-outline',
  },
  {
    id: 'timing',
    category: 'hours',
    chipLabel: 'New timings',
    title: 'Updated library hours',
    message:
      'Please note our revised timings: Weekdays [TIME], Saturday [TIME], Sunday closed. Thank you for your cooperation.',
    icon: 'alarm-outline',
  },
  {
    id: 'rules',
    category: 'rules',
    chipLabel: 'Rules reminder',
    title: 'Library rules reminder',
    message:
      'Kindly maintain silence, handle books with care, and show your membership at entry. Mobile phones on silent inside the reading area. Thank you!',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'event',
    category: 'event',
    chipLabel: 'Book / event',
    title: 'Special event at the library',
    message:
      'You are invited to [EVENT NAME] on [DATE] at [TIME]. All members are welcome. See you there!',
    icon: 'people-outline',
  },
  {
    id: 'general',
    category: 'general',
    chipLabel: 'General note',
    title: 'Announcement',
    message: 'This is a quick message to all members: ',
    icon: 'notifications-outline',
  },
];

type FilterKey = 'all' | NotificationCategory;

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('general');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const notifications = useAppStore((state) => state.notifications);
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const sendNotification = useAppStore((state) => state.sendNotification);
  const scrollBottom = useScrollBottomForTabBar();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  const filtered = useMemo(() => {
    const list = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter === 'all') return list;
    return list.filter((n) => (n.category || 'general') === filter);
  }, [notifications, filter]);

  const applyTemplate = (t: QuickTemplate) => {
    setCategory(t.category);
    setTitle(t.title);
    setMessage(t.message);
  };

  const handleSend = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      Alert.alert('Missing details', 'Please enter a title and message.');
      return;
    }
    setSending(true);
    try {
      const result = await sendNotification(t, m, 'all', category);
      if (!result.ok) {
        Alert.alert('Could not send', result.message || 'Please try again.');
        return;
      }
      setTitle('');
      setMessage('');
      setCategory('general');
      Alert.alert('Sent', 'All students will see this in their Notifications tab.');
    } finally {
      setSending(false);
    }
  };

  const renderNotif = ({ item }: { item: (typeof notifications)[0] }) => {
    const cat = (item.category || 'general') as NotificationCategory;
    const meta = CATEGORY_META[cat];
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyTop}>
          <View style={[styles.typeDot, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={styles.historyHeadText}>
            <Text style={styles.historyTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.historyDate}>{format(new Date(item.date), 'MMM d, yyyy · h:mm a')}</Text>
          </View>
          <View style={[styles.badgeMini, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Text style={[styles.badgeMiniText, { color: meta.color }]}>{meta.short}</Text>
          </View>
        </View>
        <Text style={styles.historyMessage}>{item.message}</Text>
        <View style={styles.historyFooter}>
          <Ionicons name="people-outline" size={14} color="#94A3B8" />
          <Text style={styles.historyTarget}>
            {item.targetId === 'all' ? 'All students' : 'Specific member'}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="paper-plane" size={26} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Broadcast centre</Text>
        <Text style={styles.heroSub}>
          Send festival wishes, closure notices, timing changes, and library updates to every student in one tap.
        </Text>
      </View>

      <View style={styles.compose}>
        <Text style={styles.blockLabel}>Message type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {CATEGORY_ORDER.map((key) => {
            const m = CATEGORY_META[key];
            const on = category === key;
            return (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                android_ripple={null}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: on ? m.color : m.bg,
                    borderColor: m.border,
                  },
                ]}
              >
                <Ionicons name={m.icon} size={16} color={on ? '#fff' : m.color} />
                <Text style={[styles.typeChipText, { color: on ? '#fff' : m.color }]}>{m.short}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.blockLabel}>Quick templates</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateRow}
        >
          {QUICK_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => applyTemplate(t)}
              android_ripple={null}
              style={({ pressed }) => [styles.templateCard, pressed && styles.templateCardPressed]}
            >
              <View style={[styles.templateIcon, { backgroundColor: CATEGORY_META[t.category].bg }]}>
                <Ionicons name={t.icon} size={20} color={CATEGORY_META[t.category].color} />
              </View>
              <Text style={styles.templateLabel} numberOfLines={2}>
                {t.chipLabel}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.blockLabel}>Compose</Text>
        <AppInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#94A3B8"
        />
        <AppInput
          style={[styles.input, styles.textArea]}
          placeholder="Message (edit template placeholders like [DATE] before sending)"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholderTextColor="#94A3B8"
        />
        <Pressable
          onPress={handleSend}
          disabled={sending}
          android_ripple={null}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && !sending && styles.sendBtnPressed,
            sending && styles.sendBtnDisabled,
          ]}
        >
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.sendBtnText}>{sending ? 'Sending…' : 'Send to all students'}</Text>
        </Pressable>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historySectionTitle}>Sent history</Text>
        <Text style={styles.historyCount}>{notifications.length} total</Text>
      </View>

      <Text style={styles.filterHint}>Filter by type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          onPress={() => setFilter('all')}
          android_ripple={null}
          style={[styles.filterChip, filter === 'all' && styles.filterChipOn]}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextOn]}>All</Text>
        </Pressable>
        {CATEGORY_ORDER.map((key) => {
          const m = CATEGORY_META[key];
          const on = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              android_ripple={null}
              style={[
                styles.filterChip,
                on && { backgroundColor: m.bg, borderColor: m.border },
              ]}
            >
              <Text style={[styles.filterChipText, on && { color: m.color, fontWeight: '800' }]}>
                {m.short}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNotif}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: scrollBottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No messages in this filter</Text>
            <Text style={styles.emptySub}>Try “All” or send your first announcement above.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    fontWeight: '500',
  },
  compose: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  typeRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 18,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  templateRow: {
    paddingBottom: 4,
    marginBottom: 18,
    gap: 10,
  },
  templateCard: {
    width: 104,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  templateCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 16,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    minHeight: 52,
    borderRadius: 14,
  },
  sendBtnPressed: {
    opacity: 0.92,
  },
  sendBtnDisabled: {
    opacity: 0.65,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipOn: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextOn: {
    color: '#fff',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  typeDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyHeadText: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyDate: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  badgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  historyMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
