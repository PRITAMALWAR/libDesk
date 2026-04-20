import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExtraConfig = { apiPort?: number | string; apiProductionUrl?: string };

/**
 * Backend HTTP port — must match `PORT` in `backend/.env`.
 * Override: set `EXPO_PUBLIC_API_PORT` or `expo.extra.apiPort` in app.json.
 */
export function getApiPort(): number {
  const env = process.env.EXPO_PUBLIC_API_PORT;
  if (env !== undefined && env !== '' && !Number.isNaN(Number(env))) {
    return Number(env);
  }
  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const p = extra?.apiPort;
  if (p !== undefined && p !== '' && !Number.isNaN(Number(p))) {
    return Number(p);
  }
  return 5001;
}

/**
 * Base URL for API (no trailing slash).
 * Priority: EXPO_PUBLIC_API_URL → expo.extra.apiProductionUrl → LAN / localhost + apiPort (no URL in config).
 */
export function resolveApiBaseUrl(): string {
  const full = process.env.EXPO_PUBLIC_API_URL;
  if (full) {
    return full.replace(/\/$/, '');
  }

  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const deployed = extra?.apiProductionUrl?.trim();
  if (deployed) {
    return deployed.replace(/\/$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost;

  const host = hostUri?.split(':')[0];
  const port = getApiPort();

  if (host) {
    return `http://${host}:${port}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  return `http://localhost:${port}`;
}
