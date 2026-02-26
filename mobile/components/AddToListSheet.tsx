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
import Toast from 'react-native-toast-message';
import { useSWRConfig } from 'swr';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import { useMyWatchlists } from '../hooks/swr';
import { watchlistAPI } from '../lib/api-client';
import WatchlistCardSmall from './WatchlistCardSmall';
import EmptyState from './EmptyState';

interface SelectedItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

interface AddToListSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedItem?: SelectedItem;
  onSelectList?: (listId: string) => void;
}

export default function AddToListSheet({
  visible,
  onClose,
  selectedItem,
  onSelectList,
}: AddToListSheetProps) {
  const { content, language } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useMyWatchlists();
  const { mutate } = useSWRConfig();
  const watchlists = (data?.watchlists ?? []).filter(
    (w) => w.isOwner === true || w.isCollaborator === true
  );

  const handleSelectList = async (listId: string, listName: string) => {
    if (onSelectList) {
      onSelectList(listId);
      return;
    }

    if (!selectedItem) {
      console.warn('No item selected to add');
      return;
    }

    try {
      await watchlistAPI.addItem(listId, {
        tmdbId: selectedItem.tmdbId.toString(),
        mediaType: selectedItem.mediaType,
        language: language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'it' ? 'it-IT' : language === 'pt' ? 'pt-BR' : 'en-US',
      });

      // Invalidate SWR cache for the specific list and the list of all watchlists
      mutate(`/watchlists/${listId}`);
      mutate('/watchlists/mine');

      Toast.show({
        type: 'success',
        text1: `${content.watchlists.itemDetails.add} \u2014 ${listName}`,
      });

      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error?.message || 'Error',
      });
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
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + spacing.md, spacing['3xl']) }]}
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
  },
});
