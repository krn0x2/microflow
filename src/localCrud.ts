import { nanoid } from 'nanoid';
import { ICrudable, IModel } from './crudable';

export class LocalCrud<T extends IModel> implements ICrudable<T> {
  store: Map<T['id'], T>;

  constructor(map: Map<T['id'], T>) {
    this.store = map;
  }

  async create(data: Omit<T, 'id'> & { id?: T['id'] }): Promise<T> {
    const id = data.id || nanoid();
    this.store.set(id, { id, ...data } as T);
    return this.store.get(id);
  }

  async read(id: T['id']): Promise<T> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    return this.store.get(id);
  }

  async update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<T> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    this.store.set(id, { ...this.store.get(id), ...data });
    return this.store.get(id);
  }

  async delete(id: T['id']): Promise<T['id']> {
    if (!this.store.has(id)) throw new Error(`Item with id = ${id} not found`);
    this.store.delete(id);
    return id;
  }
}
