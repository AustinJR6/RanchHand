import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Portal,
  Dialog,
  IconButton,
  TextInput,
  Card,
  Text,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { openaiService, AgentTool, ToolCall } from '../services/openai';
import { livestockService } from '../services/livestock.service';
import { cropsService } from '../services/crops.service';
import { tasksService } from '../services/tasks.service';
import { notificationsService } from '../services/notifications.service';
import { settingsService } from '../services/settings.service';

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system';

interface DisplayMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  isAction?: boolean; // true for "I just did X" confirmations
}

interface ApiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

interface AIAssistantDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onDataChanged?: () => void; // called when AI adds/modifies farm data
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const FARM_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_farm_summary',
      description: 'Get the current state of the farm: all animals, crops, and pending tasks. Call this first to understand what the farmer already has.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_crop',
      description: 'Add a new crop or plant to the farm, generate an AI care plan, and automatically create scheduled tasks and reminders.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the crop (e.g. Tomatoes, Basil, Carrots)' },
          variety: { type: 'string', description: 'Variety or cultivar if known (optional)' },
          location: {
            type: 'string',
            enum: ['greenhouse', 'outdoor', 'raised-bed', 'other'],
            description: 'Where it is being grown',
          },
          planted_date: { type: 'string', description: 'Date planted YYYY-MM-DD, default today' },
          quantity: { type: 'number', description: 'Number of plants/seeds/rows (optional)' },
          quantity_unit: { type: 'string', description: 'Unit: plants, seeds, rows, etc. (optional)' },
          notes: { type: 'string', description: 'Any extra details: soil type, climate zone, conditions (optional)' },
        },
        required: ['name', 'location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_animal',
      description: 'Add new livestock or animals to the farm, generate an AI care plan, and create scheduled tasks and reminders.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['chicken', 'goat', 'cow', 'other'] },
          custom_type: { type: 'string', description: 'If type is other, specify the animal (e.g. duck, sheep, pig)' },
          breed: { type: 'string', description: 'Breed (optional)' },
          quantity: { type: 'number', description: 'Number of animals' },
          notes: { type: 'string', description: 'Any extra details (optional)' },
        },
        required: ['type', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a specific farm task or reminder manually.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'What needs to be done' },
          category: {
            type: 'string',
            enum: ['feeding', 'watering', 'cleaning', 'health', 'maintenance', 'harvesting', 'financial', 'other'],
          },
          due_date: { type: 'string', description: 'Due date YYYY-MM-DD (optional, defaults to today)' },
          is_recurring: { type: 'boolean', description: 'Whether this repeats' },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'biweekly', 'monthly'],
            description: 'How often if recurring',
          },
        },
        required: ['title', 'category'],
      },
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────

async function executeTool(
  call: ToolCall,
  onDataChanged?: () => void
): Promise<string> {
  const args = JSON.parse(call.function.arguments);

  switch (call.function.name) {
    case 'get_farm_summary': {
      const [animals, crops, tasks] = await Promise.all([
        livestockService.getActiveAnimals(),
        cropsService.getActiveCrops(),
        tasksService.getPendingTasks(),
      ]);
      return JSON.stringify({
        animals: animals.map(a => ({ type: a.type, name: a.name, breed: a.breed, quantity: a.quantity })),
        crops: crops.map(c => ({ name: c.name, variety: c.variety, location: c.location, status: c.status })),
        pendingTaskCount: tasks.length,
      });
    }

    case 'add_crop': {
      const today = new Date().toISOString().split('T')[0];
      const plantedDateStr = args.planted_date || today;
      const plantedDate = new Date(plantedDateStr);
      const userLocation = await settingsService.getLocation();

      const cropId = await cropsService.addCrop({
        name: args.name,
        variety: args.variety,
        location: args.location,
        plantedDate,
        status: 'planted',
        quantity: args.quantity,
        quantityUnit: args.quantity_unit,
        notes: args.notes,
      });

      const carePlan = await openaiService.generateCarePlan({
        type: 'crop',
        name: args.name,
        details: {
          variety: args.variety || 'Not specified',
          location: args.location,
          ...(args.notes ? { additionalInfo: args.notes } : {}),
        },
        location: userLocation || undefined,
        plantedDate: plantedDateStr,
      });

      await cropsService.updateCrop(cropId, { aiGeneratedPlan: carePlan });

      const taskIds = await tasksService.createTasksFromCarePlan(
        carePlan,
        { type: 'crop', id: cropId, name: args.variety ? `${args.variety} ${args.name}` : args.name },
        plantedDate
      );

      onDataChanged?.();
      return JSON.stringify({
        success: true,
        cropId,
        tasksCreated: taskIds.length,
        summary: carePlan.summary,
      });
    }

    case 'add_animal': {
      const animalType = args.type === 'other' ? 'other' : args.type;
      const animalName = args.type === 'other' ? args.custom_type : undefined;

      const animalId = await livestockService.addAnimal({
        type: animalType,
        name: animalName,
        breed: args.breed,
        quantity: args.quantity,
        dateAcquired: new Date(),
        status: 'active',
        notes: args.notes,
      });

      const displayName = args.custom_type || args.type;
      const userLocation = await settingsService.getLocation();
      const carePlan = await openaiService.generateCarePlan({
        type: 'animal',
        name: displayName,
        details: {
          breed: args.breed || 'Not specified',
          quantity: args.quantity,
          purpose: 'Small homestead',
          ...(args.notes ? { additionalInfo: args.notes } : {}),
        },
        location: userLocation || undefined,
      });

      await livestockService.updateAnimal(animalId, { aiGeneratedPlan: carePlan });

      const taskIds = await tasksService.createTasksFromCarePlan(
        carePlan,
        { type: 'animal', id: animalId, name: args.breed ? `${args.breed} ${displayName}` : displayName },
        new Date()
      );

      onDataChanged?.();
      return JSON.stringify({
        success: true,
        animalId,
        tasksCreated: taskIds.length,
        summary: carePlan.summary,
      });
    }

    case 'create_task': {
      const dueDate = args.due_date ? new Date(args.due_date) : new Date();
      const taskId = await tasksService.addTask({
        title: args.title,
        description: args.description,
        category: args.category,
        dueDate,
        isRecurring: args.is_recurring || false,
        frequency: args.frequency,
        status: 'pending',
      });

      await notificationsService.scheduleReminderBeforeDue(taskId, args.title, dueDate, 30);

      onDataChanged?.();
      return JSON.stringify({ success: true, taskId });
    }

    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}

// ─── Quick suggestion chips ───────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Add tomatoes to my raised bed',
  'Add 6 chickens to the farm',
  "What's due today?",
  'Set up a weekly watering reminder',
  'How do I know when to harvest garlic?',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAssistantDialog({ visible, onDismiss, onDataChanged }: AIAssistantDialogProps) {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your farm assistant. I can add plants or animals, set up care routines, create reminders, or just answer questions. What do you need?",
      timestamp: new Date(),
    },
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [displayMessages, visible]);

  const addDisplayMessage = (role: MessageRole, content: string, isAction = false) => {
    setDisplayMessages(prev => [...prev, { role, content, timestamp: new Date(), isAction }]);
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput('');
    setLoading(true);
    addDisplayMessage('user', messageText);

    const systemPrompt = `You are a smart, friendly farm assistant for a small homestead app called RanchHand.
You can add crops, add animals, create tasks, and answer farming questions.
When the user asks you to add something or set something up, use the appropriate tool — don't just describe what you would do.
After using a tool, give a brief, friendly confirmation of what you did.
Keep responses concise. Today is ${new Date().toLocaleDateString()}.`;

    const newApiMessages: ApiMessage[] = [
      ...apiMessages,
      { role: 'user', content: messageText },
    ];

    try {
      let currentMessages = newApiMessages;

      // Agentic loop: keep going until we get a final text response
      while (true) {
        const response = await openaiService.agentChat(
          [{ role: 'system', content: systemPrompt }, ...currentMessages],
          FARM_TOOLS
        );

        if (response.type === 'message') {
          addDisplayMessage('assistant', response.content);
          setApiMessages([...currentMessages, { role: 'assistant', content: response.content }]);
          break;
        }

        // Tool calls — execute each one
        const assistantMsg: ApiMessage = {
          role: 'assistant',
          content: '',
          tool_calls: response.raw_message.tool_calls,
        };
        currentMessages = [...currentMessages, assistantMsg];

        for (const call of response.tool_calls) {
          const label = getFriendlyActionLabel(call.function.name, JSON.parse(call.function.arguments));
          setActionStatus(label);

          const result = await executeTool(call, onDataChanged);

          currentMessages = [
            ...currentMessages,
            {
              role: 'tool',
              content: result,
              tool_call_id: call.id,
              name: call.function.name,
            },
          ];
        }
        setActionStatus('');
      }
    } catch (error) {
      console.error('Agent error:', error);
      addDisplayMessage('assistant', 'Sorry, something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setActionStatus('');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          <View style={styles.titleRow}>
            <Text variant="titleLarge">Farm Assistant</Text>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>
        </Dialog.Title>

        <Dialog.Content style={styles.content}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={100}
          >
            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {displayMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageWrapper,
                    msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper,
                  ]}
                >
                  <Card
                    style={[
                      styles.messageCard,
                      msg.role === 'user'
                        ? styles.userCard
                        : msg.isAction
                        ? styles.actionCard
                        : styles.assistantCard,
                    ]}
                  >
                    <Card.Content style={styles.messageContent}>
                      <Text
                        variant="bodyMedium"
                        style={msg.role === 'user' ? styles.userText : styles.assistantText}
                      >
                        {msg.content}
                      </Text>
                      <Text variant="labelSmall" style={styles.timestamp}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Card.Content>
                  </Card>
                </View>
              ))}

              {/* Loading / action status */}
              {loading && (
                <View style={[styles.messageWrapper, styles.assistantWrapper]}>
                  <Card style={[styles.messageCard, styles.assistantCard]}>
                    <Card.Content style={styles.loadingContent}>
                      <ActivityIndicator size="small" color="#4CAF50" />
                      <Text variant="bodyMedium" style={styles.loadingText}>
                        {actionStatus || 'Thinking...'}
                      </Text>
                    </Card.Content>
                  </Card>
                </View>
              )}
            </ScrollView>

            {/* Quick prompts — only show before first user message */}
            {displayMessages.length === 1 && (
              <View style={styles.quickPrompts}>
                <Text variant="labelSmall" style={styles.quickLabel}>Try:</Text>
                <View style={styles.chipsRow}>
                  {QUICK_PROMPTS.map((q, i) => (
                    <Chip key={i} onPress={() => handleSend(q)} style={styles.chip} compact>
                      {q}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Add a plant, ask a question..."
                mode="outlined"
                style={styles.input}
                multiline
                maxLength={500}
                disabled={loading}
              />
              <IconButton
                icon="send"
                size={24}
                onPress={() => handleSend()}
                disabled={!input.trim() || loading}
                style={styles.sendBtn}
              />
            </View>
          </KeyboardAvoidingView>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFriendlyActionLabel(toolName: string, args: any): string {
  switch (toolName) {
    case 'get_farm_summary': return 'Checking your farm...';
    case 'add_crop': return `Adding ${args.name} to your ${args.location}...`;
    case 'add_animal': return `Adding ${args.quantity} ${args.custom_type || args.type}(s)...`;
    case 'create_task': return `Creating task: ${args.title}...`;
    default: return 'Working on it...';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dialog: { maxHeight: '90%', height: 620 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: -16 },
  content: { padding: 0, flex: 1 },
  container: { flex: 1 },
  messagesContainer: { flex: 1, padding: 16 },
  messagesContent: { paddingBottom: 8 },
  messageWrapper: { marginBottom: 10 },
  userWrapper: { alignItems: 'flex-end' },
  assistantWrapper: { alignItems: 'flex-start' },
  messageCard: { maxWidth: '82%' },
  userCard: { backgroundColor: '#2E7D32' },
  assistantCard: { backgroundColor: '#f5f5f5' },
  actionCard: { backgroundColor: '#E8F5E9', borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  messageContent: { padding: 10 },
  userText: { color: '#fff' },
  assistantText: { color: '#212121' },
  timestamp: { marginTop: 4, opacity: 0.5, fontSize: 10 },
  loadingContent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  loadingText: { opacity: 0.7, color: '#444' },
  quickPrompts: { paddingHorizontal: 16, paddingBottom: 8 },
  quickLabel: { opacity: 0.6, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff' },
  input: { flex: 1, maxHeight: 100 },
  sendBtn: { marginLeft: 4 },
});
