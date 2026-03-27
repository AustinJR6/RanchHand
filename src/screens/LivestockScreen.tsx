import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { FAB, Card, Title, Paragraph, List, IconButton, Chip } from 'react-native-paper';
import AddAnimalWizard from '../components/AddAnimalWizard';
import LogProductionDialog from '../components/LogProductionDialog';
import { livestockService } from '../services/livestock.service';
import { Animal } from '../types';

export default function LivestockScreen() {
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);

  const loadAnimals = async () => {
    try {
      const data = await livestockService.getActiveAnimals();
      setAnimals(data);
    } catch (error) {
      console.error('Error loading animals:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {animals.length === 0 ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Your Livestock</Title>
                <Paragraph>No animals added yet. Tap the + button to add your first animal!</Paragraph>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Title>Getting Started</Title>
                <Paragraph>
                  Add your chickens, goats, or other livestock. Our AI assistant will help create a custom
                  care plan for each type of animal.
                </Paragraph>
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Your Livestock ({animals.length})</Title>
                {animals.map(animal => (
                  <List.Item
                    key={animal.id}
                    title={`${animal.breed || ''} ${animal.type}`.trim()}
                    description={`Quantity: ${animal.quantity} • Added: ${new Date(
                      animal.dateAcquired
                    ).toLocaleDateString()}`}
                    left={props => <List.Icon {...props} icon="barn" />}
                    right={() => (
                      animal.type === 'chicken' ? (
                        <View style={styles.actionButtons}>
                          <Chip
                            icon="egg"
                            onPress={() => {
                              setSelectedAnimal(animal);
                              setShowLogDialog(true);
                            }}
                            compact
                          >
                            Log Eggs
                          </Chip>
                        </View>
                      ) : null
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setShowAddWizard(true)} label="Add Animal" />

      <AddAnimalWizard
        visible={showAddWizard}
        onDismiss={() => setShowAddWizard(false)}
        onSuccess={loadAnimals}
      />

      {selectedAnimal && (
        <LogProductionDialog
          visible={showLogDialog}
          onDismiss={() => {
            setShowLogDialog(false);
            setSelectedAnimal(null);
          }}
          entityType="animal"
          entityId={selectedAnimal.id}
          entityName={`${selectedAnimal.breed || ''} ${selectedAnimal.type}`.trim()}
          productionType="egg-collection"
          onSuccess={loadAnimals}
        />
      )}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
