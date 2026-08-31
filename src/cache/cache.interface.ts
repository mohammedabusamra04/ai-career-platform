export interface Cache {
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  get<T>(key: string): Promise<T | null>;

  delete(key: string): Promise<void>;
}
