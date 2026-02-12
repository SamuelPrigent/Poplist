import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { spacing } from '../constants/theme';

interface HorizontalListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  itemWidth: number;
  gap?: number;
}

export default function HorizontalList<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth,
  gap = spacing.md,
}: HorizontalListProps<T>) {
  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => keyExtractor(item)}
      contentContainerStyle={[styles.contentContainer, { gap }]}
      renderItem={({ item, index }) => (
        <>{renderItem(item, index)}</>
      )}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.lg,
  },
});
