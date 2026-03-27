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
import { Crop } from '../types';
import { stripUndefined } from '../utils/firestore';

const COLLECTION_NAME = 'crops';

export class CropsService {
  /**
   * Add a new crop to the database
   */
  async addCrop(crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...stripUndefined(crop),
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding crop:', error);
      throw error;
    }
  }

  /**
   * Get all crops
   */
  async getAllCrops(): Promise<Crop[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTION_NAME), orderBy('plantedDate', 'desc'))
      );

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Crop[];
    } catch (error) {
      console.error('Error getting crops:', error);
      throw error;
    }
  }

  /**
   * Get active crops (planted, growing, harvesting)
   */
  async getActiveCrops(): Promise<Crop[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', 'in', ['planted', 'growing', 'harvesting']),
        orderBy('plantedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Crop[];
    } catch (error) {
      console.error('Error getting active crops:', error);
      throw error;
    }
  }

  /**
   * Get crops by location
   */
  async getCropsByLocation(location: Crop['location']): Promise<Crop[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('location', '==', location),
        orderBy('plantedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Crop[];
    } catch (error) {
      console.error('Error getting crops by location:', error);
      throw error;
    }
  }

  /**
   * Get crops by status
   */
  async getCropsByStatus(status: Crop['status']): Promise<Crop[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('plantedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Crop[];
    } catch (error) {
      console.error('Error getting crops by status:', error);
      throw error;
    }
  }

  /**
   * Update a crop
   */
  async updateCrop(id: string, updates: Partial<Crop>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating crop:', error);
      throw error;
    }
  }

  /**
   * Delete a crop
   */
  async deleteCrop(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting crop:', error);
      throw error;
    }
  }

  /**
   * Get total count of active crops
   */
  async getActiveCropCount(): Promise<number> {
    try {
      const crops = await this.getActiveCrops();
      return crops.length;
    } catch (error) {
      console.error('Error getting active crop count:', error);
      throw error;
    }
  }

  /**
   * Get crops ready for harvest (status = 'harvesting')
   */
  async getCropsReadyForHarvest(): Promise<Crop[]> {
    try {
      return await this.getCropsByStatus('harvesting');
    } catch (error) {
      console.error('Error getting crops ready for harvest:', error);
      throw error;
    }
  }
}

export const cropsService = new CropsService();
export default cropsService;
