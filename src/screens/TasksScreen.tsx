import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Checkbox,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  List,
  Divider,
  IconButton,
  Text,
  ActivityIndicator
} from 'react-native-paper';
import { Task, tasksService as taskService } from '../services/tasks.service';
import { livestockService } from '../services/livestock.service';
import { cropsService } from '../services/crops.service';
import { geminiService } from '../services/openai';
import { Timestamp } from 'firebase/firestore';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other' as Task['category'],
    dueDate: new Date(),
    isRecurring: false,
    frequency: 'daily' as Task['frequency']
  });

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = tasks;

    switch (filter) {
      case 'today':
        filtered = tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = task.dueDate.toDate();
          return taskDate >= today && taskDate < tomorrow && task.status !== 'completed';
        });
        break;
      case 'upcoming':
        filtered = tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = task.dueDate.toDate();
          return taskDate >= tomorrow && task.status !== 'completed';
        });
        break;
      case 'overdue':
        filtered = tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = task.dueDate.toDate();
          return taskDate < today && task.status !== 'completed';
        });
        break;
      default:
        filtered = tasks;
    }

    setFilteredTasks(filtered);
  };

  const handleToggleTask = async (taskId: string, currentStatus: Task['status']) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await taskService.updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleAddTask = async () => {
    try {
      await taskService.createTask({
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        dueDate: Timestamp.fromDate(newTask.dueDate),
        isRecurring: newTask.isRecurring,
        frequency: newTask.isRecurring ? newTask.frequency : undefined,
        status: 'pending'
      });

      setAddDialogVisible(false);
      setNewTask({
        title: '',
        description: '',
        category: 'other',
        dueDate: new Date(),
        isRecurring: false,
        frequency: 'daily'
      });

      await loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setGeneratingSchedule(true);
      setShowScheduleDialog(true);

      const [animals, crops] = await Promise.all([
        livestockService.getActiveAnimals(),
        cropsService.getActiveCrops()
      ]);

      const schedule = await geminiService.generateWeeklySchedule({
        animals: animals.map(a => ({ type: a.type, breed: a.breed, quantity: a.quantity })),
        crops: crops.map(c => ({ name: c.name, variety: c.variety, location: c.location, status: c.status }))
      });

      setGeneratedSchedule(schedule);
    } catch (error) {
      console.error('Error generating schedule:', error);
      setGeneratedSchedule('Error generating schedule. Please check your API key and try again.');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    const icons = {
      feeding: 'food-apple',
      watering: 'water',
      cleaning: 'broom',
      health: 'medical-bag',
      maintenance: 'tools',
      harvesting: 'basket',
      financial: 'currency-usd',
      other: 'dots-horizontal'
    };
    return icons[category];
  };

  const getCategoryColor = (category: Task['category']) => {
    const colors = {
      feeding: '#4CAF50',
      watering: '#2196F3',
      cleaning: '#FF9800',
      health: '#F44336',
      maintenance: '#9C27B0',
      harvesting: '#8BC34A',
      financial: '#00BCD4',
      other: '#757575'
    };
    return colors[category];
  };

  const getStatusStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return taskDate >= today && taskDate < tomorrow;
    });

    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate();
      return taskDate < today && task.status !== 'completed';
    });

    return {
      total: tasks.length,
      today: todayTasks.length,
      todayCompleted: todayTasks.filter(t => t.status === 'completed').length,
      overdue: overdueTasks.length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  };

  const stats = getStatusStats();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Stats Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Task Overview</Title>
            <View style={styles.statsRow}>
              <Chip icon="checkbox-marked-circle">{stats.todayCompleted}/{stats.today} Today</Chip>
              <Chip icon="alert-circle" textStyle={{ color: '#F44336' }}>{stats.overdue} Overdue</Chip>
              <Chip icon="check-all">{stats.completed} Completed</Chip>
            </View>
            <Button
              icon="calendar-clock"
              mode="outlined"
              onPress={handleGenerateSchedule}
              style={styles.generateButton}
            >
              Generate AI Schedule
            </Button>
          </Card.Content>
        </Card>

        {/* Filter Buttons */}
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'overdue', label: 'Overdue' }
          ]}
          style={styles.segmentedButtons}
        />

        {/* Tasks List */}
        {loading ? (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph>Loading tasks...</Paragraph>
            </Card.Content>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Title>No Tasks</Title>
              <Paragraph>
                {filter === 'all'
                  ? 'No tasks yet. Add a task or they will be created automatically when you add animals or crops.'
                  : `No ${filter} tasks.`}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              {filteredTasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <List.Item
                    title={task.title}
                    description={`${task.description || ''}\n${task.dueDate ? task.dueDate.toDate().toLocaleDateString() : 'No due date'}${task.isRecurring ? ` • ${task.frequency}` : ''}`}
                    left={() => (
                      <Checkbox
                        status={task.status === 'completed' ? 'checked' : 'unchecked'}
                        onPress={() => handleToggleTask(task.id, task.status)}
                      />
                    )}
                    right={() => (
                      <View style={styles.taskRight}>
                        <Chip
                          icon={getCategoryIcon(task.category)}
                          style={{ backgroundColor: getCategoryColor(task.category) }}
                          textStyle={{ color: 'white' }}
                          compact
                        >
                          {task.category}
                        </Chip>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleDeleteTask(task.id)}
                        />
                      </View>
                    )}
                    style={task.status === 'completed' ? styles.completedTask : undefined}
                  />
                  {index < filteredTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add Task FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddDialogVisible(true)}
        label="Add Task"
      />

      {/* Add Task Dialog */}
      <Portal>
        <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
          <Dialog.Title>Add New Task</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Task Title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description (optional)"
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Text variant="labelLarge" style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {(['feeding', 'watering', 'cleaning', 'health', 'maintenance', 'harvesting', 'financial', 'other'] as Task['category'][]).map((cat) => (
                <Chip
                  key={cat}
                  selected={newTask.category === cat}
                  onPress={() => setNewTask({ ...newTask, category: cat })}
                  style={styles.categoryChip}
                  icon={getCategoryIcon(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </View>

            <List.Item
              title="Recurring Task"
              right={() => (
                <Checkbox
                  status={newTask.isRecurring ? 'checked' : 'unchecked'}
                  onPress={() => setNewTask({ ...newTask, isRecurring: !newTask.isRecurring })}
                />
              )}
            />

            {newTask.isRecurring && (
              <>
                <Text variant="labelLarge" style={styles.label}>Frequency</Text>
                <SegmentedButtons
                  value={newTask.frequency}
                  onValueChange={(value) => setNewTask({ ...newTask, frequency: value as Task['frequency'] })}
                  buttons={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddTask} disabled={!newTask.title.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {/* AI Schedule Dialog */}
        <Dialog
          visible={showScheduleDialog}
          onDismiss={() => setShowScheduleDialog(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>AI Generated Weekly Schedule</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {generatingSchedule ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    Generating your personalized schedule...
                  </Text>
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.scheduleText}>
                  {generatedSchedule}
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowScheduleDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EAD3',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedTask: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
  generateButton: {
    marginTop: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  scheduleText: {
    padding: 16,
    lineHeight: 24,
  },
});
