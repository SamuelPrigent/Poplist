import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Film } from 'lucide-react-native';
import { colors, borderRadius } from '../constants/theme';
import { getTMDBImageUrl } from '../lib/utils';
import type { WatchlistItem } from '../types';

interface PosterGridProps {
  items: WatchlistItem[];
  size: number | 'fill';
}

export default function PosterGrid({ items, size }: PosterGridProps) {
  const isFill = size === 'fill';
  const cellSize = isFill ? undefined : ((size as number) - 1) / 2;

  const renderCell = (index: number) => {
    const item = items[index];
    const imageUrl = item ? getTMDBImageUrl(item.posterPath, 'w185') : null;

    const cellStyle = isFill
      ? styles.cell
      : [styles.cell, { width: cellSize, height: cellSize }];

    if (imageUrl) {
      return (
        <Image
          key={index}
          source={{ uri: imageUrl }}
          style={cellStyle}
          contentFit="cover"
        />
      );
    }

    return (
      <View
        key={index}
        style={[
          ...(Array.isArray(cellStyle) ? cellStyle : [cellStyle]),
          styles.placeholderCell,
        ]}
      >
        <Film size={isFill ? 20 : (cellSize as number) * 0.3} color={colors.mutedForeground} />
      </View>
    );
  };

  const containerStyle = isFill
    ? [styles.container, styles.fillContainer]
    : [styles.container, { width: size as number, height: size as number, borderRadius: borderRadius.md }];

  return (
    <View style={containerStyle}>
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
  fillContainer: {
    width: '100%',
    height: '100%',
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
