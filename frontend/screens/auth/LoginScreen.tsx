import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [username,  setUsername]  = useState('');
  const [pin,       setPin]       = useState('');
  const [showPin,   setShowPin]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [pinFocus,  setPinFocus]  = useState(false);
  const login = useAppStore((s) => s.login);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!username.trim() || !pin.trim()) {
      Alert.alert('Required', 'Please enter your username and PIN.');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), pin.trim());
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Couldn't sign in", result.message || 'Invalid credentials or account blocked.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Hero top ── */}
      <LinearGradient
        colors={['#1E1B4B', '#3730A3', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        {/* Decorative circles */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="library" size={28} color="#fff" />
          </View>
        </View>
        <Text style={styles.brandName}>libDesk</Text>
        <Text style={styles.brandTagline}>Your Library, Simplified</Text>

        {/* 3 stat pills */}
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Ionicons name="people-outline" size={14} color="#C7D2FE" />
            <Text style={styles.statTxt}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Ionicons name="qr-code-outline" size={14} color="#C7D2FE" />
            <Text style={styles.statTxt}>Attendance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Ionicons name="notifications-outline" size={14} color="#C7D2FE" />
            <Text style={styles.statTxt}>Alerts</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── White bottom card ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Sign in to your library account</Text>

              {/* Username */}
              <View style={styles.fieldWrap}>
                <View style={[styles.fieldRow, userFocus && styles.fieldRowFocus]}>
                  <Ionicons
                    name="person-outline" size={18}
                    color={userFocus ? '#4F46E5' : '#94A3B8'}
                  />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username or mobile"
                    placeholderTextColor="#CBD5E1"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                  />
                </View>
              </View>

              {/* PIN */}
              <View style={styles.fieldWrap}>
                <View style={[styles.fieldRow, pinFocus && styles.fieldRowFocus]}>
                  <Ionicons
                    name="lock-closed-outline" size={18}
                    color={pinFocus ? '#4F46E5' : '#94A3B8'}
                  />
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    placeholder="PIN / Password"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry={!showPin}
                    style={[styles.input, { flex: 1 }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onFocus={() => setPinFocus(true)}
                    onBlur={() => setPinFocus(false)}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPin((p) => !p)} hitSlop={8}>
                    <Ionicons
                      name={showPin ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign in button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.btn, loading && { opacity: 0.7 }]}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Text style={styles.btnTxt}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>

              {/* Security note */}
              <View style={styles.secureRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#94A3B8" />
                <Text style={styles.secureTxt}>Your session is encrypted and secured</Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Ionicons name="information-circle-outline" size={13} color="#6366F1" />
        <Text style={styles.footerHintTxt}>Contact your library admin if you need access</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },

  // ── Hero ──
  hero: {
    height: SCREEN_H * 0.38,
    paddingHorizontal: 28,
    paddingBottom: 28,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decCircle2: {
    position: 'absolute', top: 30, right: 60,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  brandRow: {
    marginBottom: 12,
  },
  brandIcon: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  brandName: {
    fontSize: 32, fontWeight: '800',
    color: '#fff', letterSpacing: -0.8,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14, fontWeight: '500',
    color: '#A5B4FC', marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    gap: 10,
  },
  statPill:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statTxt:     { fontSize: 12, fontWeight: '600', color: '#C7D2FE' },
  statDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── Scroll / card ──
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8EDFB',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 4 },
    }),
  },
  cardTitle: {
    fontSize: 22, fontWeight: '800',
    color: '#0F172A', letterSpacing: -0.4, marginBottom: 4,
  },
  cardSub: {
    fontSize: 14, fontWeight: '500',
    color: '#94A3B8', marginBottom: 24,
  },

  // ── Fields ──
  fieldWrap: { marginBottom: 14 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: '#F8FAFC',
  },
  fieldRowFocus: {
    borderColor: '#4F46E5', backgroundColor: '#fff',
  },
  input: {
    flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500',
  },

  // ── Button ──
  btnWrap: { marginTop: 8, marginBottom: 16 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  btnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Secure note ──
  secureRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  secureTxt: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },

  // ── Footer ──
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EDFB',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerHintTxt: { fontSize: 12, fontWeight: '500', color: '#6366F1' },
});
