import React from 'react';
import { View, Text } from 'react-native';
import { statsStyles, colors } from '../styles';

type SimpleBarChartProps = {
  data: Array<{ label: string; value: number }>;
  color?: string;
};

const SimpleBarChart = ({ data, color = colors.primary }: SimpleBarChartProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={statsStyles.chartEmpty}>
        <Text style={statsStyles.chartEmptyText}>NO DATA DETECTED</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <View style={statsStyles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={statsStyles.chartBarWrapper}>
          <View style={statsStyles.chartBarContainer}>
            <View
              style={[
                statsStyles.chartBar,
                { backgroundColor: color, height: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={statsStyles.chartLabel}>{item.label.slice(0, 3)}</Text>
        </View>
      ))}
    </View>
  );
};

export default SimpleBarChart;

