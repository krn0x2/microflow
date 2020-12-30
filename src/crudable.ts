export interface IModel<T> {
  id: T;
}

export interface ICrudable<T extends IModel<K>, K> {
  create(data: T): Promise<T>;
  read(id: K): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<K>;
}

export class Crudable<T extends IModel<K>, K> implements ICrudable<T, K> {
  create(data: T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  read(id: K): Promise<T> {
    throw new Error('Method not implemented.');
  }
  update(id: K, data: Partial<T>): Promise<T> {
    throw new Error('Method not implemented.');
  }
  delete(id: K): Promise<K> {
    throw new Error('Method not implemented.');
  }
}
