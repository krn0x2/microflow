import { ICrudable, IModel } from './crudable';
import { IJwt, IMicroflowStorage } from './types';

interface EntityConstructor<T extends IModel, U> {
  new (model: T, store: ICrudable<T>, storage: IMicroflowStorage, jwt: IJwt): U;
}

export class MicroflowCore<T extends IModel, U> {
  private ctor: EntityConstructor<T, U>;
  private store: ICrudable<T>;
  private storage: IMicroflowStorage;
  private jwt: IJwt;
  constructor(
    ctor: EntityConstructor<T, U>,
    store: ICrudable<T>,
    storage?: IMicroflowStorage,
    jwt?: IJwt
  ) {
    this.ctor = ctor;
    this.store = store;
    this.storage = storage;
    this.jwt = jwt;
  }

  async create(data: Omit<T, 'id'> & { id?: T['id'] }): Promise<U> {
    const model = await this.store.create(data);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async read(id: T['id']): Promise<U> {
    const model = await this.store.read(id);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<U> {
    const model = await this.store.update(id, data);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async delete(id: T['id']): Promise<T['id']> {
    return this.store.delete(id);
  }
}
