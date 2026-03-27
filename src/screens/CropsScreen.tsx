import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { FAB, Card, Title, Paragraph, List, Chip, IconButton } from 'react-native-paper';
import AddCropWizard from '../components/AddCropWizard';
import LogProductionDialog from '../components/LogProductionDialog';
import { cropsService } from '../services/crops.service';
import { Crop } from '../types';

export default function CropsScreen() {
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);

  const loadCrops = async () => {
    try {
      const data = await cropsService.getActiveCrops();
      setCrops(data);
    } catch (error) {
      console.error('Error loading crops:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCrops();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const getStatusColor = (status: Crop['status']) => {
    switch (status) {
      case 'planted':
        return '#4CAF50';
      case 'growing':
        return '#8BC34A';
      case 'harvesting':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {crops.length === 0 ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Your Crops</Title>
                <Paragraph>No crops added yet. Tap the + button to add your first crop!</Paragraph>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Title>Greenhouse & Garden</Title>
                <Paragraph>
                  Track your greenhouse plants, raised beds, and outdoor crops. Our AI will help you create
                  growing schedules and care plans.
                </Paragraph>
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Your Crops ({crops.length})</Title>
                {crops.map(crop => (
                  <List.Item
                    key={crop.id}
                    title={`${crop.variety ? crop.variety + ' ' : ''}${crop.name}`}
                    description={`${crop.location} • Planted: ${new Date(
                      crop.plantedDate
                    ).toLocaleDateString()}`}
                    left={props => <List.Icon {...props} icon="sprout" />}
                    right={() => (
                      <View style={styles.rightContent}>
                        {(crop.status === 'harvesting' || crop.status === 'growing') && (
                          <IconButton
                            icon="basket"
                            size={20}
                            onPress={() => {
                              setSelectedCrop(crop);
                              setShowLogDialog(true);
                            }}
                          />
                        )}
                        <Chip
                          mode="outlined"
                          style={{ backgroundColor: getStatusColor(crop.status) }}
                          textStyle={{ color: 'white' }}
                        >
                          {crop.status}
                        </Chip>
                      </View>
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setShowAddWizard(true)} label="Add Crop" />

      <AddCropWizard
        visible={showAddWizard}
        onDismiss={() => setShowAddWizard(false)}
        onSuccess={loadCrops}
      />

      {selectedCrop && (
        <LogProductionDialog
          visible={showLogDialog}
          onDismiss={() => {
            setShowLogDialog(false);
            setSelectedCrop(null);
          }}
          entityType="crop"
          entityId={selectedCrop.id}
          entityName={`${selectedCrop.variety ? selectedCrop.variety + ' ' : ''}${selectedCrop.name}`}
          productionType="harvest"
          onSuccess={loadCrops}
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
});
