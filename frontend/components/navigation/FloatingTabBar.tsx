import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#4F46E5';
const INACTIVE = '#94A3B8';
const PILL_BG = '#EEF2FF';
const BAR_BG = '#FFFFFF';
const BAR_BORDER = 'rgba(15, 23, 42, 0.06)';

function tabLabel(
  options: BottomTabBarProps['descriptors'][string]['options'],
  routeName: string
): string {
  const { tabBarLabel, title } = options;
  if (typeof tabBarLabel === 'string') return tabBarLabel;
  if (typeof title === 'string') return title;
  return routeName;
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomLift = Math.max(insets.bottom, 12) + 6;

  return (
    <View style={styles.shell} pointerEvents="box-none">
      <View style={[styles.wrap, { marginBottom: bottomLift }]}>
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const color = isFocused ? ACTIVE : INACTIVE;
            const label = tabLabel(options, route.name);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const icon =
              options.tabBarIcon?.({
                focused: isFocused,
                color,
                size: isFocused ? 24 : 22,
              }) ?? null;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                android_ripple={null}
                style={styles.tab}
              >
                <View style={[styles.pill, isFocused && styles.pillActive]}>
                  {icon}
                  <Text
                    style={[styles.label, { color }]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  wrap: {
    width: '100%',
    paddingHorizontal: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BAR_BG,
    borderRadius: 26,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BAR_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 26,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 26,
    width: '100%',
    maxWidth: 78,
  },
  pillActive: {
    backgroundColor: PILL_BG,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 1,
  },
});
