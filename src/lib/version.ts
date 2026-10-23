import Constants from 'expo-constants';

/** Single source of truth for every in-app version label. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.1.0';
