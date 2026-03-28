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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
    if (!username.trim() || !pin) {
      Alert.alert('Missing details', 'Enter your username or mobile and PIN.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    const result = await login(username.trim(), pin);
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Couldn't sign in", result.message || 'Invalid credentials or account blocked.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Background pattern dots on white */}
      <View style={styles.patternWrap} pointerEvents="none">
        {Array.from({ length: 48 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ── Navbar ── */}
        <View style={styles.navbar}>
          {/* Left: icon + app name */}
          <View style={styles.navLeft}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.navIcon}
            >
              <Ionicons name="library" size={15} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.navTitle}>libDesk</Text>
              <Text style={styles.navSub}>Library System</Text>
            </View>
          </View>

          {/* Right: help pill */}
          <View style={styles.navBadge}>
            <Ionicons name="headset-outline" size={14} color="#4F46E5" />
            <Text style={styles.navBadgeTxt}>Help</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            >

              {/* ── Card ── */}
              <View style={styles.card}>

                {/* Card header strip */}
                <LinearGradient
                  colors={['#4F46E5', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardHeader}
                >
                  {/* Decorative circles inside header */}
                  <View style={styles.headerCircle1} pointerEvents="none" />
                  <View style={styles.headerCircle2} pointerEvents="none" />

                  <View style={styles.headerContent}>
                    <View style={styles.headerIcon}>
                      <Ionicons name="library" size={22} color="#4F46E5" />
                    </View>
                    <View style={styles.headerTexts}>
                      <Text style={styles.headerTitle}>LIBRARY MANAGEMENT</Text>
                      <Text style={styles.headerSub}>Member Access Portal</Text>
                    </View>
                  </View>

                  {/* Notch cutouts (ticket effect) */}
                  <View style={[styles.notch, styles.notchLeft]} />
                  <View style={[styles.notch, styles.notchRight]} />
                </LinearGradient>

                {/* Dashed separator */}
                <View style={styles.dashedRow}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <View key={i} style={styles.dashSegment} />
                  ))}
                </View>

                {/* Card body */}
                <View style={styles.cardBody}>

                  <Text style={styles.signInTitle}>Sign in</Text>
                  <Text style={styles.signInSub}>Enter your member credentials below</Text>

                  {/* Username */}
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, userFocus && styles.fieldLabelActive]}>
                      Username or Mobile
                    </Text>
                    <View style={[styles.inputBox, userFocus && styles.inputBoxActive]}>
                      <Ionicons
                        name="person-outline" size={16}
                        color={userFocus ? '#4F46E5' : '#94A3B8'}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username or mobile"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="default"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        returnKeyType="next"
                        onFocus={() => setUserFocus(true)}
                        onBlur={() => setUserFocus(false)}
                      />
                    </View>
                  </View>

                  {/* PIN */}
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, pinFocus && styles.fieldLabelActive]}>
                      PIN / Password
                    </Text>
                    <View style={[styles.inputBox, pinFocus && styles.inputBoxActive]}>
                      <Ionicons
                        name="lock-closed-outline" size={16}
                        color={pinFocus ? '#4F46E5' : '#94A3B8'}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={pin}
                        onChangeText={setPin}
                        placeholder="Enter your PIN"
                        placeholderTextColor="#CBD5E1"
                        secureTextEntry={!showPin}
                        keyboardType="default"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="password"
                        style={[styles.input, { flex: 1 }]}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        onFocus={() => setPinFocus(true)}
                        onBlur={() => setPinFocus(false)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPin((s) => !s)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
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
                    style={[styles.btn, loading && { opacity: 0.85 }]}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGrad}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <>
                            <Text style={styles.btnTxt}>Sign In</Text>
                            <View style={styles.btnBadge}>
                              <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
                            </View>
                          </>
                      }
                    </LinearGradient>
                  </TouchableOpacity>

                </View>

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#4F46E5" />
                  <Text style={styles.cardFooterTxt}>Your access is encrypted and secured</Text>
                </View>

              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* ── Footer ── */}
        <View style={[styles.pageFooter, { paddingBottom: insets.bottom + 10 }]}>
          {/* Contact hint */}
          <View style={styles.footerHintRow}>
            <Ionicons name="information-circle-outline" size={13} color="#6366F1" />
            <Text style={styles.footerHintTxt}>
              Contact your library admin if you need access
            </Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerTop}>
            <View style={styles.footerBrand}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.footerIcon}>
                <Ionicons name="library" size={11} color="#fff" />
              </LinearGradient>
              <Text style={styles.footerBrandTxt}>libDesk</Text>
            </View>
            <View style={styles.footerLinks}>
              <View style={styles.footerDot} />
              <Text style={styles.footerLink}>Privacy</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerLink}>Terms</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerLink}>Support</Text>
            </View>
          </View>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} libDesk · Library Management System · v 1.0.0
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 18,
  },

  // Dot pattern background
  patternWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    gap: 22,
    opacity: 0.18,
  },
  dot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#4F46E5',
  },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
  },

  // Card header
  cardHeader: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30, left: 20,
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  headerIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  headerTexts: {},
  headerTitle: {
    fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 12, fontWeight: '500',
    color: 'rgba(255,255,255,0.65)', marginTop: 3,
  },

  // Ticket notch cutouts
  notch: {
    position: 'absolute', bottom: -14,
    width: 28, height: 28, borderRadius: 14,
  },
  notchLeft:  { left: -14, backgroundColor: '#fff' },
  notchRight: { right: -14, backgroundColor: '#fff' },

  // Dashed separator (hand-made)
  dashedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  dashSegment: {
    width: 6, height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },

  // Card body
  cardBody: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },

  signInTitle: {
    fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3,
  },
  signInSub: {
    fontSize: 13, fontWeight: '500', color: '#94A3B8',
    marginTop: 4, marginBottom: 24,
  },

  // Fields
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  fieldLabelActive: { color: '#4F46E5' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, minHeight: 52,
  },
  inputBoxActive: { borderColor: '#4F46E5', backgroundColor: '#FAFBFF' },
  input: {
    flex: 1, fontSize: 15, fontWeight: '600',
    color: '#0F172A', paddingVertical: 12,
  },

  // Button
  btn: {
    borderRadius: 14, overflow: 'hidden', marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12, paddingVertical: 16,
  },
  btnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  btnBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFBFF',
  },
  cardFooterTxt: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  footerLinkSep: { width: 1, height: 12, backgroundColor: '#E2E8F0' },
  versionPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
  },
  versionTxt: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  // Hint outside card
  hintTxt: {
    fontSize: 12, fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center', lineHeight: 18,
  },

  // ── Navbar ──
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDFB',
    backgroundColor: '#fff',
  },
  navLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  navIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2,
  },
  navSub: {
    fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 1,
  },
  navBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  navBadgeTxt: {
    fontSize: 11, fontWeight: '700', color: '#4F46E5',
  },

  // ── Page footer ──
  footerHintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 2,
  },
  footerHintTxt: {
    fontSize: 12, fontWeight: '500', color: '#6366F1', flex: 1,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8EDFB',
    marginBottom: 1,
  },
  pageFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EDFB',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 'auto',
    gap: 10,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  footerIcon: {
    width: 20, height: 20, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  footerBrandTxt: {
    fontSize: 12, fontWeight: '800', color: '#0F172A',
  },
  footerLinks: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  footerLink: {
    fontSize: 11, fontWeight: '600', color: '#64748B',
  },
  footerDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  footerCopy: {
    fontSize: 10, fontWeight: '500',
    color: '#CBD5E1', letterSpacing: 0.2,
  },
});
