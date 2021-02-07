import { libraryPath } from "../utils/path";
import { formatName } from "../database";
import { Izzy } from "../database/internal";
import { logger } from "../utils/logger";

export class Queue<T extends { _id: string }> {
  private _name: string;
  private _collection!: Izzy.Collection<T>;

  constructor(name: string) {
    this._name = name;
  }

  async ensureCollection() {
    const collection = await Izzy.createCollection<T>(
      formatName(this._name),
      libraryPath(`${this._name}.db`)
    );
    this._collection = collection;
    return collection;
  }

  async getHead(): Promise<T | null> {
    logger.debug(`Getting ${this._name} queue head`);
    const items = await this._collection.getAll();
    return items[0] || null;
  }

  enqueue(item: T): Promise<T> {
    logger.verbose(`Adding scene "${item._id}" to ${this._name} queue`);
    return this._collection.upsert(item._id, item);
  }

  getLength(): Promise<number> {
    return this._collection.count();
  }

  remove(id: string): Promise<T> {
    logger.verbose(`Removing "${id}" from ${this._name} queue...`);
    return this._collection.remove(id);
  }
}
