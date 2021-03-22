import { ICrudable, IModel } from './crudable';
import { IJwt, IMicroflowStorage } from './types';

interface EntityConstructor<T extends IModel, U> {
  new (model: T, store: ICrudable<T>, storage: IMicroflowStorage, jwt: IJwt, timeout: number): U;
}

export class MicroflowCore<T extends IModel, U> {
  constructor(
    private ctor: EntityConstructor<T, U>,
    private store: ICrudable<T>,
    private storage?: IMicroflowStorage,
    private jwt?: IJwt,
    private timeout?: number,
  ) {
  }

  async create(data: Omit<T, 'id'> & { id?: T['id'] }): Promise<U> {
    const model = await this.store.create(data);
    return new this.ctor(model, this.store, this.storage, this.jwt, this.timeout);
  }

  async read(id: T['id']): Promise<U> {
    const model = await this.store.read(id);
    return new this.ctor(model, this.store, this.storage, this.jwt, this.timeout);
  }

  async update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<U> {
    const model = await this.store.update(id, data);
    return new this.ctor(model, this.store, this.storage, this.jwt, this.timeout);
  }

  async delete(id: T['id']): Promise<T['id']> {
    return this.store.delete(id);
  }
}
