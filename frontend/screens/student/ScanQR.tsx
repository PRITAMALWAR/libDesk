import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useAppStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { scrollPaddingBottom } from '../../constants/tabBar';

export default function StudentScanQR() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const markAttendance = useAppStore((state) => state.markAttendance);
  const navigation = useNavigation<any>();

  const scanBox = useMemo(() => {
    const w = width - theme.spacing.md * 2 - theme.spacing.lg * 2;
    const s = Math.round(Math.min(w * 0.62, 198));
    return Math.max(s, 148);
  }, [width]);

  const padBottom = scrollPaddingBottom(insets.bottom);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isSubmitting || scanned) return;
    setScanned(true);
    setIsSubmitting(true);

    const result = await markAttendance(data);

    if (result.ok && !result.alreadyMarked) {
      Alert.alert('Success', result.message || 'Attendance Marked', [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            navigation.navigate('Home');
          },
        },
      ]);
    } else if (result.ok && result.alreadyMarked) {
      Alert.alert('Already Marked', result.message || 'आज की attendance पहले से लग चुकी है', [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            navigation.navigate('Home');
          },
        },
      ]);
    } else {
      Alert.alert('Error', result.message || 'Invalid QR Code.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    }
    setIsSubmitting(false);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.permWrap}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.permText}>Camera…</Text>
      </SafeAreaView>
    );
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.permWrap}>
        <Ionicons name="camera-outline" size={22} color={theme.colors.danger} />
        <Text style={styles.permText}>Allow camera to scan</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <View style={[styles.inner, { paddingBottom: padBottom }]}>
        <Text style={styles.kicker}>Point at the library QR</Text>

        <View style={styles.cameraShell}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />

          <View style={styles.camOverlay} pointerEvents="none">
            <View style={styles.dimFlex} />
            <View style={[styles.midRow, { height: scanBox }]}>
              <View style={styles.dimFlex} />
              <View style={[styles.hole, { width: scanBox, height: scanBox }]}>
                <View style={[styles.tick, styles.tl]} />
                <View style={[styles.tick, styles.tr]} />
                <View style={[styles.tick, styles.bl]} />
                <View style={[styles.tick, styles.br]} />
              </View>
              <View style={styles.dimFlex} />
            </View>
            <View style={styles.dimFlex} />
          </View>

          {scanned && (
            <View style={styles.processing} pointerEvents="none">
              {isSubmitting ? (
                <View style={styles.processPill}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.processTxt}>Verifying</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.rulesWrap}>
          <Text style={styles.rulesHeading}>Before you scan</Text>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleStripe, { backgroundColor: '#4F46E5' }]} />
            <View style={styles.ruleBody}>
              <Text style={styles.ruleTitle}>Scan the code on the admin tablet</Text>
              <Text style={styles.ruleSub}>Staff: Attendance tab → generate or refresh the QR if scans fail.</Text>
            </View>
          </View>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleStripe, { backgroundColor: theme.colors.success }]} />
            <View style={styles.ruleBody}>
              <Text style={styles.ruleTitle}>Daily limit</Text>
              <Text style={styles.ruleSub}>One attendance per student per day</Text>
            </View>
          </View>
        </View>

        {scanned ? (
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => !isSubmitting && setScanned(false)}
            activeOpacity={0.88}
          >
            <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.outlineBtnTxt}>Scan again</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const T = 14;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  kicker: {
    fontSize: theme.text.sm,
    color: theme.colors.mutedText,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  cameraShell: {
    flex: 1,
    minHeight: 220,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    ...theme.shadow.card,
  },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dimFlex: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.52)',
  },
  midRow: {
    flexDirection: 'row',
  },
  hole: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    position: 'absolute',
    width: T,
    height: T,
    borderColor: '#EEF2FF',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  processing: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(79,70,229,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  processTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rulesWrap: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  rulesHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  ruleStripe: {
    width: 4,
  },
  ruleBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ruleSub: {
    fontSize: 12,
    color: theme.colors.mutedText,
    marginTop: 2,
    lineHeight: 16,
  },
  outlineBtn: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  outlineBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  permWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  permText: {
    fontSize: theme.text.sm,
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
});
