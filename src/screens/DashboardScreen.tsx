import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Chip, List, Text, Divider, Button, FAB } from 'react-native-paper';
import AIAssistantDialog from '../components/AIAssistantDialog';
import { livestockService } from '../services/livestock.service';
import { cropsService } from '../services/crops.service';
import { tasksService as taskService } from '../services/tasks.service';
import { financialService } from '../services/financial.service';
import { productionService } from '../services/production.service';
import { Animal, Crop, Task } from '../types';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [financialSummary, setFinancialSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [animalsData, cropsData, tasksData, financialData] = await Promise.all([
        livestockService.getActiveAnimals(),
        cropsService.getActiveCrops(),
        taskService.getAllTasks(),
        financialService.getOverallProfitLoss()
      ]);

      setAnimals(animalsData);
      setCrops(cropsData);
      setTasks(tasksData);
      setFinancialSummary(financialData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getTodaysTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const taskDate = task.dueDate.toDate();
      return taskDate >= today && taskDate < tomorrow;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const taskDate = task.dueDate.toDate();
      return taskDate < today;
    });
  };

  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Welcome Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome to Ranch Hand</Title>
            <Paragraph>Your farm management assistant powered by AI</Paragraph>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Quick Stats</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#4CAF50' }}>
                  {animals.length}
                </Text>
                <Text variant="labelLarge">Livestock</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#8BC34A' }}>
                  {crops.length}
                </Text>
                <Text variant="labelLarge">Active Crops</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#FF9800' }}>
                  {tasks.filter(t => t.status === 'pending').length}
                </Text>
                <Text variant="labelLarge">Pending Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#2196F3' }}>
                  {completedTasks}
                </Text>
                <Text variant="labelLarge">Completed</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Financial Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Financial Overview</Title>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text variant="labelSmall">Income</Text>
                <Text variant="titleLarge" style={{ color: '#4CAF50' }}>
                  ${financialSummary.income.toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text variant="labelSmall">Expenses</Text>
                <Text variant="titleLarge" style={{ color: '#F44336' }}>
                  ${financialSummary.expenses.toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text variant="labelSmall">Profit</Text>
                <Text
                  variant="titleLarge"
                  style={{ color: financialSummary.profit >= 0 ? '#4CAF50' : '#F44336' }}
                >
                  ${financialSummary.profit.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Today's Tasks */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Today's Tasks</Title>
              {overdueTasks.length > 0 && (
                <Chip icon="alert" style={{ backgroundColor: '#F44336' }} textStyle={{ color: 'white' }} compact>
                  {overdueTasks.length} overdue
                </Chip>
              )}
            </View>
            {loading ? (
              <Paragraph>Loading...</Paragraph>
            ) : todaysTasks.length === 0 ? (
              <Paragraph>No tasks scheduled for today</Paragraph>
            ) : (
              todaysTasks.slice(0, 5).map((task, index) => (
                <React.Fragment key={task.id}>
                  <List.Item
                    title={task.title}
                    description={task.category}
                    left={props => <List.Icon {...props} icon="checkbox-blank-circle-outline" />}
                  />
                  {index < Math.min(todaysTasks.length, 5) - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
            {todaysTasks.length > 5 && (
              <Paragraph style={styles.moreText}>
                +{todaysTasks.length - 5} more tasks
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Livestock Summary */}
        {animals.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Livestock Overview</Title>
              {animals.slice(0, 3).map((animal, index) => (
                <React.Fragment key={animal.id}>
                  <List.Item
                    title={`${animal.breed || ''} ${animal.type}`.trim()}
                    description={`Quantity: ${animal.quantity}`}
                    left={props => <List.Icon {...props} icon="barn" />}
                  />
                  {index < Math.min(animals.length, 3) - 1 && <Divider />}
                </React.Fragment>
              ))}
              {animals.length > 3 && (
                <Paragraph style={styles.moreText}>
                  +{animals.length - 3} more animals
                </Paragraph>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Crops Summary */}
        {crops.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Crops Overview</Title>
              {crops.slice(0, 3).map((crop, index) => (
                <React.Fragment key={crop.id}>
                  <List.Item
                    title={`${crop.variety ? crop.variety + ' ' : ''}${crop.name}`}
                    description={`${crop.location} • ${crop.status}`}
                    left={props => <List.Icon {...props} icon="sprout" />}
                  />
                  {index < Math.min(crops.length, 3) - 1 && <Divider />}
                </React.Fragment>
              ))}
              {crops.length > 3 && (
                <Paragraph style={styles.moreText}>
                  +{crops.length - 3} more crops
                </Paragraph>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Getting Started */}
        {animals.length === 0 && crops.length === 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Getting Started</Title>
              <Paragraph style={styles.paragraph}>
                Welcome to Ranch Hand! Here's how to get started:
              </Paragraph>
              <List.Item
                title="Add Your Livestock"
                description="Track chickens, goats, cows, and more"
                left={props => <List.Icon {...props} icon="barn" />}
              />
              <List.Item
                title="Plant Crops"
                description="Manage greenhouse and garden plants"
                left={props => <List.Icon {...props} icon="sprout" />}
              />
              <List.Item
                title="Create Tasks"
                description="Schedule feeding, watering, and maintenance"
                left={props => <List.Icon {...props} icon="checkbox-marked-circle" />}
              />
              <List.Item
                title="Track Finances"
                description="Log income and expenses"
                left={props => <List.Icon {...props} icon="currency-usd" />}
              />
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* AI Assistant FAB */}
      <FAB
        icon="robot"
        style={styles.fab}
        onPress={() => setShowAIAssistant(true)}
        label="AI Assistant"
      />

      <AIAssistantDialog
        visible={showAIAssistant}
        onDismiss={() => setShowAIAssistant(false)}
        onDataChanged={loadDashboardData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '40%',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  financialItem: {
    alignItems: 'center',
  },
  moreText: {
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  paragraph: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
