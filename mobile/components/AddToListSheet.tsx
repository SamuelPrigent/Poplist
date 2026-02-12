import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import { useMyWatchlists } from '../hooks/swr';
import WatchlistCardSmall from './WatchlistCardSmall';
import EmptyState from './EmptyState';

interface AddToListSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectList?: (listId: string) => void;
}

export default function AddToListSheet({
  visible,
  onClose,
  onSelectList,
}: AddToListSheetProps) {
  const { content } = useLanguageStore();
  const { data, isLoading } = useMyWatchlists();
  const watchlists = data?.watchlists ?? [];

  const handleSelectList = (listId: string, listName: string) => {
    if (onSelectList) {
      onSelectList(listId);
    } else {
      console.log(`Selected list: ${listName} (${listId})`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.contentPanel} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{content.watchlists.addToWatchlist}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.foreground} />
            </View>
          ) : watchlists.length === 0 ? (
            <EmptyState title={content.watchlists.noWatchlists} />
          ) : (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
            >
              {watchlists.map((watchlist) => (
                <WatchlistCardSmall
                  key={watchlist.id}
                  watchlist={watchlist}
                  onPress={() => handleSelectList(watchlist.id, watchlist.name)}
                />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  contentPanel: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
});
