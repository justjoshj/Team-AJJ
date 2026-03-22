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
import { fetchCanvasCalendar } from '../../src/services/canvasService';
import { useGoogleAuth } from '../../src/services/googleAuth';
import { fetchGmail } from '../../src/services/gmailService';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const state = useStore();
  const s = state.settings;

  const [canvasFeedUrl, setCanvasFeedUrl] = useState(s.canvasFeedUrl || '');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<null | { ok: boolean; msg: string }>(null);

  const { request, response, promptAsync } = useGoogleAuth();

  // Keep input in sync with stored settings
  useEffect(() => {
    setCanvasFeedUrl(s.canvasFeedUrl || '');
  }, [s.canvasFeedUrl]);

  // ✅ Handle Google OAuth response (ONLY ONCE)
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('AUTH RESPONSE:', response);
      const token = response.authentication?.accessToken;

      if (token) {
        (async () => {
          try {
            const emails = await fetchGmail(token);
            console.log('FETCHED EMAILS:', emails);

            await appStore.saveEmailData(emails);

            Alert.alert('Success', `Fetched ${emails.length} emails`);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch Gmail');
          }
        })();
      }
    }
  }, [response]);

  // ✅ Trigger Google login
  const connectGoogle = () => {
    promptAsync();
  };

  const saveAndSync = async () => {
    if (!canvasFeedUrl.trim()) {
      setSyncStatus({ ok: false, msg: 'Please enter your Canvas calendar feed URL.' });
      return;
    }

    setSyncing(true);
    setSyncStatus(null);

    try {
      await appStore.saveSettings({
        ...s,
        canvasFeedUrl: canvasFeedUrl.trim(),
      });

      const { assignments, courses } = await fetchCanvasCalendar(canvasFeedUrl.trim());
      await appStore.saveCanvasData(assignments, courses);

      setSyncStatus({
        ok: true,
        msg: `Synced ${assignments.length} assignments across ${courses.length} courses.`,
      });
    } catch (e) {
      setSyncStatus({
        ok: false,
        msg: 'Invalid calendar feed URL or unable to fetch data.',
      });
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
        // 1. Clear the URL in settings
        await appStore.saveSettings({ ...s, canvasFeedUrl: '' });
        
        // 2. Clear the actual assignments and courses data
        await appStore.saveCanvasData([], []);
        
        // 3. Clear the local state so the UI updates immediately
        setCanvasFeedUrl('');
        setSyncStatus(null);
      },
    },
  ]);
};


  const connected = !!s.canvasFeedUrl;

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

          <Text style={styles.fieldLabel}>Canvas Calendar Feed URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your Canvas calendar feed (.ics)"
            placeholderTextColor={COLORS.textMuted}
            value={canvasFeedUrl}
            onChangeText={setCanvasFeedUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.hint}>
            Go to Canvas → Calendar → "Calendar Feed" → copy the URL
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
        <Text style={styles.oauthSubtitle}>
          {state.emails?.length
            ? `${state.emails.length} emails synced`
            : 'Connect via OAuth 2.0'}
        </Text>
        <Card style={styles.card}>
          <View style={styles.oauthRow}>
            <View style={styles.oauthInfo}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <View>
                <Text style={styles.oauthTitle}>Google / Gmail</Text>
                <Text style={styles.oauthSubtitle}>Connect via OAuth 2.0</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectChip} onPress={connectGoogle}>
              <Text style={styles.connectChipText}>Connect</Text>
            </TouchableOpacity>
          </View>
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  card: { gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  disconnectText: { fontSize: 12, color: COLORS.rose },

  fieldLabel: { fontSize: 12, color: COLORS.textMuted },
  input: {
    backgroundColor: COLORS.bg0,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.bg2,
    color: COLORS.textPrimary,
  },

  hint: { fontSize: 11, color: COLORS.textMuted },

  syncMsg: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: 10 },
  syncMsgText: { fontSize: 12 },

  syncBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.violet,
  },
  syncBtnText: { color: '#fff', fontWeight: '700' },

  oauthRow: { flexDirection: 'row', alignItems: 'center' },
  oauthInfo: { flex: 1, flexDirection: 'row', gap: 10 },
  oauthTitle: { color: COLORS.textPrimary },
  oauthSubtitle: { color: COLORS.textMuted },

  connectChip: { padding: 6, backgroundColor: COLORS.indigo + '22', borderRadius: 20 },
  connectChipText: { color: COLORS.indigo },

  syncBtnDisabled: { opacity: 0.6 },
});