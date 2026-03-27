import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Portal,
  Dialog,
  TextInput,
  SegmentedButtons,
  List,
  Chip,
  Divider,
  IconButton,
  Text
} from 'react-native-paper';
import { Timestamp } from 'firebase/firestore';
import { financialService } from '../services/financial.service';
import { productionService } from '../services/production.service';
import { FinancialRecord, ProductionLog } from '../types';

type TabType = 'financial' | 'production';

export default function RecordsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('financial');
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Financial form state
  const [newRecord, setNewRecord] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'feed' as FinancialRecord['category'],
    amount: '',
    description: '',
    date: new Date()
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [financial, production] = await Promise.all([
        financialService.getAllRecords(),
        productionService.getAllLogs()
      ]);
      setFinancialRecords(financial);
      setProductionLogs(production);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinancialRecord = async () => {
    if (!newRecord.amount || parseFloat(newRecord.amount) <= 0) return;

    try {
      await financialService.createRecord({
        type: newRecord.type,
        category: newRecord.category,
        amount: parseFloat(newRecord.amount),
        description: newRecord.description,
        date: Timestamp.fromDate(newRecord.date)
      });

      setShowAddDialog(false);
      setNewRecord({
        type: 'expense',
        category: 'feed',
        amount: '',
        description: '',
        date: new Date()
      });

      await loadData();
    } catch (error) {
      console.error('Error adding financial record:', error);
    }
  };

  const handleDeleteFinancialRecord = async (id: string) => {
    try {
      await financialService.deleteRecord(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting financial record:', error);
    }
  };

  const getCategoryIcon = (category: FinancialRecord['category']) => {
    const icons = {
      feed: 'food-apple',
      supplies: 'package-variant',
      equipment: 'hammer-wrench',
      veterinary: 'medical-bag',
      sales: 'currency-usd',
      other: 'dots-horizontal'
    };
    return icons[category];
  };

  const getProductionTypeIcon = (type: ProductionLog['type']) => {
    const icons = {
      'egg-collection': 'egg',
      'harvest': 'basket',
      'milk': 'cup',
      'other': 'dots-horizontal'
    };
    return icons[type];
  };

  const calculateTotals = () => {
    const income = financialRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);

    const expenses = financialRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    return { income, expenses, profit: income - expenses };
  };

  const totals = calculateTotals();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Financial Summary Card */}
        {activeTab === 'financial' && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Financial Summary</Title>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text variant="labelLarge">Income</Text>
                  <Text variant="headlineSmall" style={{ color: '#4CAF50' }}>
                    ${totals.income.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="labelLarge">Expenses</Text>
                  <Text variant="headlineSmall" style={{ color: '#F44336' }}>
                    ${totals.expenses.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="labelLarge">Profit</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: totals.profit >= 0 ? '#4CAF50' : '#F44336' }}
                  >
                    ${totals.profit.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Tab Selector */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          buttons={[
            { value: 'financial', label: 'Financial', icon: 'currency-usd' },
            { value: 'production', label: 'Production', icon: 'basket' }
          ]}
          style={styles.tabs}
        />

        {/* Content */}
        {loading ? (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph>Loading records...</Paragraph>
            </Card.Content>
          </Card>
        ) : activeTab === 'financial' ? (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Transactions ({financialRecords.length})</Title>
              {financialRecords.length === 0 ? (
                <Paragraph>No financial records yet. Add one to get started!</Paragraph>
              ) : (
                financialRecords.map((record, index) => (
                  <React.Fragment key={record.id}>
                    <List.Item
                      title={record.description}
                      description={`${record.date.toDate().toLocaleDateString()} • ${record.category}`}
                      left={() => (
                        <Chip
                          icon={getCategoryIcon(record.category)}
                          style={{
                            backgroundColor: record.type === 'income' ? '#4CAF50' : '#F44336'
                          }}
                          textStyle={{ color: 'white' }}
                        >
                          {record.type}
                        </Chip>
                      )}
                      right={() => (
                        <View style={styles.rightContent}>
                          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                            {record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
                          </Text>
                          <IconButton
                            icon="delete"
                            size={20}
                            onPress={() => handleDeleteFinancialRecord(record.id)}
                          />
                        </View>
                      )}
                    />
                    {index < financialRecords.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Production Logs ({productionLogs.length})</Title>
              {productionLogs.length === 0 ? (
                <Paragraph>
                  No production logs yet. Log eggs or harvests from the Livestock or Crops screens!
                </Paragraph>
              ) : (
                productionLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    <List.Item
                      title={log.relatedTo.name}
                      description={`${log.date.toDate().toLocaleDateString()} • ${log.type}${log.quality ? ` • ${log.quality}` : ''}`}
                      left={() => (
                        <List.Icon icon={getProductionTypeIcon(log.type)} />
                      )}
                      right={() => (
                        <Chip compact>
                          {log.quantity} {log.unit}
                        </Chip>
                      )}
                    />
                    {index < productionLogs.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add FAB - only for financial tab */}
      {activeTab === 'financial' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowAddDialog(true)}
          label="Add Transaction"
        />
      )}

      {/* Add Financial Record Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add Financial Record</Dialog.Title>
          <Dialog.Content>
            <Text variant="labelLarge" style={styles.label}>Type</Text>
            <SegmentedButtons
              value={newRecord.type}
              onValueChange={(value) => setNewRecord({ ...newRecord, type: value as any })}
              buttons={[
                { value: 'income', label: 'Income', icon: 'plus' },
                { value: 'expense', label: 'Expense', icon: 'minus' }
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Amount"
              value={newRecord.amount}
              onChangeText={(text) => setNewRecord({ ...newRecord, amount: text })}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="currency-usd" />}
            />

            <TextInput
              label="Description"
              value={newRecord.description}
              onChangeText={(text) => setNewRecord({ ...newRecord, description: text })}
              mode="outlined"
              style={styles.input}
            />

            <Text variant="labelLarge" style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {(['feed', 'supplies', 'equipment', 'veterinary', 'sales', 'other'] as FinancialRecord['category'][]).map((cat) => (
                <Chip
                  key={cat}
                  selected={newRecord.category === cat}
                  onPress={() => setNewRecord({ ...newRecord, category: cat })}
                  style={styles.categoryChip}
                  icon={getCategoryIcon(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onPress={handleAddFinancialRecord}
              disabled={!newRecord.amount || parseFloat(newRecord.amount) <= 0}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  tabs: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  segmentedButtons: {
    marginBottom: 16,
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
});
