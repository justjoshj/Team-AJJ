import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format, isToday, isTomorrow, addDays, startOfWeek, isSameDay,
  isThisWeek, differenceInMinutes,
} from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Card } from '../../src/components/Card';
import { CalendarEvent, Reminder } from '../../src/types';
import { MOCK_CALENDAR_EVENTS } from '../../src/services/mockData';
import { appStore } from '../../src/store/appStore';
import { Calendar } from 'react-native-calendars';
const VIEWS = ['Month', 'Week','Events', 'Reminders'] as const;
type ViewMode = typeof VIEWS[number];

const PRIORITY_COLORS = {
  high: COLORS.rose, medium: COLORS.amber, low: COLORS.emerald,
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const state = useStore();
  const [view, setView] = useState<ViewMode>('Month');
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [addReminderOpen, setAddReminderOpen] = useState(false);

  // Merge canvas + personal events
  const allEvents: CalendarEvent[] = useMemo(() => {
    const canvasEvents: CalendarEvent[] = state.assignments
      .filter((a) => a.dueDate)
      .map((a) => ({
        id: `canvas-${a.id}`,
        title: `📚 ${a.title}`,
        startDate: a.dueDate!,
        endDate: a.dueDate!,
        allDay: false,
        color: a.courseColor,
        source: 'canvas' as const,
        notes: a.courseName,
      }));
    return [...MOCK_CALENDAR_EVENTS, ...canvasEvents];
  }, [state.assignments]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const selectedDayEvents = useMemo(
    () => allEvents.filter((e) => isSameDay(e.startDate, selectedDay))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [allEvents, selectedDay]
  );

  const upcomingEvents = useMemo(
    () => allEvents
      .filter((e) => e.startDate >= new Date())
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 20),
    [allEvents]
  );

  const pendingReminders = useMemo(
    () => state.reminders
      .filter((r) => !r.completed)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
    [state.reminders]
  );
  const completedReminders = useMemo(
    () => state.reminders.filter((r) => r.completed),
    [state.reminders]
  );

  function getDayLabel(date: Date) {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'EEE, MMM d');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddReminderOpen(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, view === v && styles.viewTabActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

    {view === 'Month' && (
  <>
    <View style={{ paddingHorizontal: 12 }}>
      <Calendar
        onDayPress={(day) => {
          setSelectedDay(new Date(day.dateString));
        }}
        markedDates={{
          ...allEvents.reduce((acc, event) => {
            const date = event.startDate.toISOString().split('T')[0];
            acc[date] = {
              marked: true,
              dotColor: event.color || COLORS.indigo,
            };
            return acc;
          }, {} as Record<string, any>),
          [selectedDay.toISOString().split('T')[0]]: {
            selected: true,
            selectedColor: COLORS.indigo,
          },
        }}
        theme={{
          backgroundColor: COLORS.bg0,
          calendarBackground: COLORS.bg0,
          textSectionTitleColor: COLORS.textMuted,
          dayTextColor: COLORS.textPrimary,
          todayTextColor: COLORS.indigo,
          monthTextColor: COLORS.textPrimary,
          arrowColor: COLORS.indigo,
        }}
      />
    </View>

    <Text style={styles.dayHeader}>
      {getDayLabel(selectedDay)} · {selectedDayEvents.length} event
      {selectedDayEvents.length !== 1 ? 's' : ''}
    </Text>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {selectedDayEvents.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No events this day</Text>
        </View>
      ) : (
        selectedDayEvents.map((e) => <EventCard key={e.id} event={e} />)
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  </>
)}

{view === 'Week' && (
  <>
    <View style={styles.weekStrip}>
      {weekDays.map((day) => {
        const hasEvent = allEvents.some((e) => isSameDay(e.startDate, day));
        const sel = isSameDay(day, selectedDay);
        const tod = isToday(day);

        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[styles.dayBtn, sel && styles.dayBtnSel]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayLetter,
                sel && styles.dayLetterSel,
                tod && !sel && styles.dayLetterToday,
              ]}
            >
              {format(day, 'EEE')[0]}
            </Text>

            <View
              style={[
                styles.dayNum,
                sel && styles.dayNumSel,
                tod && !sel && styles.dayNumToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNumText,
                  sel && styles.dayNumTextSel,
                  tod && !sel && { color: COLORS.indigo },
                ]}
              >
                {format(day, 'd')}
              </Text>
            </View>

            {hasEvent && (
              <View
                style={[
                  styles.eventDotSmall,
                  sel && { backgroundColor: '#fff' },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>

    <Text style={styles.dayHeader}>
      {getDayLabel(selectedDay)} · {selectedDayEvents.length} event
      {selectedDayEvents.length !== 1 ? 's' : ''}
    </Text>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {selectedDayEvents.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No events this day</Text>
        </View>
      ) : (
        selectedDayEvents.map((e) => <EventCard key={e.id} event={e} />)
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  </>
)}

      {view === 'Events' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {upcomingEvents.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming events</Text>
            </View>
          ) : (
            (() => {
              const groups = new Map<string, CalendarEvent[]>();
              upcomingEvents.forEach((e) => {
                const key = isToday(e.startDate) ? 'Today'
                  : isTomorrow(e.startDate) ? 'Tomorrow'
                  : format(e.startDate, 'EEE, MMM d');
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(e);
              });
              return Array.from(groups.entries()).map(([key, events]) => (
                <View key={key}>
                  <Text style={styles.dateGroup}>{key}</Text>
                  {events.map((e) => <EventCard key={e.id} event={e} />)}
                </View>
              ));
            })()
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {view === 'Reminders' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {pendingReminders.length === 0 && completedReminders.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="alarm-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No reminders yet</Text>
              <TouchableOpacity style={styles.addReminderBtn} onPress={() => setAddReminderOpen(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addReminderBtnText}>Add Reminder</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {pendingReminders.length > 0 && (
                <>
                  <Text style={styles.reminderGroup}>Pending</Text>
                  {pendingReminders.map((r) => <ReminderCard key={r.id} reminder={r} />)}
                </>
              )}
              {completedReminders.length > 0 && (
                <>
                  <Text style={[styles.reminderGroup, { marginTop: 20 }]}>Completed</Text>
                  {completedReminders.map((r) => <ReminderCard key={r.id} reminder={r} />)}
                </>
              )}
            </>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Add Reminder Modal */}
      <AddReminderModal visible={addReminderOpen} onClose={() => setAddReminderOpen(false)} />
    </View>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const duration = differenceInMinutes(event.endDate, event.startDate);
  const isCanvas = event.source === 'canvas';
  return (
    <Card style={styles.eventCard} accent={event.color}>
      <View style={styles.eventRow}>
        <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.notes && <Text style={styles.eventNotes}>{event.notes}</Text>}
          <View style={styles.eventMeta}>
            {!event.allDay && (
              <View style={styles.eventMetaItem}>
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.eventMetaText}>
                  {isCanvas
                    ? `Due ${format(event.startDate, 'h:mm a')}`
                    : `${format(event.startDate, 'h:mm a')} · ${duration}min`}
                </Text>
              </View>
            )}
            {event.location && (
              <View style={styles.eventMetaItem}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.eventMetaText}>{event.location}</Text>
              </View>
            )}
          </View>
        </View>
        {isCanvas && (
          <View style={styles.canvasBadge}>
            <Text style={styles.canvasBadgeText}>Canvas</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

function ReminderCard({ reminder: r }: { reminder: Reminder }) {
  return (
    <Card style={[styles.reminderCard, r.completed && styles.reminderCardDone]}>
      <View style={styles.reminderRow}>
        <TouchableOpacity
          style={[styles.checkCircle, r.completed && { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald }]}
          onPress={() => appStore.toggleReminderComplete(r.id)}
        >
          {r.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.reminderInfo}>
          <Text style={[styles.reminderTitle, r.completed && styles.reminderTitleDone]}>
            {r.title}
          </Text>
          <Text style={styles.reminderDue}>
            {isToday(r.dueDate) ? 'Due today' : `Due ${format(r.dueDate, 'MMM d')}`}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[r.priority] + '22' }]}>
          <Text style={[styles.priorityText, { color: PRIORITY_COLORS[r.priority] }]}>
            {r.priority}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => appStore.deleteReminder(r.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function AddReminderModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const save = async () => {
    if (!title.trim()) return;
    await appStore.addReminder({
      id: Date.now().toString(),
      title: title.trim(),
      dueDate: addDays(new Date(), 1),
      completed: false,
      priority,
    });
    setTitle('');
    setPriority('medium');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Reminder</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="What do you need to remember?"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Text style={styles.modalLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityBtn,
                  { borderColor: PRIORITY_COLORS[p] + '66' },
                  priority === p && { backgroundColor: PRIORITY_COLORS[p] + '22', borderColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityBtnText, { color: priority === p ? PRIORITY_COLORS[p] : COLORS.textMuted }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.emerald, alignItems: 'center', justifyContent: 'center',
  },

  viewToggle: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12,
  },
  viewTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.bg1, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.bg2,
  },
  viewTabActive: { backgroundColor: COLORS.emerald + '22', borderColor: COLORS.emerald },
  viewTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  viewTabTextActive: { color: COLORS.emerald },

  weekStrip: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 4, marginBottom: 8,
  },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 10, gap: 4,
  },
  dayBtnSel: { backgroundColor: COLORS.indigo },
  dayLetter: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
  dayLetterSel: { color: '#fff' },
  dayLetterToday: { color: COLORS.indigo },
  dayNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayNumSel: { },
  dayNumToday: { },
  dayNumText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  dayNumTextSel: { color: '#fff', fontWeight: '700' },
  eventDotSmall: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.indigo },

  dayHeader: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    paddingHorizontal: 20, marginBottom: 8,
  },

  scroll: { paddingHorizontal: 16 },
  dateGroup: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 16, marginBottom: 8,
  },

  eventCard: { marginBottom: 8, padding: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventColorBar: { width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 40 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  eventNotes: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  eventMeta: { gap: 4 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, color: COLORS.textMuted },
  canvasBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    backgroundColor: COLORS.violet + '22', borderRadius: 6, borderWidth: 1, borderColor: COLORS.violet + '44',
  },
  canvasBadgeText: { fontSize: 10, color: COLORS.violet, fontWeight: '700' },

  reminderCard: { marginBottom: 8 },
  reminderCardDone: { opacity: 0.6 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.bg3,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reminderTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  reminderDue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reminderGroup: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  addReminderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.emerald, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, marginTop: 12,
  },
  addReminderBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: COLORS.bg1,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg3, alignSelf: 'center', marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  modalInput: {
    backgroundColor: COLORS.bg0, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.textPrimary, fontSize: 15, borderWidth: 1, borderColor: COLORS.bg2,
  },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.bg2,
  },
  priorityBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.emerald, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});