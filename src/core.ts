import { ICrudable, IModel } from './crudable';
import { IJwt, IMicroflowStorage } from './types';

interface EntityConstructor<T extends IModel<K>, K, U> {
  new (
    model: T,
    store: ICrudable<T, K>,
    storage: IMicroflowStorage,
    jwt: IJwt
  ): U;
}

export class MicroflowCore<T extends IModel<K>, K, U> {
  private ctor: EntityConstructor<T, K, U>;
  private store: ICrudable<T, K>;
  private storage: IMicroflowStorage;
  private jwt: IJwt;
  constructor(
    ctor: EntityConstructor<T, K, U>,
    store: ICrudable<T, K>,
    storage?: IMicroflowStorage,
    jwt?: IJwt
  ) {
    this.ctor = ctor;
    this.store = store;
    this.storage = storage;
    this.jwt = jwt;
  }

  async create(data: T): Promise<U> {
    const model = await this.store.create(data);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async read(id: K): Promise<U> {
    const model = await this.store.read(id);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async update(id: K, data: Partial<T>): Promise<U> {
    const model = await this.store.update(id, data);
    return new this.ctor(model, this.store, this.storage, this.jwt);
  }

  async delete(id: K): Promise<K> {
    return this.store.delete(id);
  }
}
