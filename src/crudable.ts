export interface IModel {
  id: string;
}

export interface ICrudable<T extends IModel> {
  create(data: Omit<T, 'id'> & { id?: T['id'] }): Promise<T>;
  read(id: T['id']): Promise<T>;
  update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<T>;
  delete(id: T['id']): Promise<T['id']>;
}

export class Crudable<T extends IModel> implements ICrudable<T> {
  create(data: Omit<T, 'id'> & { id?: T['id'] }): Promise<T> {
    throw new Error('Method not implemented.');
  }
  read(id: T['id']): Promise<T> {
    throw new Error('Method not implemented.');
  }
  update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<T> {
    throw new Error('Method not implemented.');
  }
  delete(id: T['id']): Promise<T['id']> {
    throw new Error('Method not implemented.');
  }
}
