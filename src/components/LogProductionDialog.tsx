import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  SegmentedButtons,
  Text,
  HelperText
} from 'react-native-paper';
import { Timestamp } from 'firebase/firestore';
import { productionService } from '../services/production.service';

interface LogProductionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  entityType: 'animal' | 'crop';
  entityId: string;
  entityName: string;
  productionType: 'egg-collection' | 'harvest' | 'milk' | 'other';
  onSuccess?: () => void;
}

export default function LogProductionDialog({
  visible,
  onDismiss,
  entityType,
  entityId,
  entityName,
  productionType,
  onSuccess
}: LogProductionDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('eggs');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getDefaultUnit = () => {
    switch (productionType) {
      case 'egg-collection':
        return 'eggs';
      case 'harvest':
        return 'lbs';
      case 'milk':
        return 'gallons';
      default:
        return 'units';
    }
  };

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) return;

    try {
      setSubmitting(true);

      await productionService.createLog({
        type: productionType,
        relatedTo: { type: entityType, id: entityId, name: entityName },
        quantity: parseFloat(quantity),
        unit: unit || getDefaultUnit(),
        date: Timestamp.now(),
        notes: notes.trim() || undefined,
        quality
      });

      setQuantity('');
      setUnit(getDefaultUnit());
      setQuality('good');
      setNotes('');

      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error logging production:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (productionType) {
      case 'egg-collection':
        return 'Log Egg Collection';
      case 'harvest':
        return 'Log Harvest';
      case 'milk':
        return 'Log Milk Production';
      default:
        return 'Log Production';
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{getTitle()}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {entityName}
          </Text>

          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            error={quantity !== '' && parseFloat(quantity) <= 0}
          />
          <HelperText type="error" visible={quantity !== '' && parseFloat(quantity) <= 0}>
            Quantity must be greater than 0
          </HelperText>

          <TextInput
            label="Unit"
            value={unit}
            onChangeText={setUnit}
            mode="outlined"
            style={styles.input}
            placeholder={getDefaultUnit()}
          />

          <Text variant="labelLarge" style={styles.label}>Quality</Text>
          <SegmentedButtons
            value={quality}
            onValueChange={(value) => setQuality(value as typeof quality)}
            buttons={[
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' }
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={submitting}>Cancel</Button>
          <Button
            onPress={handleSubmit}
            disabled={!quantity || parseFloat(quantity) <= 0 || submitting}
            loading={submitting}
          >
            Log
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: 16,
    opacity: 0.7
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
});
