export interface SubscriptionStore {
  add(userId: number): Promise<void>;
  remove(userId: number): Promise<void>;
  has(userId: number): Promise<boolean>;
  getAll(): Promise<number[]>;
}
