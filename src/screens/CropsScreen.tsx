import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
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
import AddCropWizard from '../components/AddCropWizard';
import LogProductionDialog from '../components/LogProductionDialog';
import { cropsService } from '../services/crops.service';
import { tasksService } from '../services/tasks.service';
import { Crop, Task } from '../types';

// ─── Theme ────────────────────────────────────────────────────────────────────

const R = {
  bg:           '#F2EAD3',  // parchment
  card:         '#FFFBF2',  // cream card
  cardBorder:   '#DDD0B3',
  titleDark:    '#3E2723',  // dark walnut
  titleMid:     '#5D4037',  // medium brown
  textMid:      '#6D4C41',
  textLight:    '#8D6E63',
  divider:      '#D7CCC8',
  green:        '#558B2F',  // earthy green
  greenLight:   '#AED581',
  amber:        '#F57F17',
  red:          '#C62828',
  fabBg:        '#5D4037',
  expandTxt:    '#795548',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDate = (val: any): Date => {
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const LOCATION_LABELS: Record<string, string> = {
  greenhouse:  'Greenhouse',
  outdoor:     'Outdoor',
  'raised-bed':'Raised Bed',
  other:       'Other',
};

const LOCATION_COLORS: Record<string, string> = {
  greenhouse:  '#1565C0',
  outdoor:     '#33691E',
  'raised-bed':'#5D4037',
  other:       '#607D8B',
};

const STATUS_COLORS: Record<string, string> = {
  planted:    '#7CB342',
  growing:    '#558B2F',
  harvesting: '#F57F17',
  harvested:  '#8D6E63',
  failed:     '#C62828',
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
  onDelete: () => void;
}

function CropCard({ crop, tasks, onLogHarvest, onDelete }: CropCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const completed = tasks.filter(t => t.status === 'completed').length;
  const now       = new Date();
  const overdue   = tasks.filter(t => {
    if (t.status !== 'pending' || !t.dueDate) return false;
    return toDate(t.dueDate) < now;
  }).length;
  const total    = tasks.length;
  const progress = total > 0 ? completed / total : 0;

  const plantedDate   = toDate(crop.plantedDate);
  const days          = daysSincePlanting(crop.plantedDate);
  const upcomingTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
    .slice(0, 5);

  function confirmDelete() {
    Alert.alert(
      'Delete Crop',
      `Remove ${crop.variety ? crop.variety + ' ' : ''}${crop.name} and all its tasks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await cropsService.deleteCrop(crop.id);
              onDelete();
            } catch (e) {
              Alert.alert('Error', 'Could not delete crop. Please try again.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

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
                style={[styles.chip, { backgroundColor: LOCATION_COLORS[crop.location] }]}
                textStyle={styles.chipText}
              >
                {LOCATION_LABELS[crop.location] ?? crop.location}
              </Chip>
              <Chip
                compact
                style={[styles.chip, { backgroundColor: STATUS_COLORS[crop.status] ?? '#8D6E63' }]}
                textStyle={styles.chipText}
              >
                {crop.status}
              </Chip>
            </View>
          </View>

          <View style={styles.cardActions}>
            {(crop.status === 'harvesting' || crop.status === 'growing') && (
              <Button
                mode="outlined"
                compact
                onPress={onLogHarvest}
                style={styles.harvestBtn}
                labelStyle={styles.harvestBtnLabel}
              >
                Log Harvest
              </Button>
            )}
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={deleting}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={deleting ? R.textLight : R.red}
              />
            </TouchableOpacity>
          </View>
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
              color={overdue > 0 ? R.red : R.green}
              style={styles.progressBar}
            />
          </View>
        )}

        {/* Care plan summary */}
        {crop.aiGeneratedPlan?.summary && (
          <Text
            variant="bodySmall"
            style={styles.summary}
            numberOfLines={expanded ? undefined : 2}
          >
            {crop.aiGeneratedPlan.summary}
          </Text>
        )}

        {/* Expand / collapse */}
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.expandRow}>
          <Text style={styles.expandTxt}>{expanded ? 'Show less' : 'Show details'}</Text>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={R.expandTxt}
          />
        </TouchableOpacity>

        {/* Expanded details */}
        {expanded && (
          <>
            <Divider style={styles.divider} />

            {upcomingTasks.length > 0 && (
              <>
                <Text variant="labelMedium" style={styles.sectionLabel}>Upcoming Tasks</Text>
                {upcomingTasks.map((task, i) => {
                  const due      = toDate(task.dueDate);
                  const isOverdue = due < now;
                  return (
                    <List.Item
                      key={task.id ?? i}
                      title={task.title}
                      description={due.toLocaleDateString()}
                      titleStyle={[styles.taskTitle, isOverdue && styles.overdueTask]}
                      descriptionStyle={isOverdue ? styles.overdueLabel : styles.taskDesc}
                      left={props => (
                        <List.Icon
                          {...props}
                          icon={isOverdue ? 'alert-circle' : 'calendar-clock'}
                          color={isOverdue ? R.red : R.green}
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
                <Text variant="labelMedium" style={[styles.sectionLabel, { color: R.amber }]}>
                  Warnings
                </Text>
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
  const [crops, setCrops]         = useState<Crop[]>([]);
  const [taskMap, setTaskMap]     = useState<Record<string, Task[]>>({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [harvestCrop, setHarvestCrop]     = useState<Crop | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cropsData, allTasks] = await Promise.all([
        cropsService.getActiveCrops(),
        tasksService.getAllTasks(),
      ]);
      setCrops(cropsData);

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
        <ActivityIndicator size="large" color={R.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={R.green}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>My Garden</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            {crops.length} {crops.length === 1 ? 'crop' : 'crops'} growing
          </Text>
        </View>

        {crops.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyTitle}>No crops yet</Text>
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
              onDelete={loadData}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB
        icon="sprout"
        style={styles.fab}
        label="Add Crop"
        onPress={() => setShowAddWizard(true)}
        color="#fff"
      />

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
  container:        { flex: 1, backgroundColor: R.bg },
  scroll:           { flex: 1, padding: 16 },
  centered:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: R.bg },

  headerRow:        { marginBottom: 16 },
  headerTitle:      { fontWeight: 'bold', color: R.titleDark, fontSize: 22 },
  headerSub:        { color: R.textMid, marginTop: 2 },

  emptyCard:        { backgroundColor: R.card, borderColor: R.cardBorder, borderWidth: 1, marginBottom: 16 },
  emptyTitle:       { color: R.titleDark },
  emptyText:        { color: R.textMid, marginTop: 8, lineHeight: 20 },

  cropCard:         { marginBottom: 16, backgroundColor: R.card, borderColor: R.cardBorder, borderWidth: 1, elevation: 1 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleBlock:   { flex: 1, marginRight: 8 },
  cardActions:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cropName:         { fontWeight: 'bold', color: R.titleDark },
  tagRow:           { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  chip:             { height: 24 },
  chipText:         { color: '#fff', fontSize: 11 },
  harvestBtn:       { borderColor: R.green, height: 32 },
  harvestBtnLabel:  { color: R.green, fontSize: 12 },
  deleteBtn:        { padding: 4 },

  metaRow:          { flexDirection: 'row', gap: 16, marginTop: 8 },
  meta:             { color: R.textLight },

  progressBlock:    { marginTop: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel:    { color: R.textMid },
  overdueLabel:     { color: R.red },
  progressBar:      { height: 6, borderRadius: 3, backgroundColor: '#D7CCC8' },

  summary:          { marginTop: 10, color: R.textMid, lineHeight: 20 },

  expandRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 2 },
  expandTxt:        { color: R.expandTxt, fontSize: 13, fontWeight: '500' },

  divider:          { marginVertical: 10, backgroundColor: R.divider },
  sectionLabel:     { fontWeight: 'bold', color: R.titleMid, marginTop: 8, marginBottom: 4 },
  taskItem:         { paddingVertical: 0, paddingLeft: 0, backgroundColor: 'transparent' },
  taskTitle:        { color: R.titleDark, fontSize: 14 },
  taskDesc:         { color: R.textLight },
  overdueTask:      { color: R.red },
  tip:              { color: R.textMid, marginBottom: 4, lineHeight: 18 },
  warning:          { color: R.amber, marginBottom: 4, lineHeight: 18 },

  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: R.fabBg,
  },
});
