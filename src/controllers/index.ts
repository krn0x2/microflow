import { ICrudable, IModel } from '../crudable';
import { IJwt, IMicroflowStorage } from '../types';

export class EntityController<T extends IModel> {
  constructor(
    private model: T,
    private store: ICrudable<T>,
    protected storage: IMicroflowStorage,
    protected jwt: IJwt,
    protected timeout: number = 10000
  ) {
  }

  async data(): Promise<T> {
    return this.store.read(this.model.id);
  }

  async update(data: Partial<Omit<T, 'id'>>): Promise<T> {
    return this.store.update(this.model.id, data);
  }
}
