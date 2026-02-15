import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface GenreCardProps {
  categoryId: string;
  name: string;
  onPress: () => void;
}

// Vibrant color palette per category (Spotify-inspired)
const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  movies: { bg: '#1a3a6b', accent: '#5B86E5' },
  series: { bg: '#6b1a2e', accent: '#E61E4D' },
  anime: { bg: '#8B1A5C', accent: '#FF6B9D' },
  enfant: { bg: '#1a6b4a', accent: '#1DB954' },
  documentaries: { bg: '#6b5520', accent: '#E8A838' },
  jeunesse: { bg: '#4a1a8b', accent: '#B266FF' },
  action: { bg: '#8b2222', accent: '#FF5544' },
};

// Different geometric shapes per category
type ShapeType = 'circle' | 'diamond' | 'triangle' | 'hexagon' | 'square' | 'oval' | 'parallelogram';

const CATEGORY_SHAPES: Record<string, ShapeType> = {
  movies: 'circle',
  series: 'diamond',
  anime: 'triangle',
  enfant: 'circle',
  documentaries: 'hexagon',
  jeunesse: 'oval',
  action: 'square',
};

function GeometricShape({ shape, color, size, uniqueId }: { shape: ShapeType; color: string; size: number; uniqueId: string }) {
  const gradientId = `grad-${uniqueId}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0" />
          <Stop offset="0.5" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0.45" />
        </LinearGradient>
      </Defs>
      {shape === 'circle' && (
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
      )}
      {shape === 'diamond' && (
        <Polygon
          points={`${size / 2},0 ${size},${size / 2} ${size / 2},${size} 0,${size / 2}`}
          fill={`url(#${gradientId})`}
        />
      )}
      {shape === 'triangle' && (
        <Polygon
          points={`${size / 2},0 ${size},${size} 0,${size}`}
          fill={`url(#${gradientId})`}
        />
      )}
      {shape === 'hexagon' && (
        <Polygon
          points={`${size * 0.25},0 ${size * 0.75},0 ${size},${size * 0.5} ${size * 0.75},${size} ${size * 0.25},${size} 0,${size * 0.5}`}
          fill={`url(#${gradientId})`}
        />
      )}
      {shape === 'square' && (
        <Rect x={0} y={0} width={size} height={size} rx={size * 0.1} fill={`url(#${gradientId})`} />
      )}
      {shape === 'oval' && (
        <Circle cx={size / 2} cy={size * 0.6} r={size * 0.45} fill={`url(#${gradientId})`} />
      )}
      {shape === 'parallelogram' && (
        <Polygon
          points={`${size * 0.2},0 ${size},0 ${size * 0.8},${size} 0,${size}`}
          fill={`url(#${gradientId})`}
        />
      )}
    </Svg>
  );
}

export default function GenreCard({
  categoryId,
  name,
  onPress,
}: GenreCardProps) {
  const theme = useTheme();
  const palette = CATEGORY_COLORS[categoryId] || { bg: theme.secondary, accent: '#64748b' };
  const shape = CATEGORY_SHAPES[categoryId] || 'circle';

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: palette.bg }]}>
      {/* Geometric shape in bottom-right corner */}
      <View style={styles.shapeContainer}>
        <GeometricShape shape={shape} color={palette.accent} size={90} uniqueId={categoryId} />
      </View>

      {/* Category name */}
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    padding: spacing.md,
    position: 'relative',
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: 'bold',
    zIndex: 1,
  },
  shapeContainer: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    transform: [{ rotate: '15deg' }],
  },
});
