import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { appStore } from '../../src/store/appStore';

export default function EmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useStore();
  const email = state.emails.find((e) => e.id === id);

  useEffect(() => {
    if (email && !email.read) {
      appStore.markEmailRead(id!);
    }
  }, [id]);

  if (!email) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.notFound}>Email not found</Text>
      </View>
    );
  }

  const letter = email.fromName.charAt(0).toUpperCase();
  const hue = (email.fromName.charCodeAt(0) * 47) % 360;
  const avatarBg = `hsl(${hue}, 55%, 38%)`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => appStore.toggleEmailStar(email.id)}
          >
            <Ionicons
              name={email.starred ? 'star' : 'star-outline'}
              size={20}
              color={email.starred ? COLORS.amber : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-undo-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Subject */}
        <Text style={styles.subject}>{email.subject}</Text>

        {/* Labels */}
        {email.labels.length > 0 && (
          <View style={styles.labelRow}>
            {email.labels.map((l) => {
              const colorMap: Record<string, string> = {
                academic: COLORS.sky, grade: COLORS.emerald,
                registration: COLORS.violet, career: COLORS.amber, github: COLORS.bg3,
              };
              const c = colorMap[l] || COLORS.indigo;
              return (
                <View key={l} style={[styles.label, { backgroundColor: c + '22', borderColor: c + '44' }]}>
                  <Text style={[styles.labelText, { color: c }]}>{l}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Sender Info */}
        <View style={styles.senderCard}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{letter}</Text>
          </View>
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>{email.fromName}</Text>
            <Text style={styles.senderEmail}>{email.from}</Text>
          </View>
          <Text style={styles.emailDate}>
            {format(email.timestamp, 'MMM d, yyyy · h:mm a')}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Body */}
        <Text style={styles.body}>{email.body}</Text>

        {/* Reply area */}
        <View style={styles.replyBox}>
          <Text style={styles.replyPrompt}>Reply to {email.fromName}</Text>
          <View style={styles.replyActions}>
            <TouchableOpacity style={styles.replyBtn}>
              <Ionicons name="arrow-undo" size={15} color={COLORS.indigo} />
              <Text style={styles.replyBtnText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.replyBtn}>
              <Ionicons name="arrow-redo" size={15} color={COLORS.textMuted} />
              <Text style={[styles.replyBtnText, { color: COLORS.textMuted }]}>Forward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  topActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },
  notFound: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginTop: 60 },

  scroll: { padding: 20 },
  subject: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 28, marginBottom: 12 },

  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  label: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  labelText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  senderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg1, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  senderInfo: { flex: 1 },
  senderName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  senderEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emailDate: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  divider: { height: 1, backgroundColor: COLORS.bg2, marginVertical: 20 },

  body: {
    fontSize: 15, color: COLORS.textSecondary, lineHeight: 24,
    fontFamily: undefined,
  },

  replyBox: {
    marginTop: 32, backgroundColor: COLORS.bg1,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12,
  },
  replyPrompt: { fontSize: 13, color: COLORS.textMuted },
  replyActions: { flexDirection: 'row', gap: 10 },
  replyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.bg0, borderWidth: 1, borderColor: COLORS.bg2,
  },
  replyBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.indigo },
});
