import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

interface SwipeableListItemProps {
  item: {
    id: string | number;
    name?: string;
    title?: string;
    description?: string;
  };
  onDelete: (id: string | number) => void;
  onPress?: () => void;
}

export default function SwipeableListItem({
  item,
  onDelete,
  onPress,
}: SwipeableListItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const displayTitle = item.name || item.title || `#${item.id}`;

  const confirmDelete = () => {
    Alert.alert('Delete item', `Remove "${displayTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          swipeableRef.current?.close();
          onDelete(item.id);
        },
      },
    ]);
  };

  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [0, 50, 100],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View
          style={[
            styles.deleteAction,
            {
              transform: [{ translateX: trans }, { scale }],
            },
          ]}
        >
          <Pressable
            style={styles.deleteButton}
            onPress={confirmDelete}
            hitSlop={10}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
    >
      <Pressable style={styles.card} onPress={onPress}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        {!!item.description && (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#bbb',
    marginTop: 4,
    fontSize: 14,
  },
  rightActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  deleteAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    marginLeft: 8,
    width: 72,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonText: {
    fontSize: 20,
    marginBottom: 2,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});