import Dexie, { type Table } from 'dexie';
import { Product, Customer } from '../types';

export interface PendingSale {
  id?: number;
  saleData: any;
  createdAt: number;
}

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  pendingSales!: Table<PendingSale>;

  constructor() {
    super('POSDatabase');
    this.version(1).stores({
      products: 'id, name, sku, barcode',
      customers: 'id, name, document_number',
      pendingSales: '++id, createdAt'
    });
  }
}

export const db = new POSDatabase();
