import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Film } from 'lucide-react-native';
import { colors, borderRadius } from '../constants/theme';
import { getTMDBImageUrl } from '../lib/utils';
import type { WatchlistItem } from '../types';

interface PosterGridProps {
  items: WatchlistItem[];
  size: number;
}

export default function PosterGrid({ items, size }: PosterGridProps) {
  const cellSize = (size - 1) / 2;

  const renderCell = (index: number) => {
    const item = items[index];
    const imageUrl = item ? getTMDBImageUrl(item.posterPath, 'w185') : null;

    if (imageUrl) {
      return (
        <Image
          key={index}
          source={{ uri: imageUrl }}
          style={[styles.cell, { width: cellSize, height: cellSize }]}
          contentFit="cover"
        />
      );
    }

    return (
      <View
        key={index}
        style={[
          styles.cell,
          styles.placeholderCell,
          { width: cellSize, height: cellSize },
        ]}
      >
        <Film size={cellSize * 0.3} color={colors.mutedForeground} />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: borderRadius.md },
      ]}
    >
      <View style={styles.row}>
        {renderCell(0)}
        {renderCell(1)}
      </View>
      <View style={styles.row}>
        {renderCell(2)}
        {renderCell(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 1,
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  placeholderCell: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
