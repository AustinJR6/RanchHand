import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Divider, Snackbar } from 'react-native-paper';
import { settingsService, FarmSettings } from '../services/settings.service';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<FarmSettings>({
    farmName: '',
    location: '',
    units: 'imperial',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.get().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await settingsService.save(settings);
    setSaved(true);
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Farm Profile</Text>
            <Text variant="bodySmall" style={styles.hint}>
              This information helps the AI generate accurate schedules and recommendations.
            </Text>

            <TextInput
              label="Farm Name"
              value={settings.farmName}
              onChangeText={v => setSettings(s => ({ ...s, farmName: v }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Green Acres Homestead"
            />

            <TextInput
              label="Location (City, State)"
              value={settings.location}
              onChangeText={v => setSettings(s => ({ ...s, location: v }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Highland, IL"
            />
            <Text variant="bodySmall" style={styles.hint}>
              Used for frost dates, climate zone, and seasonal planting windows. Be specific — city and state gives the best results.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Units</Text>
            <View style={styles.unitRow}>
              <Button
                mode={settings.units === 'imperial' ? 'contained' : 'outlined'}
                onPress={() => setSettings(s => ({ ...s, units: 'imperial' }))}
                style={styles.unitBtn}
              >
                Imperial (ft, lb, °F)
              </Button>
              <Button
                mode={settings.units === 'metric' ? 'contained' : 'outlined'}
                onPress={() => setSettings(s => ({ ...s, units: 'metric' }))}
                style={styles.unitBtn}
              >
                Metric (m, kg, °C)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.hint}>
              After saving your location, newly added crops and animals will receive care plans tailored to your climate and growing season.
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          buttonColor="#4CAF50"
        >
          Save Settings
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Snackbar visible={saved} onDismiss={() => setSaved(false)} duration={2500}>
        Settings saved!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EAD3' },
  scroll: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  input: { marginBottom: 12 },
  hint: { color: '#666', marginBottom: 12 },
  unitRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  unitBtn: { flex: 1 },
  divider: { marginBottom: 16 },
  saveBtn: { marginTop: 8 },
});
