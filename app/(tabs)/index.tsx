import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Card } from '../../src/components/Card';
import { MOCK_CALENDAR_EVENTS } from '../../src/services/mockData';

function getDayLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === 'high' ? COLORS.rose :
    priority === 'medium' ? COLORS.amber : COLORS.emerald;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const unreadEmails = state.emails.filter((e) => !e.read);
  const upcomingAssignments = state.assignments
    .filter((a) => a.dueDate && !a.submitted)
    .slice(0, 3);
  const pendingReminders = state.reminders
    .filter((r) => !r.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 4);
  const todayEvents = useMemo(
    () => MOCK_CALENDAR_EVENTS.filter((e) => isToday(e.startDate)).slice(0, 3),
    []
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatPill icon="mail" label="Unread" value={unreadEmails.length} color={COLORS.sky} onPress={() => router.push('/(tabs)/email')} />
        <StatPill icon="school" label="Due soon" value={upcomingAssignments.length} color={COLORS.violet} onPress={() => router.push('/(tabs)/canvas')} />
        <StatPill icon="calendar" label="Today" value={todayEvents.length} color={COLORS.emerald} onPress={() => router.push('/(tabs)/calendar')} />
        <StatPill icon="alarm" label="Reminders" value={pendingReminders.length} color={COLORS.amber} onPress={() => router.push('/(tabs)/calendar')} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.indigo} />
        }
      >
        {/* Today's Schedule */}
        <SectionHeader title="Today's Schedule" icon="time" onPress={() => router.push('/(tabs)/calendar')} />
        {todayEvents.length === 0 ? (
          <EmptyState icon="calendar-outline" message="No events today" />
        ) : (
          todayEvents.map((event) => (
            <Card key={event.id} style={styles.eventCard} accent={event.color}>
              <View style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: event.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {format(event.startDate, 'h:mm a')} – {format(event.endDate, 'h:mm a')}
                    {event.location ? `  ·  ${event.location}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Upcoming Assignments */}
        <SectionHeader title="Upcoming Assignments" icon="school" onPress={() => router.push('/(tabs)/canvas')} />
        {upcomingAssignments.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" message="No upcoming assignments — nice!" />
        ) : (
          upcomingAssignments.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: a.id } })}
            >
              <Card style={styles.assignmentCard} accent={a.courseColor}>
                <View style={styles.assignmentRow}>
                  <View style={styles.assignmentInfo}>
                    <View style={styles.courseTag}>
                      <View style={[styles.courseTagDot, { backgroundColor: a.courseColor }]} />
                      <Text style={[styles.courseTagText, { color: a.courseColor }]}>{a.courseName}</Text>
                    </View>
                    <Text style={styles.assignmentTitle} numberOfLines={1}>{a.title}</Text>
                    {a.dueDate && (
                      <Text style={[
                        styles.dueDate,
                        isToday(a.dueDate) && styles.dueDateUrgent,
                      ]}>
                        Due {getDayLabel(a.dueDate)} at {format(a.dueDate, 'h:mm a')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Unread Emails */}
        <SectionHeader title="Unread Emails" icon="mail" onPress={() => router.push('/(tabs)/email')} />
        {unreadEmails.length === 0 ? (
          <EmptyState icon="mail-open-outline" message="Inbox zero!" />
        ) : (
          unreadEmails.slice(0, 3).map((email) => (
            <TouchableOpacity
              key={email.id}
              onPress={() => router.push({ pathname: '/email/[id]', params: { id: email.id } })}
            >
              <Card style={styles.emailCard}>
                <View style={styles.emailRow}>
                  <View style={styles.emailAvatar}>
                    <Text style={styles.emailAvatarText}>
                      {email.fromName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.emailBody}>
                    <View style={styles.emailMeta}>
                      <Text style={styles.emailFrom} numberOfLines={1}>{email.fromName}</Text>
                      <Text style={styles.emailTime}>
                        {formatDistanceToNow(email.timestamp, { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.emailSubject} numberOfLines={1}>{email.subject}</Text>
                    <Text style={styles.emailPreview} numberOfLines={1}>{email.preview}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Reminders */}
        <SectionHeader title="Reminders" icon="alarm" onPress={() => router.push('/(tabs)/calendar')} />
        {pendingReminders.length === 0 ? (
          <EmptyState icon="checkmark-done-circle-outline" message="All caught up!" />
        ) : (
          pendingReminders.map((r) => (
            <Card key={r.id} style={styles.reminderCard}>
              <View style={styles.reminderRow}>
                <PriorityDot priority={r.priority} />
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle}>{r.title}</Text>
                  <Text style={styles.reminderDue}>
                    {isToday(r.dueDate) ? 'Due today' : `Due ${getDayLabel(r.dueDate)}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => appStore.toggleReminderComplete(r.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipse-outline" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, icon, onPress }: { title: string; icon: any; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={COLORS.indigo} style={{ marginRight: 6 }} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} style={styles.seeAllBtn}>
        <Text style={styles.seeAll}>See all</Text>
        <Ionicons name="chevron-forward" size={13} color={COLORS.indigo} />
      </TouchableOpacity>
    </View>
  );
}

function StatPill({ icon, label, value, color, onPress }: {
  icon: any; label: string; value: number; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.statPill, { borderColor: color + '33' }]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={22} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

import { appStore } from '../../src/store/appStore';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.indigo + '33',
    borderWidth: 2, borderColor: COLORS.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.indigoLight, fontWeight: '700', fontSize: 16 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  statPill: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: COLORS.bg1, borderRadius: 12,
    borderWidth: 1, gap: 4,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  scroll: { paddingHorizontal: 16 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, marginBottom: 8,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 13, color: COLORS.indigo, fontWeight: '600' },

  eventCard: { marginBottom: 8, padding: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  eventTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  assignmentCard: { marginBottom: 8, padding: 12 },
  assignmentRow: { flexDirection: 'row', alignItems: 'center' },
  assignmentInfo: { flex: 1 },
  courseTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  courseTagDot: { width: 6, height: 6, borderRadius: 3 },
  courseTagText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  dueDate: { fontSize: 12, color: COLORS.textSecondary },
  dueDateUrgent: { color: COLORS.rose, fontWeight: '600' },

  emailCard: { marginBottom: 8, padding: 12 },
  emailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emailAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.indigo + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  emailAvatarText: { color: COLORS.indigoLight, fontWeight: '700', fontSize: 14 },
  emailBody: { flex: 1 },
  emailMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  emailFrom: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  emailTime: { fontSize: 11, color: COLORS.textMuted },
  emailSubject: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  emailPreview: { fontSize: 12, color: COLORS.textSecondary },

  reminderCard: { marginBottom: 8, padding: 12 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reminderDue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  emptyState: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, backgroundColor: COLORS.bg1, borderRadius: 12,
    marginBottom: 8,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
