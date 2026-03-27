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
import { FinancialRecord } from '../types';

class FinancialService {
  private collectionName = 'financial';

  /**
   * Create a new financial record
   */
  async createRecord(
    recordData: Omit<FinancialRecord, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...recordData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating financial record:', error);
      throw error;
    }
  }

  /**
   * Get all financial records
   */
  async getAllRecords(): Promise<FinancialRecord[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FinancialRecord));
    } catch (error) {
      console.error('Error getting financial records:', error);
      throw error;
    }
  }

  /**
   * Get records by type (income or expense)
   */
  async getRecordsByType(type: 'income' | 'expense'): Promise<FinancialRecord[]> {
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
      } as FinancialRecord));
    } catch (error) {
      console.error('Error getting records by type:', error);
      throw error;
    }
  }

  /**
   * Get records by category
   */
  async getRecordsByCategory(category: FinancialRecord['category']): Promise<FinancialRecord[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FinancialRecord));
    } catch (error) {
      console.error('Error getting records by category:', error);
      throw error;
    }
  }

  /**
   * Get records within a date range
   */
  async getRecordsByDateRange(startDate: Timestamp, endDate: Timestamp): Promise<FinancialRecord[]> {
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
      } as FinancialRecord));
    } catch (error) {
      console.error('Error getting records by date range:', error);
      throw error;
    }
  }

  /**
   * Update a financial record
   */
  async updateRecord(
    recordId: string,
    updates: Partial<Omit<FinancialRecord, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, recordId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating financial record:', error);
      throw error;
    }
  }

  /**
   * Delete a financial record
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, recordId));
    } catch (error) {
      console.error('Error deleting financial record:', error);
      throw error;
    }
  }

  /**
   * Get financial summary for a date range
   */
  async getFinancialSummary(startDate: Timestamp, endDate: Timestamp) {
    try {
      const records = await this.getRecordsByDateRange(startDate, endDate);

      const income = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

      const expenses = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

      const byCategory = records.reduce((acc, record) => {
        if (!acc[record.category]) {
          acc[record.category] = { income: 0, expense: 0, total: 0 };
        }
        if (record.type === 'income') {
          acc[record.category].income += record.amount;
        } else {
          acc[record.category].expense += record.amount;
        }
        acc[record.category].total = acc[record.category].income - acc[record.category].expense;
        return acc;
      }, {} as Record<string, { income: number; expense: number; total: number }>);

      return {
        income,
        expenses,
        profit: income - expenses,
        byCategory,
        totalRecords: records.length,
        dateRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  /**
   * Get overall profit/loss
   */
  async getOverallProfitLoss() {
    try {
      const records = await this.getAllRecords();

      const income = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

      const expenses = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        income,
        expenses,
        profit: income - expenses
      };
    } catch (error) {
      console.error('Error getting overall profit/loss:', error);
      throw error;
    }
  }
}

export const financialService = new FinancialService();
export default financialService;
