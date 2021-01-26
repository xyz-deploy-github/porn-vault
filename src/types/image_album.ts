import { actorCollection, albumCollection, albumItemCollection } from "../database";
import { generateHash } from "../utils/hash";
import { logger } from "../utils/logger";
import { arrayDiff, createObjectSet } from "../utils/misc";
import Actor from "./actor";
import ActorReference from "./actor_reference";
import Image from "./image";
import ImageAlbumItem from "./image_album_item";
import Label from "./label";
import LabelledItem from "./labelled_item";

export default class ImageAlbum {
  _id: string;
  name: string;
  description: string | null = null;
  addedOn = +new Date();
  releaseDate: number | null = null;
  thumbnail: string | null = null;
  favorite = false;
  bookmark: number | null = null;
  rating = 0;
  customFields: Record<string, boolean | string | number | string[] | null> = {};
  scene: string | null = null;
  size: number = 0;
  numImages: number = 0;
  studio: string | null = null;

  constructor(name: string) {
    this._id = `ia_${generateHash()}`;
    this.name = name.trim();
  }

  static async addImages(album: ImageAlbum, imageIds: string[]): Promise<ImageAlbumItem[]> {
    const items = [] as ImageAlbumItem[];
    let index = 0;

    for (const id of imageIds) {
      const item = new ImageAlbumItem(album._id, id);
      logger.debug(`${index} Adding image to album: ${JSON.stringify(item)}`);
      item.index = index++;
      await albumItemCollection.upsert(item._id, item);
      items.push(item);
    }

    return items;
  }

  static async setImages(album: ImageAlbum, imageIds: string[]): Promise<void> {
    const oldRefs = await ImageAlbumItem.getByAlbum(album._id);

    const { removed, added } = arrayDiff(oldRefs, [...new Set(imageIds)], "image", (l) => l);

    for (const oldRef of removed) {
      await albumCollection.remove(oldRef._id);
    }

    await ImageAlbum.addImages(album, added);
  }

  static async syncActors(album: ImageAlbum): Promise<number> {
    const items = await ImageAlbumItem.getByAlbum(album._id);
    const actors = await Promise.all(items.map((item) => Image.getActors(item.image)));
    const actorSet = createObjectSet(actors.flat().filter(Boolean), "_id");
    await LabelledItem.removeByItem(album._id);
    await ImageAlbum.setActors(
      album,
      actorSet.map((actor) => actor._id)
    );
    return actorSet.length;
  }

  static async syncLabels(album: ImageAlbum): Promise<number> {
    const items = await ImageAlbumItem.getByAlbum(album._id);
    const labels = await Promise.all(items.map((item) => Image.getLabels(item.image)));
    const labelSet = createObjectSet(labels.flat().filter(Boolean), "_id");
    await LabelledItem.removeByItem(album._id);
    await ImageAlbum.setLabels(
      album,
      labelSet.map((label) => label._id)
    );
    return labelSet.length;
  }

  static async getById(_id: string): Promise<ImageAlbum | null> {
    return albumCollection.get(_id);
  }

  static async getBulk(_ids: string[]): Promise<ImageAlbum[]> {
    return albumCollection.getBulk(_ids);
  }

  static async getAll(): Promise<ImageAlbum[]> {
    return albumCollection.getAll();
  }

  static async getActors(album: ImageAlbum): Promise<Actor[]> {
    const references = await ActorReference.getByItem(album._id);
    return (await actorCollection.getBulk(references.map((r) => r.actor)))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async setActors(album: ImageAlbum, actorIds: string[]): Promise<void> {
    return Actor.setForItem(album._id, actorIds, "album");
  }

  static async addActors(album: ImageAlbum, actorIds: string[]): Promise<void> {
    return Actor.addForItem(album._id, actorIds, "album");
  }

  static async setLabels(album: ImageAlbum, labelIds: string[]): Promise<void> {
    return Label.setForItem(album._id, labelIds, "album");
  }

  static async addLabels(album: ImageAlbum, labelIds: string[]): Promise<void> {
    return Label.addForItem(album._id, labelIds, "album");
  }

  static async getLabels(album: ImageAlbum): Promise<Label[]> {
    return Label.getForItem(album._id);
  }

  static async remove(_id: string): Promise<ImageAlbum> {
    return albumCollection.remove(_id);
  }
}
