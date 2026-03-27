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
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProductionLog } from '../types';

class ProductionService {
  private collectionName = 'production';

  /**
   * Create a new production log entry
   */
  async createLog(
    logData: Omit<ProductionLog, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...logData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating production log:', error);
      throw error;
    }
  }

  /**
   * Get all production logs
   */
  async getAllLogs(): Promise<ProductionLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductionLog));
    } catch (error) {
      console.error('Error getting production logs:', error);
      throw error;
    }
  }

  /**
   * Get production logs by type
   */
  async getLogsByType(type: ProductionLog['type']): Promise<ProductionLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('type', '==', type),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductionLog));
    } catch (error) {
      console.error('Error getting production logs by type:', error);
      throw error;
    }
  }

  /**
   * Get production logs for a specific animal or crop
   */
  async getLogsForEntity(entityType: 'animal' | 'crop', entityId: string): Promise<ProductionLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('relatedTo.type', '==', entityType),
        where('relatedTo.id', '==', entityId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductionLog));
    } catch (error) {
      console.error('Error getting production logs for entity:', error);
      throw error;
    }
  }

  /**
   * Get production logs within a date range
   */
  async getLogsByDateRange(startDate: Timestamp, endDate: Timestamp): Promise<ProductionLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductionLog));
    } catch (error) {
      console.error('Error getting production logs by date range:', error);
      throw error;
    }
  }

  /**
   * Update a production log
   */
  async updateLog(
    logId: string,
    updates: Partial<Omit<ProductionLog, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, logId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating production log:', error);
      throw error;
    }
  }

  /**
   * Delete a production log
   */
  async deleteLog(logId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, logId));
    } catch (error) {
      console.error('Error deleting production log:', error);
      throw error;
    }
  }

  /**
   * Log egg collection
   */
  async logEggCollection(
    animalId: string,
    animalName: string,
    quantity: number,
    quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good',
    notes?: string
  ): Promise<string> {
    return this.createLog({
      type: 'egg-collection',
      relatedTo: { type: 'animal', id: animalId, name: animalName },
      quantity,
      unit: 'eggs',
      date: Timestamp.now(),
      notes,
      quality
    });
  }

  /**
   * Log harvest
   */
  async logHarvest(
    cropId: string,
    cropName: string,
    quantity: number,
    unit: string,
    quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good',
    notes?: string
  ): Promise<string> {
    return this.createLog({
      type: 'harvest',
      relatedTo: { type: 'crop', id: cropId, name: cropName },
      quantity,
      unit,
      date: Timestamp.now(),
      notes,
      quality
    });
  }

  /**
   * Get production statistics for a specific animal or crop
   */
  async getProductionStats(entityType: 'animal' | 'crop', entityId: string) {
    try {
      const logs = await this.getLogsForEntity(entityType, entityId);

      const totalQuantity = logs.reduce((sum, log) => sum + log.quantity, 0);
      const averageQuantity = logs.length > 0 ? totalQuantity / logs.length : 0;

      const qualityCounts = logs.reduce((acc, log) => {
        if (log.quality) {
          acc[log.quality] = (acc[log.quality] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        totalLogs: logs.length,
        totalQuantity,
        averageQuantity,
        qualityCounts,
        lastLogDate: logs.length > 0 ? logs[0].date : null
      };
    } catch (error) {
      console.error('Error getting production stats:', error);
      throw error;
    }
  }

  /**
   * Get overall production summary for a date range
   */
  async getProductionSummary(startDate: Timestamp, endDate: Timestamp) {
    try {
      const logs = await this.getLogsByDateRange(startDate, endDate);

      const byType = logs.reduce((acc, log) => {
        if (!acc[log.type]) {
          acc[log.type] = { count: 0, totalQuantity: 0 };
        }
        acc[log.type].count++;
        acc[log.type].totalQuantity += log.quantity;
        return acc;
      }, {} as Record<string, { count: number; totalQuantity: number }>);

      return {
        totalLogs: logs.length,
        byType,
        dateRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error getting production summary:', error);
      throw error;
    }
  }
}

export const productionService = new ProductionService();
export default productionService;
