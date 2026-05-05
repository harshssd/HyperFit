import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LoadingState, EmptyState, ErrorState } from '../../components/StateView';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import {
  getNutritionHistoryPage,
  type NutritionDaySummary,
} from '../../services/nutritionService';
import { NutritionRow } from './components/NutritionRow';

const PAGE_SIZE = 14;

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * NUTRITION segment of the History modal. Paginated reader over
 * nutrition_day_summary_view, mirrors the workout History pattern
 * (page chevrons + page count, pull-to-refresh).
 */
export const NutritionHistoryView = () => {
  const { user } = useUser();
  const [rows, setRows] = useState<NutritionDaySummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const today = todayISO();

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const { rows: r, totalCount: t } = await getNutritionHistoryPage(user.id, page, PAGE_SIZE);
        setRows(r);
        setTotalCount(t);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load nutrition history');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id, page],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !refreshing) return <LoadingState label="Loading nutrition history" />;
  if (err) return <ErrorState message={err} onRetry={() => load()} />;
  if (totalCount === 0) {
    return (
      <EmptyState
        title="No nutrition logged yet"
        message="Log a meal or water on the Nutrition tab to start your history."
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={accent.lift}
        />
      }
    >
      <View
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.borderStrong,
          borderWidth: 1,
          borderRadius: radii.lg,
          overflow: 'hidden',
          marginTop: spacing.sm,
        }}
      >
        {rows.map((r, idx) => (
          <NutritionRow
            key={r.date}
            iso={r.date}
            today={today}
            summary={r}
            showTopBorder={idx > 0}
          />
        ))}
      </View>

      {totalPages > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.lg,
          }}
        >
          <PageButton
            disabled={page === 1}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            accessibilityLabel="Previous page"
          >
            <ChevronLeft size={16} color={page === 1 ? text.disabled : accent.lift} />
          </PageButton>

          <Text
            style={{
              color: text.tertiary,
              fontFamily: fonts.family.mono,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 1.4,
              fontVariant: fonts.tabularNums,
            }}
          >
            PAGE {page} / {totalPages}
          </Text>

          <PageButton
            disabled={page === totalPages}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            accessibilityLabel="Next page"
          >
            <ChevronRight size={16} color={page === totalPages ? text.disabled : accent.lift} />
          </PageButton>
        </View>
      ) : null}
    </ScrollView>
  );
};

const PageButton = ({
  children,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={{
      width: 40,
      height: 40,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: disabled ? palette.borderStrong : accent.lift,
      backgroundColor: disabled ? 'transparent' : 'rgba(252, 76, 2, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {children}
  </TouchableOpacity>
);

export default NutritionHistoryView;
