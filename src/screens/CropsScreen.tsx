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
import AddCropWizard from '../components/AddCropWizard';
import LogProductionDialog from '../components/LogProductionDialog';
import { cropsService } from '../services/crops.service';
import { tasksService } from '../services/tasks.service';
import { Crop, Task } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDate = (val: any): Date => {
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const LOCATION_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  outdoor: 'Outdoor',
  'raised-bed': 'Raised Bed',
  other: 'Other',
};

const LOCATION_COLORS: Record<string, string> = {
  greenhouse: '#1976D2',
  outdoor: '#388E3C',
  'raised-bed': '#795548',
  other: '#607D8B',
};

const STATUS_COLORS: Record<string, string> = {
  planted: '#8BC34A',
  growing: '#4CAF50',
  harvesting: '#FF9800',
  harvested: '#9E9E9E',
  failed: '#F44336',
};

function daysSincePlanting(plantedDate: any): number {
  const ms = Date.now() - toDate(plantedDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// ─── CropCard ─────────────────────────────────────────────────────────────────

interface CropCardProps {
  crop: Crop;
  tasks: Task[];
  onLogHarvest: () => void;
}

function CropCard({ crop, tasks, onLogHarvest }: CropCardProps) {
  const [expanded, setExpanded] = useState(false);

  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const now = new Date();
  const overdue = tasks.filter(t => {
    if (t.status !== 'pending' || !t.dueDate) return false;
    return toDate(t.dueDate) < now;
  }).length;
  const total = tasks.length;
  const progress = total > 0 ? completed / total : 0;

  const plantedDate = toDate(crop.plantedDate);
  const days = daysSincePlanting(crop.plantedDate);

  const upcomingTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <Card style={styles.cropCard}>
      <Card.Content>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text variant="titleMedium" style={styles.cropName}>
              {crop.variety ? `${crop.variety} ` : ''}{crop.name}
            </Text>
            <View style={styles.tagRow}>
              <Chip
                compact
                style={[styles.locationChip, { backgroundColor: LOCATION_COLORS[crop.location] }]}
                textStyle={styles.chipText}
              >
                {LOCATION_LABELS[crop.location] ?? crop.location}
              </Chip>
              <Chip
                compact
                style={[styles.statusChip, { backgroundColor: STATUS_COLORS[crop.status] ?? '#9E9E9E' }]}
                textStyle={styles.chipText}
              >
                {crop.status}
              </Chip>
            </View>
          </View>
          {(crop.status === 'harvesting' || crop.status === 'growing') && (
            <Button
              mode="outlined"
              compact
              onPress={onLogHarvest}
              style={styles.harvestBtn}
            >
              Log Harvest
            </Button>
          )}
        </View>

        {/* Planted / days */}
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.meta}>
            Planted {plantedDate.toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            Day {days}
          </Text>
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
        {crop.aiGeneratedPlan?.summary && (
          <Text variant="bodySmall" style={styles.summary} numberOfLines={expanded ? undefined : 2}>
            {crop.aiGeneratedPlan.summary}
          </Text>
        )}

        {/* Expand / collapse */}
        <Button
          mode="text"
          compact
          onPress={() => setExpanded(e => !e)}
          style={styles.expandBtn}
        >
          {expanded ? 'Show less' : 'Show details'}
        </Button>

        {/* Expanded: upcoming tasks + tips */}
        {expanded && (
          <>
            <Divider style={styles.divider} />

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

            {crop.aiGeneratedPlan?.tips && crop.aiGeneratedPlan.tips.length > 0 && (
              <>
                <Text variant="labelMedium" style={styles.sectionLabel}>Tips</Text>
                {crop.aiGeneratedPlan.tips.map((tip, i) => (
                  <Text key={i} variant="bodySmall" style={styles.tip}>• {tip}</Text>
                ))}
              </>
            )}

            {crop.aiGeneratedPlan?.warnings && crop.aiGeneratedPlan.warnings.length > 0 && (
              <>
                <Text variant="labelMedium" style={[styles.sectionLabel, { color: '#E65100' }]}>Warnings</Text>
                {crop.aiGeneratedPlan.warnings.map((w, i) => (
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

export default function CropsScreen() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [harvestCrop, setHarvestCrop] = useState<Crop | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cropsData, allTasks] = await Promise.all([
        cropsService.getActiveCrops(),
        tasksService.getAllTasks(),
      ]);
      setCrops(cropsData);

      // Group tasks by relatedTo.id
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
      console.error('Error loading crops:', error);
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
        {/* Summary header */}
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>My Garden</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            {crops.length} {crops.length === 1 ? 'crop' : 'crops'} growing
          </Text>
        </View>

        {crops.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">No crops yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Tap the + button to add your first crop. The AI will build a full care plan and schedule with realistic timelines for your location.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          crops.map(crop => (
            <CropCard
              key={crop.id}
              crop={crop}
              tasks={taskMap[crop.id] ?? []}
              onLogHarvest={() => setHarvestCrop(crop)}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} label="Add Crop" onPress={() => setShowAddWizard(true)} />

      <AddCropWizard
        visible={showAddWizard}
        onDismiss={() => setShowAddWizard(false)}
        onSuccess={loadData}
      />

      {harvestCrop && (
        <LogProductionDialog
          visible
          onDismiss={() => setHarvestCrop(null)}
          entityType="crop"
          entityId={harvestCrop.id}
          entityName={`${harvestCrop.variety ? harvestCrop.variety + ' ' : ''}${harvestCrop.name}`}
          productionType="harvest"
          onSuccess={loadData}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { marginBottom: 12 },
  headerTitle: { fontWeight: 'bold', color: '#2E7D32' },
  headerSub: { color: '#666', marginTop: 2 },
  emptyCard: { marginBottom: 16 },
  emptyText: { color: '#666', marginTop: 8 },
  cropCard: { marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleBlock: { flex: 1 },
  cropName: { fontWeight: 'bold', color: '#1B5E20' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  locationChip: { height: 24 },
  statusChip: { height: 24 },
  chipText: { color: '#fff', fontSize: 11 },
  harvestBtn: { marginLeft: 8, borderColor: '#4CAF50' },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  meta: { color: '#666' },
  progressBlock: { marginTop: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { color: '#555' },
  overdueLabel: { color: '#F44336' },
  progressBar: { height: 6, borderRadius: 3 },
  summary: { marginTop: 10, color: '#444', lineHeight: 20 },
  expandBtn: { alignSelf: 'flex-start', marginTop: 4 },
  divider: { marginVertical: 10 },
  sectionLabel: { fontWeight: 'bold', color: '#333', marginTop: 8, marginBottom: 4 },
  taskItem: { paddingVertical: 0, paddingLeft: 0 },
  overdueTask: { color: '#F44336' },
  tip: { color: '#444', marginBottom: 4 },
  warning: { color: '#E65100', marginBottom: 4 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#4CAF50' },
});
