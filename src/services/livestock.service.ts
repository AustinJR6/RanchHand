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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Animal, Chicken } from '../types';
import { stripUndefined } from '../utils/firestore';

const COLLECTION_NAME = 'livestock';

export class LivestockService {
  /**
   * Add a new animal to the database
   */
  async addAnimal(animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...stripUndefined(animal),
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding animal:', error);
      throw error;
    }
  }

  /**
   * Get all animals
   */
  async getAllAnimals(): Promise<Animal[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      );

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Animal[];
    } catch (error) {
      console.error('Error getting animals:', error);
      throw error;
    }
  }

  /**
   * Get animals by type
   */
  async getAnimalsByType(type: Animal['type']): Promise<Animal[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('type', '==', type),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Animal[];
    } catch (error) {
      console.error('Error getting animals by type:', error);
      throw error;
    }
  }

  /**
   * Get active animals only
   */
  async getActiveAnimals(): Promise<Animal[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Animal[];
    } catch (error) {
      console.error('Error getting active animals:', error);
      throw error;
    }
  }

  /**
   * Update an animal
   */
  async updateAnimal(id: string, updates: Partial<Animal>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating animal:', error);
      throw error;
    }
  }

  /**
   * Delete an animal (soft delete by changing status)
   */
  async deleteAnimal(id: string): Promise<void> {
    try {
      await this.updateAnimal(id, { status: 'sold' });
    } catch (error) {
      console.error('Error deleting animal:', error);
      throw error;
    }
  }

  /**
   * Hard delete an animal
   */
  async hardDeleteAnimal(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error hard deleting animal:', error);
      throw error;
    }
  }

  /**
   * Get total count of active animals
   */
  async getActiveAnimalCount(): Promise<number> {
    try {
      const animals = await this.getActiveAnimals();
      return animals.reduce((sum, animal) => sum + animal.quantity, 0);
    } catch (error) {
      console.error('Error getting animal count:', error);
      throw error;
    }
  }

  /**
   * Get total count by type
   */
  async getCountByType(type: Animal['type']): Promise<number> {
    try {
      const animals = await this.getAnimalsByType(type);
      return animals.reduce((sum, animal) => sum + animal.quantity, 0);
    } catch (error) {
      console.error('Error getting count by type:', error);
      throw error;
    }
  }
}

export const livestockService = new LivestockService();
export default livestockService;
