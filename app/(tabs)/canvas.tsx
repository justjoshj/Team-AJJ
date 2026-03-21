import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Card } from '../../src/components/Card';
import { CanvasAssignment } from '../../src/types';
import { appStore } from '../../src/store/appStore';
import { fetchCanvasData } from '../../src/services/canvasService';

const FILTERS = ['All', 'Upcoming', 'Submitted'] as const;
type Filter = typeof FILTERS[number];

function getDueLabel(date: Date) {
  if (isToday(date)) return { label: 'Due Today', color: COLORS.rose };
  if (isTomorrow(date)) return { label: 'Due Tomorrow', color: COLORS.amber };
  const days = differenceInDays(date, new Date());
  if (days <= 7) return { label: `Due in ${days}d`, color: COLORS.amber };
  return { label: `Due ${format(date, 'MMM d')}`, color: COLORS.textMuted };
}

export default function CanvasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useStore();
  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const hasCanvas = !!state.settings.canvasUrl && !!state.settings.canvasToken;

  const filtered = useMemo(() => {
    let list = state.assignments;
    if (filter === 'Upcoming') list = list.filter((a) => !a.submitted);
    if (filter === 'Submitted') list = list.filter((a) => a.submitted);
    if (selectedCourse) list = list.filter((a) => a.courseId === selectedCourse);
    return list;
  }, [state.assignments, filter, selectedCourse]);

  const grouped = useMemo(() => {
    const map = new Map<string, CanvasAssignment[]>();
    filtered.forEach((a) => {
      const key = a.dueDate
        ? isToday(a.dueDate) ? 'Today'
        : isTomorrow(a.dueDate) ? 'Tomorrow'
        : format(a.dueDate, 'EEE, MMM d')
        : 'No Due Date';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [filtered]);

  const onRefresh = async () => {
    if (!hasCanvas) return;
    setRefreshing(true);
    try {
      appStore.setCanvasLoading(true);
      appStore.setCanvasError(null);
      const { assignments, courses } = await fetchCanvasData(
        state.settings.canvasUrl,
        state.settings.canvasToken
      );
      await appStore.saveCanvasData(assignments, courses);
    } catch (e: any) {
      appStore.setCanvasError(e.message || 'Failed to refresh Canvas data');
    } finally {
      appStore.setCanvasLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Canvas</Text>
          <Text style={styles.subtitle}>
            {state.assignments.length > 0
              ? `${state.assignments.filter((a) => !a.submitted).length} pending · ${state.courses.length} courses`
              : 'Assignments & courses'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {state.errors.canvas && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={COLORS.rose} />
          <Text style={styles.errorText}>{state.errors.canvas}</Text>
        </View>
      )}

      {/* No Canvas Setup */}
      {!hasCanvas && (
        <View style={styles.connectCard}>
          <View style={styles.connectIcon}>
            <Ionicons name="school" size={36} color={COLORS.violet} />
          </View>
          <Text style={styles.connectTitle}>Connect Canvas</Text>
          <Text style={styles.connectDesc}>
            Add your Canvas URL and API token in Settings to automatically import your assignments and events.
          </Text>
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.connectBtnText}>Go to your settings</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {state.loading.canvas && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.violet} />
          <Text style={styles.loadingText}>Syncing Canvas…</Text>
        </View>
      )}

      {/* Courses filter strip */}
      {state.courses.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseStrip}
        >
          <TouchableOpacity
            style={[styles.courseChip, !selectedCourse && styles.courseChipActive]}
            onPress={() => setSelectedCourse(null)}
          >
            <Text style={[styles.courseChipText, !selectedCourse && styles.courseChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {state.courses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.courseChip,
                { borderColor: c.color + '66' },
                selectedCourse === c.id && { backgroundColor: c.color + '22', borderColor: c.color },
              ]}
              onPress={() => setSelectedCourse(selectedCourse === c.id ? null : c.id)}
            >
              <View style={[styles.courseDot, { backgroundColor: c.color }]} />
              <Text
                style={[
                  styles.courseChipText,
                  { color: selectedCourse === c.id ? c.color : COLORS.textSecondary },
                  selectedCourse === c.id && { fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filter Tabs */}
      {hasCanvas && (
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Assignment List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          hasCanvas
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
            : undefined
        }
      >
        {hasCanvas && filtered.length === 0 && !state.loading.canvas && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyDesc}>No assignments in this view.</Text>
          </View>
        )}

        {Array.from(grouped.entries()).map(([dateKey, assignments]) => (
          <View key={dateKey}>
            <Text style={styles.dateGroup}>{dateKey}</Text>
            {assignments.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: a.id } })}
              >
                <AssignmentCard assignment={a} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function AssignmentCard({ assignment: a }: { assignment: CanvasAssignment }) {
  const due = a.dueDate ? getDueLabel(a.dueDate) : null;
  return (
    <Card style={styles.aCard} accent={a.courseColor}>
      <View style={styles.aRow}>
        <View style={styles.aLeft}>
          <View style={styles.courseTagRow}>
            <View style={[styles.courseTagDot, { backgroundColor: a.courseColor }]} />
            <Text style={[styles.courseTag, { color: a.courseColor }]} numberOfLines={1}>
              {a.courseName}
            </Text>
            {a.pointsPossible !== null && (
              <Text style={styles.points}>{a.pointsPossible} pts</Text>
            )}
          </View>
          <Text style={styles.aTitle} numberOfLines={2}>{a.title}</Text>
          {a.description.length > 0 && (
            <Text style={styles.aDesc} numberOfLines={2}>{a.description}</Text>
          )}
          <View style={styles.aFooter}>
            {due && (
              <View style={[styles.dueBadge, { backgroundColor: due.color + '22' }]}>
                <Ionicons name="time-outline" size={11} color={due.color} />
                <Text style={[styles.dueText, { color: due.color }]}>{due.label}</Text>
              </View>
            )}
            {a.submitted && (
              <View style={styles.submittedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.emerald} />
                <Text style={styles.submittedText}>Submitted</Text>
              </View>
            )}
            {a.submissionType.length > 0 && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {a.submissionType[0].replace(/_/g, ' ')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
      </View>
    </Card>
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
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.rose + '22', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.rose + '33',
  },
  errorText: { color: COLORS.rose, fontSize: 13, flex: 1 },

  connectCard: {
    margin: 20, backgroundColor: COLORS.bg1,
    borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12,
  },
  connectIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.violet + '22', alignItems: 'center', justifyContent: 'center',
  },
  connectTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  connectDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.violet, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 4,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  loadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingBottom: 8,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 13 },

  courseStrip: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  courseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: COLORS.bg1,
    borderWidth: 1, borderColor: COLORS.bg2,
  },
  courseChipActive: { backgroundColor: COLORS.indigo + '22', borderColor: COLORS.indigo },
  courseDot: { width: 6, height: 6, borderRadius: 3 },
  courseChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', maxWidth: 100 },
  courseChipTextActive: { color: COLORS.indigo, fontWeight: '700' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.bg2,
  },
  filterTabActive: { backgroundColor: COLORS.violet + '22', borderColor: COLORS.violet },
  filterText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  filterTextActive: { color: COLORS.violet, fontWeight: '700' },

  scroll: { paddingHorizontal: 16 },
  dateGroup: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 16, marginBottom: 8,
  },

  aCard: { marginBottom: 10, padding: 14 },
  aRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aLeft: { flex: 1 },
  courseTagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  courseTagDot: { width: 6, height: 6, borderRadius: 3 },
  courseTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  points: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  aTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  aDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  aFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dueText: { fontSize: 11, fontWeight: '600' },
  submittedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.emerald + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  submittedText: { fontSize: 11, fontWeight: '600', color: COLORS.emerald },
  typeBadge: { backgroundColor: COLORS.bg2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted },
});
