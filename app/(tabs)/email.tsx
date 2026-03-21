import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, isToday, format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Email } from '../../src/types';

const FILTERS = ['All', 'Unread', 'Starred'] as const;
type Filter = typeof FILTERS[number];

function formatEmailTime(date: Date) {
  if (isToday(date)) return format(date, 'h:mm a');
  return formatDistanceToNow(date, { addSuffix: true });
}

function AvatarCircle({ name, size = 40 }: { name: string; size?: number }) {
  const letter = name.charAt(0).toUpperCase();
  const hue = (name.charCodeAt(0) * 47) % 360;
  const bg = `hsl(${hue}, 55%, 38%)`;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{letter}</Text>
    </View>
  );
}

export default function EmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useStore();
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let list = state.emails;
    if (filter === 'Unread') list = list.filter((e) => !e.read);
    if (filter === 'Starred') list = list.filter((e) => e.starred);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.fromName.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [state.emails, filter, search]);

  const unreadCount = state.emails.filter((e) => !e.read).length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inbox</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="funnel-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search emails…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
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

      {/* Email List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.indigo} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No emails found</Text>
          </View>
        ) : (
          filtered.map((email, i) => (
            <EmailRow
              key={email.id}
              email={email}
              isLast={i === filtered.length - 1}
              onPress={() => router.push({ pathname: '/email/[id]', params: { id: email.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function EmailRow({ email, isLast, onPress }: { email: Email; isLast: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.emailRow, !email.read && styles.emailRowUnread, isLast && styles.emailRowLast]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <AvatarCircle name={email.fromName} />
      <View style={styles.emailContent}>
        <View style={styles.emailMeta}>
          <Text style={[styles.emailFrom, !email.read && styles.emailFromUnread]} numberOfLines={1}>
            {email.fromName}
          </Text>
          <View style={styles.emailMetaRight}>
            {email.starred && (
              <Ionicons name="star" size={12} color={COLORS.amber} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.emailTime}>{formatEmailTime(email.timestamp)}</Text>
          </View>
        </View>
        <Text style={[styles.emailSubject, !email.read && styles.emailSubjectUnread]} numberOfLines={1}>
          {email.subject}
        </Text>
        <Text style={styles.emailPreview} numberOfLines={1}>{email.preview}</Text>
        {email.labels.length > 0 && (
          <View style={styles.labelRow}>
            {email.labels.map((l) => (
              <LabelChip key={l} label={l} />
            ))}
          </View>
        )}
      </View>
      {!email.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function LabelChip({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    academic: COLORS.sky,
    grade: COLORS.emerald,
    registration: COLORS.violet,
    career: COLORS.amber,
    github: COLORS.bg3,
  };
  const c = colorMap[label] || COLORS.indigo;
  return (
    <View style={[styles.label, { backgroundColor: c + '22', borderColor: c + '44' }]}>
      <Text style={[styles.labelText, { color: c }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.indigo, fontWeight: '600', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: COLORS.bg1, borderRadius: 12,
    paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: COLORS.bg2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: COLORS.bg1,
    borderWidth: 1, borderColor: COLORS.bg2,
  },
  filterTabActive: {
    backgroundColor: COLORS.indigo + '22',
    borderColor: COLORS.indigo,
  },
  filterText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  filterTextActive: { color: COLORS.indigo, fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  emailRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.bg2,
  },
  emailRowUnread: { },
  emailRowLast: { borderBottomWidth: 0 },

  avatar: { alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  avatarText: { color: '#fff', fontWeight: '700' },

  emailContent: { flex: 1 },
  emailMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  emailMetaRight: { flexDirection: 'row', alignItems: 'center' },
  emailFrom: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, flex: 1 },
  emailFromUnread: { color: COLORS.textPrimary, fontWeight: '700' },
  emailTime: { fontSize: 11, color: COLORS.textMuted },
  emailSubject: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 3 },
  emailSubjectUnread: { color: COLORS.textPrimary, fontWeight: '600' },
  emailPreview: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  labelRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  label: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  labelText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.indigo, marginTop: 6,
  },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, color: COLORS.textMuted },
});
