import { ICrudable, IModel } from './crudable';

export class LocalCrud<T extends IModel<K>, K> implements ICrudable<T, K> {
  store: Map<K, T>;

  constructor(map: Map<K, T>) {
    this.store = map;
  }

  async create(data: T): Promise<T> {
    this.store.set(data.id, data);
    return this.store.get(data.id);
  }

  async read(id: K): Promise<T> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    return this.store.get(id);
  }

  async update(id: K, data: Partial<T>): Promise<T> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    this.store.set(id, { ...this.store.get(id), ...data });
    return this.store.get(id);
  }

  async delete(id: K): Promise<K> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    this.store.delete(id);
    return id;
  }
}
