import React, { ReactNode } from 'react';
import { ImageBackground, ScrollView, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from './Header';
import { ErrorBoundary } from './ErrorBoundary';
import { useUser } from '../contexts/UserContext';
import { useAppData } from '../contexts/AppDataContext';
import { calculateXP } from '../features/workout/helpers';
import { deriveInitials } from '../utils/initials';
import { layoutStyles } from '../styles';
import { ASSETS } from '../constants/appConstants';
import { useContentMaxWidth } from '../hooks/useResponsive';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  children: ReactNode;
  /** Wrap the body in a ScrollView (default true). Set false for screens with their own scrollable content (e.g. FlatList). */
  scroll?: boolean;
  /** Hide the global header on this screen (e.g. modals). */
  hideHeader?: boolean;
  /** Error boundary fallback label. */
  errorLabel?: string;
  /** Optional override for the body container style. */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard authenticated screen shell: background image, overlay, safe area,
 * the global Header, and an ErrorBoundary so a crash in one screen doesn't
 * take down the navigator.
 */
export const ScreenLayout = ({
  children,
  scroll = true,
  hideHeader = false,
  errorLabel,
  contentStyle,
}: Props) => {
  const { user } = useUser();
  const { data } = useAppData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const username = user?.email?.split('@')[0] || user?.user_metadata?.full_name || 'User';
  const avatarInitials = deriveInitials(user?.email);
  const maxWidth = useContentMaxWidth();

  return (
    <ImageBackground
      source={{ uri: ASSETS.background }}
      style={layoutStyles.appContainer}
      resizeMode="cover"
    >
      <View style={layoutStyles.appOverlay} />
      {/* Header pads its own top inset, so when it's shown SafeAreaView skips
          the top edge to avoid double-padding. Hidden-header screens (modals
          without the brand bar) still need SafeAreaView's top inset. */}
      <SafeAreaView style={[layoutStyles.appContent, { maxWidth }]} edges={hideHeader ? ['top'] : []}>
        {!hideHeader && (
          <Header
            streak={data.gymLogs.length}
            xp={calculateXP(data)}
            onOpenProfile={() => navigation.navigate('Profile')}
            avatarInitials={avatarInitials}
            username={username}
          />
        )}
        {scroll ? (
          <ScrollView
            style={layoutStyles.mainContent}
            contentContainerStyle={[layoutStyles.mainContentContainer, contentStyle]}
          >
            <ErrorBoundary fallbackLabel={errorLabel}>{children}</ErrorBoundary>
          </ScrollView>
        ) : (
          <View style={[layoutStyles.mainContent, { flex: 1 }, contentStyle]}>
            <ErrorBoundary fallbackLabel={errorLabel}>{children}</ErrorBoundary>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};
