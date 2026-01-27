import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

const TOOL_CARDS = [
  {
    id: 'wheel',
    title: 'Wheel of Destiny',
    description: 'Spin to pick a game from your library in seconds.',
    cta: 'Spin',
  },
  {
    id: 'filters',
    title: 'Game Finder',
    description: 'Filter by players, playtime, and game type.',
    cta: 'Filter',
  },
  {
    id: 'night-plan',
    title: 'Game Night Plan',
    description: 'Queue up a lineup so the night keeps moving.',
    cta: 'Build',
  },
  {
    id: 'teach',
    title: 'Teach Mode',
    description: 'Quick reminders for rules, setup, and teach order.',
    cta: 'Open',
  },
];

const QUICK_ACTIONS = [
  {
    id: 'random',
    label: 'Pick Random Game',
  },
  {
    id: 'players',
    label: 'Match Player Count',
  },
  {
    id: 'timer',
    label: 'Set Playtime Cap',
  },
];

export default function GameNiteToolsScreen() {
  const handleToolPress = (toolId: string) => {
    Alert.alert('Coming Soon', 'This tool is on the way to mobile.');
  };

  const handleQuickAction = (actionId: string) => {
    Alert.alert('Coming Soon', 'Quick actions will launch from here soon.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Nite Tools</Text>
        <Text style={styles.subtitle}>
          Launch helpers to pick the perfect game and keep the night moving.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action.id)}
            >
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tools Dashboard</Text>
        {TOOL_CARDS.map(tool => (
          <View key={tool.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{tool.description}</Text>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => handleToolPress(tool.id)}
            >
              <Text style={styles.cardButtonText}>{tool.cta}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          More tools are coming soon based on the web app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
