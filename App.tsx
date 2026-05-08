import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette } from './src/styles/theme';
import { initAnalytics, trackEvent, AnalyticsEvents } from './src/utils/posthog';

WebBrowser.maybeCompleteAuthSession();

// Boot PostHog once at module load. Anonymous distinct id by default — we only
// call identify() after a successful sign-in (see useAuth). Init is fire-and-
// forget; analytics must never block app start.
initAnalytics().then(() => {
  trackEvent(AnalyticsEvents.APP_OPENED);
});

// Apply Inter as the default font for every Text in the app. RN's fontWeight
// prop maps to the matching Inter weight via iOS font synthesis; for explicit
// per-weight families use `fonts.family.interBlack` etc. from theme.
const applyInterAsDefault = () => {
  const TextWithDefaults = Text as unknown as { defaultProps?: { style?: object } };
  TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
  TextWithDefaults.defaultProps.style = [
    { fontFamily: 'Inter_400Regular' },
    TextWithDefaults.defaultProps.style,
  ];
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (fontsLoaded) applyInterAsDefault();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
