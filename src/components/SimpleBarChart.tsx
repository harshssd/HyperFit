import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/appStyles';

type SimpleBarChartProps = {
  data: Array<{ label: string; value: number }>;
  color?: string;
};

const SimpleBarChart = ({ data, color = '#f97316' }: SimpleBarChartProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>NO DATA DETECTED</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartBarWrapper}>
          <View style={styles.chartBarContainer}>
            <View
              style={[
                styles.chartBar,
                { backgroundColor: color, height: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.chartLabel}>{item.label.slice(0, 3)}</Text>
        </View>
      ))}
    </View>
  );
};

export default SimpleBarChart;

