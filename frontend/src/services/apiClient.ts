import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the backend base URL depending on the platform:
 * - If explicitly set in app.json extra.apiBaseUrl, use that.
 * - Web: localhost works directly.
 * - Android emulator: 10.0.2.2 maps to the host machine's localhost.
 * - iOS simulator / physical device: localhost works on iOS simulator;
 *   for physical devices the user should set extra.apiBaseUrl to their LAN IP.
 */
function getBaseUrl(): string {
  const explicit = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (explicit && explicit.length > 0) return explicit;

  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

const API_BASE_URL = getBaseUrl();
const AUTH_TOKEN_KEY = 'authToken';

console.log('[EcoHabit] API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Callback set by AuthContext to handle forced logout on 401
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: clear token and redirect on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
