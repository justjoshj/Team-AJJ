import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/hooks/useStore';
import { COLORS } from '../../src/utils/colors';
import { Card } from '../../src/components/Card';
import { appStore } from '../../src/store/appStore';
import { fetchCanvasData, validateCanvasUrl } from '../../src/services/canvasService';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const state = useStore();
  const s = state.settings;

  const [canvasUrl, setCanvasUrl] = useState(s.canvasUrl);
  const [canvasToken, setCanvasToken] = useState(s.canvasToken);
  const [showToken, setShowToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    setCanvasUrl(s.canvasUrl);
    setCanvasToken(s.canvasToken);
  }, [s.canvasUrl, s.canvasToken]);

  const saveAndSync = async () => {
    const urlError = validateCanvasUrl(canvasUrl);
    if (urlError) {
      setSyncStatus({ ok: false, msg: urlError });
      return;
    }
    if (!canvasToken.trim()) {
      setSyncStatus({ ok: false, msg: 'Please enter your Canvas API token.' });
      return;
    }

    setSyncing(true);
    setSyncStatus(null);

    const normalizedUrl = canvasUrl.startsWith('http') ? canvasUrl : `https://${canvasUrl}`;

    await appStore.saveSettings({
      ...s,
      canvasUrl: normalizedUrl,
      canvasToken: canvasToken.trim(),
    });

    try {
      const { assignments, courses } = await fetchCanvasData(normalizedUrl, canvasToken.trim());
      await appStore.saveCanvasData(assignments, courses);
      setSyncStatus({ ok: true, msg: `Synced ${assignments.length} assignments across ${courses.length} courses.` });
    } catch (e: any) {
      const msg = e?.response?.status === 401
        ? 'Invalid API token. Please check your Canvas access token.'
        : e?.response?.status === 404
        ? 'Canvas URL not found. Make sure the URL is correct.'
        : e?.message || 'Could not connect to Canvas. Check your URL and token.';
      setSyncStatus({ ok: false, msg });
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = () => {
    Alert.alert('Disconnect Canvas', 'This will remove all synced Canvas data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await appStore.saveSettings({ ...s, canvasUrl: '', canvasToken: '' });
          await appStore.saveCanvasData([], []);
          setCanvasUrl('');
          setCanvasToken('');
          setSyncStatus(null);
        },
      },
    ]);
  };

  const connected = !!s.canvasUrl && !!s.canvasToken;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Canvas Integration */}
        <SectionLabel icon="school" label="Canvas LMS" color={COLORS.violet} />
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.emerald : COLORS.rose }]} />
            <Text style={styles.statusText}>
              {connected ? `Connected · ${state.assignments.length} assignments` : 'Not connected'}
            </Text>
            {connected && (
              <TouchableOpacity onPress={disconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.fieldLabel}>Canvas URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://canvas.yourschool.edu"
            placeholderTextColor={COLORS.textMuted}
            value={canvasUrl}
            onChangeText={setCanvasUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.fieldLabel}>API Access Token</Text>
          <View style={styles.tokenRow}>
            <TextInput
              style={[styles.input, styles.tokenInput]}
              placeholder="Paste your Canvas API token"
              placeholderTextColor={COLORS.textMuted}
              value={canvasToken}
              onChangeText={setCanvasToken}
              secureTextEntry={!showToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowToken((v) => !v)}
            >
              <Ionicons
                name={showToken ? 'eye-off' : 'eye'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Generate a token at: Canvas → Account → Settings → "New Access Token"
          </Text>

          {syncStatus && (
            <View style={[styles.syncMsg, { backgroundColor: syncStatus.ok ? COLORS.emerald + '22' : COLORS.rose + '22' }]}>
              <Ionicons
                name={syncStatus.ok ? 'checkmark-circle' : 'alert-circle'}
                size={15}
                color={syncStatus.ok ? COLORS.emerald : COLORS.rose}
              />
              <Text style={[styles.syncMsgText, { color: syncStatus.ok ? COLORS.emerald : COLORS.rose }]}>
                {syncStatus.msg}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
            onPress={saveAndSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sync" size={16} color="#fff" />
            )}
            <Text style={styles.syncBtnText}>
              {syncing ? 'Syncing…' : connected ? 'Re-sync Canvas' : 'Connect & Sync'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Email */}
        <SectionLabel icon="mail" label="Email" color={COLORS.sky} />
        <Card style={styles.card}>
          <View style={styles.oauthRow}>
            <View style={styles.oauthInfo}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <View>
                <Text style={styles.oauthTitle}>Google / Gmail</Text>
                <Text style={styles.oauthSubtitle}>Connect via OAuth 2.0</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectChip}>
              <Text style={styles.connectChipText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.oauthRow, { marginTop: 10 }]}>
            <View style={styles.oauthInfo}>
              <Ionicons name="logo-windows" size={20} color="#0078D4" />
              <View>
                <Text style={styles.oauthTitle}>Outlook / Microsoft</Text>
                <Text style={styles.oauthSubtitle}>Connect via OAuth 2.0</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectChip}>
              <Text style={styles.connectChipText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Email integration requires OAuth setup. Demo mode uses sample emails.</Text>
        </Card>

        {/* Calendar */}
        <SectionLabel icon="calendar" label="Calendar" color={COLORS.emerald} />
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar" size={18} color={COLORS.emerald} />
              <Text style={styles.settingText}>Sync Device Calendar</Text>
            </View>
            <Switch
              value={s.calendarConnected}
              onValueChange={(v) => appStore.saveSettings({ ...s, calendarConnected: v })}
              trackColor={{ false: COLORS.bg3, true: COLORS.emerald + '88' }}
              thumbColor={s.calendarConnected ? COLORS.emerald : COLORS.textMuted}
            />
          </View>
        </Card>

        {/* Notifications */}
        <SectionLabel icon="notifications" label="Notifications" color={COLORS.amber} />
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={18} color={COLORS.amber} />
              <Text style={styles.settingText}>Enable Notifications</Text>
            </View>
            <Switch
              value={s.notificationsEnabled}
              onValueChange={(v) => appStore.saveSettings({ ...s, notificationsEnabled: v })}
              trackColor={{ false: COLORS.bg3, true: COLORS.amber + '88' }}
              thumbColor={s.notificationsEnabled ? COLORS.amber : COLORS.textMuted}
            />
          </View>
        </Card>

        {/* About */}
        <SectionLabel icon="information-circle" label="About" color={COLORS.textMuted} />
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <View style={[styles.appIcon, { backgroundColor: COLORS.indigo + '22' }]}>
              <Ionicons name="grid" size={22} color={COLORS.indigo} />
            </View>
            <View>
              <Text style={styles.appName}>HubSync</Text>
              <Text style={styles.appVersion}>Version 1.0.0 · Built with Expo</Text>
            </View>
          </View>
          <Text style={styles.aboutDesc}>
            Your all-in-one academic information hub. Bringing emails, Canvas, and calendar into one clean interface.
          </Text>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },

  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, marginBottom: 8, paddingLeft: 2,
  },
  sectionLabelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  card: { gap: 10 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  disconnectText: { fontSize: 12, color: COLORS.rose, fontWeight: '600' },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bg0, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    color: COLORS.textPrimary, fontSize: 14, borderWidth: 1, borderColor: COLORS.bg2,
  },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenInput: { flex: 1 },
  eyeBtn: {
    width: 40, height: 42, backgroundColor: COLORS.bg0, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
  },

  hint: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  syncMsg: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    padding: 10, borderRadius: 10,
  },
  syncMsgText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },

  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.violet,
    paddingVertical: 13, borderRadius: 12,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  oauthRow: { flexDirection: 'row', alignItems: 'center' },
  oauthInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  oauthTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  oauthSubtitle: { fontSize: 11, color: COLORS.textMuted },
  connectChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: COLORS.indigo + '22',
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.indigo + '55',
  },
  connectChipText: { fontSize: 12, color: COLORS.indigo, fontWeight: '700' },

  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },

  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  appVersion: { fontSize: 12, color: COLORS.textMuted },
  aboutDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
