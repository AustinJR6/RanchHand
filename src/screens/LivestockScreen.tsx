import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  FAB,
  Card,
  Text,
  Chip,
  Divider,
  List,
  Button,
  ProgressBar,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AddAnimalWizard from '../components/AddAnimalWizard';
import LogProductionDialog from '../components/LogProductionDialog';
import { livestockService } from '../services/livestock.service';
import { tasksService } from '../services/tasks.service';
import { Animal, Task } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDate = (val: any): Date => {
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const ANIMAL_ICONS: Record<string, string> = {
  chicken: 'bird',
  goat:    'horse-variant',
  cow:     'cow',
  other:   'paw',
};

const ANIMAL_COLORS: Record<string, string> = {
  chicken: '#FF8F00',
  goat:    '#6D4C41',
  cow:     '#455A64',
  other:   '#546E7A',
};

const STATUS_COLORS: Record<string, string> = {
  active:   '#4CAF50',
  sold:     '#9E9E9E',
  deceased: '#F44336',
};

function daysSinceAcquired(dateAcquired: any): number {
  const ms = Date.now() - toDate(dateAcquired).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function getProductionType(animal: Animal): 'egg-collection' | 'milk' | 'other' {
  if (animal.type === 'chicken') return 'egg-collection';
  if (animal.type === 'cow' || animal.type === 'goat') return 'milk';
  return 'other';
}

function getProductionLabel(animal: Animal): string {
  if (animal.type === 'chicken') return 'Log Eggs';
  if (animal.type === 'cow' || animal.type === 'goat') return 'Log Milk';
  return 'Log Production';
}

// ─── AnimalCard ───────────────────────────────────────────────────────────────

interface AnimalCardProps {
  animal: Animal;
  tasks: Task[];
  onLogProduction: () => void;
}

function AnimalCard({ animal, tasks, onLogProduction }: AnimalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const completed  = tasks.filter(t => t.status === 'completed').length;
  const total      = tasks.length;
  const now        = new Date();
  const overdue    = tasks.filter(t => {
    if (t.status !== 'pending' || !t.dueDate) return false;
    return toDate(t.dueDate) < now;
  }).length;
  const progress   = total > 0 ? completed / total : 0;

  const acquiredDate = toDate(animal.dateAcquired);
  const days         = daysSinceAcquired(animal.dateAcquired);
  const displayName  = `${animal.breed ? animal.breed + ' ' : ''}${animal.name || animal.type}`;
  const iconName     = ANIMAL_ICONS[animal.type] ?? 'paw';
  const iconColor    = ANIMAL_COLORS[animal.type] ?? '#546E7A';

  const upcomingTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <Card style={styles.animalCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconBlock}>
            <MaterialCommunityIcons name={iconName as any} size={32} color={iconColor} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text variant="titleMedium" style={styles.animalName}>{displayName}</Text>
            <View style={styles.tagRow}>
              <Chip compact style={[styles.typeChip, { backgroundColor: iconColor }]} textStyle={styles.chipText}>
                {animal.type}
              </Chip>
              <Chip compact style={[styles.statusChip, { backgroundColor: STATUS_COLORS[animal.status] ?? '#9E9E9E' }]} textStyle={styles.chipText}>
                {animal.status}
              </Chip>
              <Chip compact style={styles.countChip} textStyle={styles.countText}>
                ×{animal.quantity}
              </Chip>
            </View>
          </View>
          <Button mode="outlined" compact onPress={onLogProduction} style={styles.logBtn}>
            {getProductionLabel(animal)}
          </Button>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.meta}>
            Acquired {acquiredDate.toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            Day {days}
          </Text>
          {animal.cost != null && (
            <Text variant="bodySmall" style={styles.meta}>
              Cost ${animal.cost.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Task progress */}
        {total > 0 && (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabelRow}>
              <Text variant="labelSmall" style={styles.progressLabel}>
                Tasks: {completed}/{total} complete
              </Text>
              {overdue > 0 && (
                <Text variant="labelSmall" style={styles.overdueLabel}>
                  {overdue} overdue
                </Text>
              )}
            </View>
            <ProgressBar
              progress={progress}
              color={overdue > 0 ? '#F44336' : '#4CAF50'}
              style={styles.progressBar}
            />
          </View>
        )}

        {/* Care plan summary */}
        {animal.aiGeneratedPlan?.summary && (
          <Text variant="bodySmall" style={styles.summary} numberOfLines={expanded ? undefined : 2}>
            {animal.aiGeneratedPlan.summary}
          </Text>
        )}

        <Button mode="text" compact onPress={() => setExpanded(e => !e)} style={styles.expandBtn}>
          {expanded ? 'Show less' : 'Show details'}
        </Button>

        {/* Expanded section */}
        {expanded && (
          <>
            <Divider style={styles.divider} />

            {animal.notes && (
              <>
                <Text variant="labelMedium" style={styles.sectionLabel}>Notes</Text>
                <Text variant="bodySmall" style={styles.note}>{animal.notes}</Text>
              </>
            )}

            {upcomingTasks.length > 0 && (
              <>
                <Text variant="labelMedium" style={styles.sectionLabel}>Upcoming Tasks</Text>
                {upcomingTasks.map((task, i) => {
                  const due = toDate(task.dueDate);
                  const isOverdue = due < now;
                  return (
                    <List.Item
                      key={task.id ?? i}
                      title={task.title}
                      description={due.toLocaleDateString()}
                      titleStyle={isOverdue ? styles.overdueTask : undefined}
                      descriptionStyle={isOverdue ? styles.overdueLabel : undefined}
                      left={props => (
                        <List.Icon
                          {...props}
                          icon={isOverdue ? 'alert-circle' : 'calendar-clock'}
                          color={isOverdue ? '#F44336' : '#4CAF50'}
                        />
                      )}
                      style={styles.taskItem}
                    />
                  );
                })}
              </>
            )}

            {animal.aiGeneratedPlan?.tips && animal.aiGeneratedPlan.tips.length > 0 && (
              <>
                <Text variant="labelMedium" style={styles.sectionLabel}>Tips</Text>
                {animal.aiGeneratedPlan.tips.map((tip, i) => (
                  <Text key={i} variant="bodySmall" style={styles.tip}>• {tip}</Text>
                ))}
              </>
            )}

            {animal.aiGeneratedPlan?.warnings && animal.aiGeneratedPlan.warnings.length > 0 && (
              <>
                <Text variant="labelMedium" style={[styles.sectionLabel, { color: '#E65100' }]}>Warnings</Text>
                {animal.aiGeneratedPlan.warnings.map((w, i) => (
                  <Text key={i} variant="bodySmall" style={styles.warning}>⚠ {w}</Text>
                ))}
              </>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LivestockScreen() {
  const [animals, setAnimals]     = useState<Animal[]>([]);
  const [taskMap, setTaskMap]     = useState<Record<string, Task[]>>({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [logAnimal, setLogAnimal] = useState<Animal | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [animalsData, allTasks] = await Promise.all([
        livestockService.getActiveAnimals(),
        tasksService.getAllTasks(),
      ]);
      setAnimals(animalsData);

      const map: Record<string, Task[]> = {};
      for (const task of allTasks) {
        const id = (task as any).relatedTo?.id;
        if (id) {
          if (!map[id]) map[id] = [];
          map[id].push(task);
        }
      }
      setTaskMap(map);
    } catch (error) {
      console.error('Error loading livestock:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalAnimals = animals.reduce((sum, a) => sum + a.quantity, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>My Livestock</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            {totalAnimals} {totalAnimals === 1 ? 'animal' : 'animals'} across {animals.length} {animals.length === 1 ? 'group' : 'groups'}
          </Text>
        </View>

        {animals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">No livestock yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Tap the + button to add your first animal. The AI will generate a full care plan with feeding, health, and maintenance schedules.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          animals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              tasks={taskMap[animal.id] ?? []}
              onLogProduction={() => setLogAnimal(animal)}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} label="Add Animal" onPress={() => setShowAddWizard(true)} />

      <AddAnimalWizard
        visible={showAddWizard}
        onDismiss={() => setShowAddWizard(false)}
        onSuccess={loadData}
      />

      {logAnimal && (
        <LogProductionDialog
          visible
          onDismiss={() => setLogAnimal(null)}
          entityType="animal"
          entityId={logAnimal.id}
          entityName={`${logAnimal.breed ? logAnimal.breed + ' ' : ''}${logAnimal.name || logAnimal.type}`}
          productionType={getProductionType(logAnimal)}
          onSuccess={loadData}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  scroll:          { flex: 1, padding: 16 },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow:       { marginBottom: 12 },
  headerTitle:     { fontWeight: 'bold', color: '#1B5E20' },
  headerSub:       { color: '#666', marginTop: 2 },
  emptyCard:       { marginBottom: 16 },
  emptyText:       { color: '#666', marginTop: 8 },
  animalCard:      { marginBottom: 16, elevation: 2 },
  cardHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBlock:       { paddingTop: 2 },
  cardTitleBlock:  { flex: 1 },
  animalName:      { fontWeight: 'bold', color: '#1B5E20' },
  tagRow:          { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  typeChip:        { height: 24 },
  statusChip:      { height: 24 },
  countChip:       { height: 24, backgroundColor: '#E8F5E9' },
  chipText:        { color: '#fff', fontSize: 11 },
  countText:       { color: '#2E7D32', fontSize: 11 },
  logBtn:          { borderColor: '#4CAF50', alignSelf: 'flex-start' },
  metaRow:         { flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  meta:            { color: '#666' },
  progressBlock:   { marginTop: 12 },
  progressLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel:   { color: '#555' },
  overdueLabel:    { color: '#F44336' },
  progressBar:     { height: 6, borderRadius: 3 },
  summary:         { marginTop: 10, color: '#444', lineHeight: 20 },
  expandBtn:       { alignSelf: 'flex-start', marginTop: 4 },
  divider:         { marginVertical: 10 },
  sectionLabel:    { fontWeight: 'bold', color: '#333', marginTop: 8, marginBottom: 4 },
  note:            { color: '#555', marginBottom: 4 },
  taskItem:        { paddingVertical: 0, paddingLeft: 0 },
  overdueTask:     { color: '#F44336' },
  tip:             { color: '#444', marginBottom: 4 },
  warning:         { color: '#E65100', marginBottom: 4 },
  fab:             { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#4CAF50' },
});
