import { ICrudable, IModel } from '../crudable';
import { IJwt, IMicroflowStorage } from '../types';

export class EntityController<T extends IModel> {
  private model: T;
  private store: ICrudable<T>;
  protected storage: IMicroflowStorage;
  protected jwt: IJwt;

  constructor(
    model: T,
    store: ICrudable<T>,
    storage: IMicroflowStorage,
    jwt: IJwt
  ) {
    this.model = model;
    this.store = store;
    this.storage = storage;
    this.jwt = jwt;
  }

  async data(): Promise<T> {
    return this.store.read(this.model.id);
  }

  async update(data: Partial<Omit<T, 'id'>>): Promise<T> {
    return this.store.update(this.model.id, data);
  }
}
