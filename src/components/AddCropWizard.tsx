import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Dialog,
  Portal,
  Button,
  TextInput,
  Title,
  Paragraph,
  RadioButton,
  ActivityIndicator,
  Card,
  List,
} from 'react-native-paper';
import { Crop, CarePlan } from '../types';
import { geminiService } from '../services/openai';
import { cropsService } from '../services/crops.service';
import { tasksService } from '../services/tasks.service';

interface AddCropWizardProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

type Step = 'basic-info' | 'details' | 'ai-generating' | 'review-plan' | 'complete';

export default function AddCropWizard({ visible, onDismiss, onSuccess }: AddCropWizardProps) {
  const [step, setStep] = useState<Step>('basic-info');
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [location, setLocation] = useState<Crop['location']>('greenhouse');
  const [plantedDate, setPlantedDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetWizard = () => {
    setStep('basic-info');
    setCropName('');
    setVariety('');
    setLocation('greenhouse');
    setPlantedDate(new Date().toISOString().split('T')[0]);
    setQuantity('');
    setQuantityUnit('');
    setNotes('');
    setCarePlan(null);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onDismiss();
  };

  const handleBasicInfoNext = () => {
    if (!cropName.trim()) {
      setError('Please enter a crop name');
      return;
    }
    setError(null);
    setStep('details');
  };

  const handleGenerateCarePlan = async () => {
    setStep('ai-generating');
    setLoading(true);
    setError(null);

    try {
      const details: Record<string, any> = {
        variety: variety || 'Not specified',
        location: location,
        plantedDate: plantedDate,
        farmType: 'Small family farm',
      };

      if (quantity && quantityUnit) {
        details.quantity = `${quantity} ${quantityUnit}`;
      }

      if (notes) {
        details.additionalInfo = notes;
      }

      const plan = await geminiService.generateCarePlan({
        type: 'crop',
        name: cropName,
        details,
      });

      setCarePlan(plan);
      setStep('review-plan');
    } catch (err) {
      setError('Failed to generate care plan. Please try again.');
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCrop = async () => {
    setLoading(true);
    setError(null);

    try {
      const crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'> = {
        name: cropName,
        variety: variety || undefined,
        location,
        plantedDate: new Date(plantedDate),
        status: 'planted',
        quantity: quantity ? parseInt(quantity) : undefined,
        quantityUnit: quantityUnit || undefined,
        notes: notes || undefined,
        aiGeneratedPlan: carePlan || undefined,
      };

      const cropId = await cropsService.addCrop(crop);

      // Create tasks from the care plan
      if (carePlan && carePlan.tasks.length > 0) {
        await tasksService.createTasksFromCarePlan(carePlan, {
          type: 'crop',
          id: cropId,
          name: `${variety ? variety + ' ' : ''}${cropName}`,
        });
      }

      setStep('complete');
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to save crop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View>
      <Title>What are you planting?</Title>

      <TextInput
        label="Crop name *"
        value={cropName}
        onChangeText={setCropName}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Tomatoes, Lettuce, Carrots"
      />

      <TextInput
        label="Variety (optional)"
        value={variety}
        onChangeText={setVariety}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Cherokee Purple, Buttercrunch"
      />

      <Title style={styles.sectionTitle}>Where are you growing?</Title>
      <RadioButton.Group onValueChange={value => setLocation(value as Crop['location'])} value={location}>
        <RadioButton.Item label="Greenhouse" value="greenhouse" />
        <RadioButton.Item label="Outdoor Garden" value="outdoor" />
        <RadioButton.Item label="Raised Bed" value="raised-bed" />
        <RadioButton.Item label="Other" value="other" />
      </RadioButton.Group>

      {error && <Paragraph style={styles.error}>{error}</Paragraph>}

      <Button mode="contained" onPress={handleBasicInfoNext} style={styles.button}>
        Next
      </Button>
    </View>
  );

  const renderDetailsForm = () => (
    <ScrollView>
      <Title>Tell us more about your {cropName}</Title>
      <Paragraph style={styles.subtitle}>
        Our AI will use this information to create a custom growing plan for you.
      </Paragraph>

      <TextInput
        label="Planting date"
        value={plantedDate}
        onChangeText={setPlantedDate}
        mode="outlined"
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />

      <View style={styles.row}>
        <TextInput
          label="Quantity (optional)"
          value={quantity}
          onChangeText={setQuantity}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.halfWidth]}
          placeholder="10"
        />
        <TextInput
          label="Unit"
          value={quantityUnit}
          onChangeText={setQuantityUnit}
          mode="outlined"
          style={[styles.input, styles.halfWidth]}
          placeholder="plants, seeds, rows"
        />
      </View>

      <TextInput
        label="Additional notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Growing conditions, soil type, climate zone, etc."
      />

      {error && <Paragraph style={styles.error}>{error}</Paragraph>}

      <Button mode="contained" onPress={handleGenerateCarePlan} style={styles.button}>
        Generate AI Growing Plan
      </Button>
      <Button mode="text" onPress={() => setStep('basic-info')} style={styles.button}>
        Back
      </Button>
    </ScrollView>
  );

  const renderAIGenerating = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Title style={styles.loadingText}>Generating Custom Growing Plan...</Title>
      <Paragraph style={styles.loadingSubtext}>
        Our AI is analyzing best practices for growing {cropName}
      </Paragraph>
    </View>
  );

  const renderCarePlanReview = () => (
    <ScrollView>
      <Title>Your Custom Growing Plan</Title>
      <Paragraph style={styles.subtitle}>{carePlan?.summary}</Paragraph>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Automated Tasks ({carePlan?.tasks.length || 0})</Title>
          {carePlan?.tasks.map((task, index) => (
            <List.Item
              key={index}
              title={task.title}
              description={`${task.frequency} - ${task.description}`}
              left={props => <List.Icon {...props} icon="sprout" />}
            />
          ))}
        </Card.Content>
      </Card>

      {carePlan?.tips && carePlan.tips.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Growing Tips</Title>
            {carePlan.tips.map((tip, index) => (
              <Paragraph key={index} style={styles.tip}>
                • {tip}
              </Paragraph>
            ))}
          </Card.Content>
        </Card>
      )}

      {carePlan?.warnings && carePlan.warnings.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Important Warnings</Title>
            {carePlan.warnings.map((warning, index) => (
              <Paragraph key={index} style={styles.warning}>
                ⚠️ {warning}
              </Paragraph>
            ))}
          </Card.Content>
        </Card>
      )}

      {error && <Paragraph style={styles.error}>{error}</Paragraph>}

      <Button
        mode="contained"
        onPress={handleSaveCrop}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Save Crop & Create Tasks
      </Button>
      <Button mode="text" onPress={() => setStep('details')} style={styles.button} disabled={loading}>
        Edit Details
      </Button>
    </ScrollView>
  );

  const renderComplete = () => (
    <View style={styles.loadingContainer}>
      <List.Icon icon="check-circle" color="green" />
      <Title style={styles.loadingText}>Success!</Title>
      <Paragraph style={styles.loadingSubtext}>
        Your {cropName} has been added and growing tasks created.
      </Paragraph>
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <Dialog.ScrollArea>
          <View style={styles.content}>
            {step === 'basic-info' && renderBasicInfo()}
            {step === 'details' && renderDetailsForm()}
            {step === 'ai-generating' && renderAIGenerating()}
            {step === 'review-plan' && renderCarePlanReview()}
            {step === 'complete' && renderComplete()}
          </View>
        </Dialog.ScrollArea>
        {step !== 'ai-generating' && step !== 'complete' && (
          <Dialog.Actions>
            <Button onPress={handleClose}>Cancel</Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  subtitle: {
    marginBottom: 16,
    color: '#666',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  card: {
    marginTop: 16,
  },
  tip: {
    marginTop: 8,
  },
  warning: {
    marginTop: 8,
    color: '#ff6b00',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
});
