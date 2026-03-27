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
  Chip,
  List,
} from 'react-native-paper';
import { Animal, CarePlan } from '../types';
import { geminiService } from '../services/openai';
import { livestockService } from '../services/livestock.service';
import { tasksService } from '../services/tasks.service';
import { settingsService } from '../services/settings.service';

interface AddAnimalWizardProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

type Step = 'type' | 'details' | 'ai-generating' | 'review-plan' | 'complete';

export default function AddAnimalWizard({ visible, onDismiss, onSuccess }: AddAnimalWizardProps) {
  const [step, setStep] = useState<Step>('type');
  const [animalType, setAnimalType] = useState<Animal['type']>('chicken');
  const [customType, setCustomType] = useState('');
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetWizard = () => {
    setStep('type');
    setAnimalType('chicken');
    setCustomType('');
    setBreed('');
    setQuantity('1');
    setDateAcquired(new Date().toISOString().split('T')[0]);
    setCost('');
    setNotes('');
    setCarePlan(null);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onDismiss();
  };

  const handleTypeNext = () => {
    if (animalType === 'other' && !customType.trim()) {
      setError('Please specify the animal type');
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
      const animalName = animalType === 'other' ? customType : animalType;
      const details: Record<string, any> = {
        breed: breed || 'Not specified',
        quantity: quantity,
        purpose: 'Small family farm',
      };

      if (notes) {
        details.additionalInfo = notes;
      }

      const location = await settingsService.getLocation();
      const plan = await geminiService.generateCarePlan({
        type: 'animal',
        name: animalName,
        details,
        location: location || undefined,
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

  const handleSaveAnimal = async () => {
    setLoading(true);
    setError(null);

    try {
      const finalType = animalType === 'other' ? 'other' : animalType;
      const finalName = animalType === 'other' ? customType : undefined;

      const animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'> = {
        type: finalType,
        name: finalName,
        breed: breed || undefined,
        quantity: parseInt(quantity),
        dateAcquired: new Date(dateAcquired),
        status: 'active',
        notes: notes || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        aiGeneratedPlan: carePlan || undefined,
      };

      const animalId = await livestockService.addAnimal(animal);

      // Create tasks from the care plan
      if (carePlan && carePlan.tasks.length > 0) {
        await tasksService.createTasksFromCarePlan(carePlan, {
          type: 'animal',
          id: animalId,
          name: finalName || `${breed || ''} ${finalType}`.trim(),
        });
      }

      setStep('complete');
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to save animal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSelection = () => (
    <View>
      <Title>What type of animal are you adding?</Title>
      <RadioButton.Group onValueChange={value => setAnimalType(value as Animal['type'])} value={animalType}>
        <RadioButton.Item label="Chickens" value="chicken" />
        <RadioButton.Item label="Goats" value="goat" />
        <RadioButton.Item label="Cows" value="cow" />
        <RadioButton.Item label="Other" value="other" />
      </RadioButton.Group>

      {animalType === 'other' && (
        <TextInput
          label="Specify animal type"
          value={customType}
          onChangeText={setCustomType}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Pigs, Sheep, Ducks"
        />
      )}

      {error && <Paragraph style={styles.error}>{error}</Paragraph>}

      <Button mode="contained" onPress={handleTypeNext} style={styles.button}>
        Next
      </Button>
    </View>
  );

  const renderDetailsForm = () => (
    <ScrollView>
      <Title>Tell us about your {animalType === 'other' ? customType : animalType}s</Title>
      <Paragraph style={styles.subtitle}>
        Our AI will use this information to create a custom care plan for you.
      </Paragraph>

      <TextInput
        label="Breed (optional)"
        value={breed}
        onChangeText={setBreed}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Rhode Island Red, Nigerian Dwarf"
      />

      <TextInput
        label="How many?"
        value={quantity}
        onChangeText={setQuantity}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Date acquired"
        value={dateAcquired}
        onChangeText={setDateAcquired}
        mode="outlined"
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />

      <TextInput
        label="Total cost (optional)"
        value={cost}
        onChangeText={setCost}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g., 150.00"
      />

      <TextInput
        label="Additional notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Age, special needs, intended purpose, etc."
      />

      {error && <Paragraph style={styles.error}>{error}</Paragraph>}

      <Button mode="contained" onPress={handleGenerateCarePlan} style={styles.button}>
        Generate AI Care Plan
      </Button>
      <Button mode="text" onPress={() => setStep('type')} style={styles.button}>
        Back
      </Button>
    </ScrollView>
  );

  const renderAIGenerating = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Title style={styles.loadingText}>Generating Custom Care Plan...</Title>
      <Paragraph style={styles.loadingSubtext}>
        Our AI is analyzing best practices for your {animalType === 'other' ? customType : animalType}s
      </Paragraph>
    </View>
  );

  const renderCarePlanReview = () => (
    <ScrollView>
      <Title>Your Custom Care Plan</Title>
      <Paragraph style={styles.subtitle}>{carePlan?.summary}</Paragraph>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Automated Tasks ({carePlan?.tasks.length || 0})</Title>
          {carePlan?.tasks.map((task, index) => (
            <List.Item
              key={index}
              title={task.title}
              description={`${task.frequency} - ${task.description}`}
              left={props => <List.Icon {...props} icon="clipboard-check" />}
            />
          ))}
        </Card.Content>
      </Card>

      {carePlan?.tips && carePlan.tips.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Tips for Success</Title>
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
        onPress={handleSaveAnimal}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Save Animal & Create Tasks
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
        Your {animalType === 'other' ? customType : animalType}s have been added and tasks created.
      </Paragraph>
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <Dialog.ScrollArea>
          <View style={styles.content}>
            {step === 'type' && renderTypeSelection()}
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
});
