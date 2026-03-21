import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/utils/colors';
import { useStore } from '../../src/hooks/useStore';

function TabBarIcon({
  name,
  color,
  badge,
}: {
  name: any;
  color: string;
  badge?: number;
}) {
  return (
    <View>
      <Ionicons name={name} size={24} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const state = useStore();
  const unreadEmails = state.emails.filter((e) => !e.read).length;
  const pendingAssignments = state.assignments.filter((a) => !a.submitted).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.indigo,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="grid" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="email"
        options={{
          title: 'Email',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="mail" color={color} badge={unreadEmails} />
          ),
          tabBarBadge: unreadEmails > 0 ? unreadEmails : undefined,
          tabBarBadgeStyle: styles.tabBadge,
        }}
      />
      <Tabs.Screen
        name="canvas"
        options={{
          title: 'Canvas',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="school" color={color} badge={pendingAssignments} />
          ),
          tabBarBadge: pendingAssignments > 0 ? pendingAssignments : undefined,
          tabBarBadgeStyle: styles.tabBadge,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg1,
    borderTopColor: COLORS.bg2,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.rose,
    borderWidth: 1,
    borderColor: COLORS.bg1,
  },
  tabBadge: {
    backgroundColor: COLORS.indigo,
    fontSize: 10,
    fontWeight: '700',
  },
});
