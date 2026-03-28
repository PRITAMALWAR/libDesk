import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScrollBottomForTabBar } from '../../hooks/useScrollBottomForTabBar';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [titleFocus, setTitleFocus] = useState(false);
  const [msgFocus, setMsgFocus] = useState(false);

  const notifications = useAppStore((s) => s.notifications);
  const fetchNotifications = useAppStore((s) => s.fetchNotifications);
  const sendNotification = useAppStore((s) => s.sendNotification);
  const scrollBottom = useScrollBottomForTabBar();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchNotifications(); } finally { setRefreshing(false); }
  }, [fetchNotifications]);

  const handleSend = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      Alert.alert('Missing details', 'Please enter a title and message.');
      return;
    }
    setSending(true);
    try {
      const result = await sendNotification(t, m, 'all', 'general');
      if (!result.ok) {
        Alert.alert('Could not send', result.message || 'Please try again.');
        return;
      }
      setTitle('');
      setMessage('');
      Alert.alert('✓ Sent', 'Notification delivered to all students.');
    } finally {
      setSending(false);
    }
  };

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sorted = [...notifications]
    .filter((n) => new Date(n.date).getTime() >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ListHeader = (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="megaphone" size={20} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Send Notification</Text>
          <Text style={styles.pageSub}>Broadcast a message to all students</Text>
        </View>
      </View>

      {/* Compose card */}
      <View style={styles.card}>
        {/* Title */}
        <Text style={styles.fieldLabel}>Title / Reason</Text>
        <View style={[styles.inputWrap, titleFocus && styles.inputWrapFocus]}>
          <Ionicons
            name="create-outline" size={16}
            color={titleFocus ? '#4F46E5' : '#94A3B8'}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Library closed tomorrow"
            placeholderTextColor="#CBD5E1"
            style={styles.textInput}
            onFocus={() => setTitleFocus(true)}
            onBlur={() => setTitleFocus(false)}
            returnKeyType="next"
          />
        </View>

        {/* Message */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Message</Text>
        <View style={[styles.inputWrap, styles.textAreaWrap, msgFocus && styles.inputWrapFocus]}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here…"
            placeholderTextColor="#CBD5E1"
            style={[styles.textInput, styles.textArea]}
            multiline
            textAlignVertical="top"
            onFocus={() => setMsgFocus(true)}
            onBlur={() => setMsgFocus(false)}
          />
        </View>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={sending}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && !sending && { opacity: 0.88 },
            sending && { opacity: 0.6 },
          ]}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnTxt}>Send to all students</Text>
              </>
          }
        </Pressable>
      </View>

      {/* History header */}
      {sorted.length > 0 && (
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Sent history</Text>
          <Text style={styles.historyCount}>{sorted.length} · last 30 days</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.cardRow}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="notifications-outline" size={16} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDate}>
                  {format(new Date(item.date), 'MMM d, yyyy · h:mm a')}
                </Text>
              </View>
              <View style={styles.allBadge}>
                <Ionicons name="people-outline" size={11} color="#4F46E5" />
                <Text style={styles.allBadgeTxt}>All</Text>
              </View>
            </View>
            <Text style={styles.cardMsg}>{item.message}</Text>
          </View>
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: scrollBottom }]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTxt}>No notifications sent yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  // Page header
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 18,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  pageSub: { fontSize: 13, fontWeight: '500', color: '#94A3B8', marginTop: 2 },

  // Compose card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8EDFB',
    ...Platform.select({
      ios: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 2 },
    }),
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '700',
    color: '#64748B', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FAFBFF',
  },
  inputWrapFocus: {
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
  },
  textAreaWrap: {
    alignItems: 'flex-start',
    minHeight: 110,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500',
  },
  textArea: {
    minHeight: 90,
    lineHeight: 22,
  },
  sendBtn: {
    marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 14,
  },
  sendBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // History
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  historyCount: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },

  historyCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E8EDFB',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  cardDate: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  allBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  allBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  cardMsg: { fontSize: 13, color: '#475569', lineHeight: 20 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { marginTop: 10, fontSize: 15, fontWeight: '600', color: '#94A3B8' },
});
