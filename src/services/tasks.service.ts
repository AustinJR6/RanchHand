import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task } from '../types';
import { notificationsService } from './notifications.service';
import { stripUndefined } from '../utils/firestore';

const COLLECTION_NAME = 'tasks';

export class TasksService {
  /**
   * Add a new task
   */
  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...stripUndefined(task),
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      );

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  /**
   * Get today's tasks
   */
  async getTodaysTasks(): Promise<Task[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending'),
        where('dueDate', '>=', today),
        where('dueDate', '<', tomorrow)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting today\'s tasks:', error);
      throw error;
    }
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending'),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting pending tasks:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    try {
      const now = new Date();

      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'overdue'),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      throw error;
    }
  }

  /**
   * Get tasks by category
   */
  async getTasksByCategory(category: Task['category']): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('category', '==', category),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks by category:', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Complete a task and cancel its notification
   */
  async completeTask(id: string): Promise<void> {
    try {
      await this.updateTask(id, {
        status: 'completed',
        completedAt: new Date(),
      });
      await notificationsService.cancelTaskReminder(id);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Delete a task and cancel its notification
   */
  async deleteTask(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      await notificationsService.cancelTaskReminder(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Create tasks from AI-generated care plan
   */
  async createTasksFromCarePlan(
    carePlan: any,
    relatedTo: { type: 'animal' | 'crop'; id: string; name: string }
  ): Promise<string[]> {
    try {
      const taskIds: string[] = [];

      for (const aiTask of carePlan.tasks) {
        const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
          title: aiTask.title,
          description: aiTask.description,
          category: aiTask.category,
          relatedTo,
          isRecurring: aiTask.frequency !== 'once',
          frequency: aiTask.frequency !== 'once' ? aiTask.frequency : undefined,
          status: 'pending',
          dueDate: this.calculateDueDate(aiTask.frequency),
        };

        const id = await this.addTask(task);
        taskIds.push(id);

        // Auto-schedule a notification for this task
        notificationsService.autoScheduleForTask({
          id,
          title: aiTask.title,
          category: aiTask.category,
          frequency: aiTask.frequency,
          dueDate: task.dueDate as Date,
        }).catch(() => {}); // non-blocking, don't fail task creation if notification fails
      }

      return taskIds;
    } catch (error) {
      console.error('Error creating tasks from care plan:', error);
      throw error;
    }
  }

  /**
   * Calculate due date based on frequency
   */
  private calculateDueDate(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        return now;
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'biweekly':
        return new Date(now.setDate(now.getDate() + 14));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return now;
    }
  }
}

export const tasksService = new TasksService();
export default tasksService;
