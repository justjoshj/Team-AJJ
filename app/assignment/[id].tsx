import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Card } from '../../src/components/Card';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useStore();
  const a = state.assignments.find((x) => x.id === id);

if (!a) {
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.notFound}>Assignment not found</Text>
    </View>
  );
}

const dueLabel = a.dueDate
  ? isToday(a.dueDate)
    ? 'Due Today'
    : isTomorrow(a.dueDate)
    ? 'Due Tomorrow'
    : `Due ${format(a.dueDate, 'EEEE, MMMM d · h:mm a')}`
  : 'No Due Date';

const urgentColor = a.dueDate && isToday(a.dueDate)
  ? COLORS.rose
  : a.dueDate && differenceInHours(a.dueDate, new Date()) < 48
  ? COLORS.amber
  : COLORS.textMuted;

const assignmentPriority: 'high' | 'medium' | 'low' =
  a.priority ??
  (!a.dueDate
    ? 'low'
    : isToday(a.dueDate)
    ? 'high'
    : differenceInHours(a.dueDate, new Date()) < 48
    ? 'medium'
    : 'low');

const priorityColor =
  assignmentPriority === 'high'
    ? COLORS.rose
    : assignmentPriority === 'medium'
    ? COLORS.amber
    : COLORS.sky;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Canvas</Text>
        </TouchableOpacity>
        {a.url ? (
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => Linking.openURL(a.url)}
          >
            <Ionicons name="open-outline" size={15} color={COLORS.indigo} />
            <Text style={styles.openBtnText}>Open in Canvas</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Course Badge */}
        <View style={styles.courseRow}>
          <View style={[styles.courseDot, { backgroundColor: a.courseColor }]} />
          <Text style={[styles.courseName, { color: a.courseColor }]}>{a.courseName}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{a.title}</Text>

        {/* Status + Due */}
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: a.submitted ? COLORS.emerald + '22' : COLORS.rose + '22' }]}>
            <Ionicons
              name={a.submitted ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={a.submitted ? COLORS.emerald : COLORS.rose}
            />
            <Text style={[styles.statusText, { color: a.submitted ? COLORS.emerald : COLORS.rose }]}>
              {a.submitted ? 'Submitted' : 'Not Submitted'}
            </Text>
          </View>
          {a.grade && (
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{a.grade}</Text>
            </View>
          )}
        </View>

        {/* Key Info Cards */}
        <View style={styles.infoGrid}>
          <InfoTile
            icon="time"
            label="Due Date"
            value={dueLabel}
            valueColor={urgentColor}
            accent={a.courseColor}
          />
          {a.pointsPossible !== null && (
            <InfoTile
              icon="trophy"
              label="Points"
              value={`${a.pointsPossible} pts`}
              accent={a.courseColor}
            />
          )}
          {a.submissionType.length > 0 && (
            <InfoTile
              icon="cloud-upload"
              label="Submission"
              value={a.submissionType.map((t) => t.replace(/_/g, ' ')).join(', ')}
              accent={a.courseColor}
            />
          )}
        </View>

        {/* Description */}
        {a.description.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={15} color={COLORS.textMuted} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Card style={styles.descCard}>
              <Text style={styles.description}>{a.description}</Text>
            </Card>
          </>
        )}

        {/* Reminder CTA */}
        {!a.submitted && a.dueDate && (
          <Card style={[styles.reminderCta, { borderColor: a.courseColor + '44' }]}>
            <View style={styles.reminderCtaRow}>
              <Ionicons name="alarm" size={20} color={a.courseColor} />
              <View style={styles.reminderCtaText}>
                <Text style={styles.reminderCtaTitle}>Set a reminder</Text>
                <Text style={styles.reminderCtaSub}>
                  Get notified before this assignment is due
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.reminderBtn, { backgroundColor: a.courseColor }]}
              onPress={async () => {
                const { appStore } = await import('../../src/store/appStore');
                await appStore.addReminder({
                  id: `reminder-${a.id}-${Date.now()}`,
                  title: `${a.title} — ${a.courseName}`,
                  dueDate: a.dueDate!,
                  completed: false,
                  priority: isToday(a.dueDate!) ? 'high' : 'medium',
                  relatedId: a.id,
                  relatedType: 'assignment',
                });
                router.back();
              }}
            >
              <Text style={styles.reminderBtnText}>Add to Reminders</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function InfoTile({
  icon, label, value, valueColor, accent,
}: {
  icon: any; label: string; value: string; valueColor?: string; accent: string;
}) {
  return (
    <View style={[styles.infoTile, { borderLeftColor: accent }]}>
      <View style={styles.infoTileHeader}>
        <Ionicons name={icon} size={12} color={COLORS.textMuted} />
        <Text style={styles.infoTileLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoTileValue, valueColor ? { color: valueColor } : {}]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.bg2,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: COLORS.indigo + '22', borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.indigo + '55',
  },
  openBtnText: { fontSize: 12, color: COLORS.indigo, fontWeight: '700' },
  notFound: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginTop: 60 },

  scroll: { padding: 20 },

  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  courseDot: { width: 8, height: 8, borderRadius: 4 },
  courseName: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  title: {
    fontSize: 24, fontWeight: '700', color: COLORS.textPrimary,
    lineHeight: 30, marginBottom: 14, letterSpacing: -0.4,
  },

  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  gradeBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: COLORS.amber + '22',
  },
  gradeText: { fontSize: 13, fontWeight: '700', color: COLORS.amber },

  infoGrid: { gap: 8, marginBottom: 20 },
  infoTile: {
    backgroundColor: COLORS.bg1, borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  infoTileHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoTileLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoTileValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  descCard: {},
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  reminderCta: {
    marginTop: 20, gap: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  reminderCtaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reminderCtaText: { flex: 1 },
  reminderCtaTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  reminderCtaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reminderBtn: {
    paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  reminderBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  backBtn: { padding: 8 },
});
