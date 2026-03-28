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
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAppStore((state) => state.login);

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
      <View style={styles.mesh}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              <View style={styles.card}>
                <View style={styles.iconWrap}>
                  <Ionicons name="library" size={32} color="#4338CA" />
                </View>
                <Text style={styles.title}>Library Manager</Text>
                <Text style={styles.sub}>Sign in</Text>

                <View style={styles.divider} />

                <View style={styles.field}>
                  <Text style={styles.label}>Username or mobile</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username or mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>PIN</Text>
                  <View style={styles.pinRow}>
                    <TextInput
                      value={pin}
                      onChangeText={setPin}
                      placeholder="PIN or password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPin}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      style={[styles.input, styles.pinInput]}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPin((s) => !s)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityRole="button"
                      accessibilityLabel={showPin ? 'Hide PIN' : 'Show PIN'}
                      style={styles.eyeBtn}
                    >
                      <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.cta, loading && styles.ctaBusy]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>Sign in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8EEF7',
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(129, 140, 248, 0.35)',
    top: -120,
    right: -100,
  },
  orb2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(96, 165, 250, 0.28)',
    bottom: '12%',
    left: -80,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196, 181, 253, 0.32)',
    top: '38%',
    right: -40,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  card: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 26,
    paddingVertical: 32,
    paddingHorizontal: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 10,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  title: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: theme.text.sm,
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
  divider: {
    marginTop: 22,
    marginBottom: 6,
    height: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },
  field: {
    marginTop: theme.spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: theme.text.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingRight: 8,
  },
  pinInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 52,
  },
  eyeBtn: {
    padding: 10,
  },
  cta: {
    marginTop: theme.spacing.xl,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaBusy: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
