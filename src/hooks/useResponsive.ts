import { useWindowDimensions } from 'react-native';

/**
 * Tablet detection from current window width. 768 is the iPad mini portrait
 * floor — anything above is treated as tablet (any iPad in any orientation,
 * any large foldable). Below stays phone.
 *
 * `useWindowDimensions` re-renders the consumer on rotation, so split-view
 * resizes flow through automatically without a listener.
 */
export const useIsTablet = (): boolean => {
  const { width } = useWindowDimensions();
  return width >= 768;
};


/**
 * Content max-width for the centered tab column.
 *
 *   <768pt   phone           500   (iPhone family)
 *   768–999  small tablet    720   (iPad mini / 11")
 *   ≥1000    large tablet    880   (iPad Pro 13" / Air 13")
 *
 * The two tablet tiers are tuned so cards take ~85% of screen width on
 * either size — a flat 720 leaves the 13" feeling like a stretched 11"
 * with dead gutter rails.
 */
export const useContentMaxWidth = (): number => {
  const { width } = useWindowDimensions();
  if (width >= 1000) return 880;
  if (width >= 768) return 720;
  return 500;
};
