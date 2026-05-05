import { useCallback, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

type ShareState = 'idle' | 'capturing' | 'sharing' | 'done' | 'error';

/**
 * Captures a hidden ShareableSummaryCard via `react-native-view-shot` and
 * hands the resulting PNG to the system share sheet (`expo-sharing`).
 *
 * Usage:
 *   const { ref, share, state } = useShareCard();
 *   <ShareableSummaryCard ref={ref} payload={...} />
 *   <Button onPress={share} disabled={state !== 'idle'} />
 */
export const useShareCard = () => {
  const ref = useRef<View>(null);
  const [state, setState] = useState<ShareState>('idle');
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(async () => {
    if (!ref.current) {
      setError('Card not mounted yet.');
      setState('error');
      return;
    }
    try {
      setError(null);
      setState('capturing');
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      setState('sharing');
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setError(
          Platform.OS === 'web'
            ? 'Sharing is not supported on web yet.'
            : 'Sharing is not available on this device.'
        );
        setState('error');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share',
        UTI: 'public.png',
      });
      setState('done');
    } catch (e) {
      console.warn('useShareCard.share failed', e);
      setError(e instanceof Error ? e.message : 'Could not share.');
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return { ref, share, state, error, reset };
};
