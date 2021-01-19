import { albumItemCollection } from "../database";
import { generateHash } from "../utils/hash";

export default class ImageAlbumItem {
  _id: string;
  album: string;
  image: string;
  index?: number;

  constructor(album: string, image: string) {
    this._id = `ai_${generateHash()}`;
    this.album = album;
    this.image = image;
  }

  static async getByAlbum(album: string): Promise<ImageAlbumItem[]> {
    return (await albumItemCollection.query("album-index", album)).sort(
      (a, b) => (a.index || -1) - (b.index || -1)
    );
  }

  static async getByImage(image: string): Promise<ImageAlbumItem[]> {
    return albumItemCollection.query("image-index", image);
  }

  static async getById(_id: string): Promise<ImageAlbumItem | null> {
    return albumItemCollection.get(_id);
  }

  static async getBulk(_ids: string[]): Promise<ImageAlbumItem[]> {
    return albumItemCollection.getBulk(_ids);
  }

  static async removeById(_id: string): Promise<ImageAlbumItem> {
    return albumItemCollection.remove(_id);
  }

  static async removeByImage(id: string): Promise<void> {
    for (const ref of await ImageAlbumItem.getByImage(id)) {
      await ImageAlbumItem.removeById(ref._id);
    }
  }

  static async removeByAlbum(id: string): Promise<void> {
    for (const ref of await ImageAlbumItem.getByAlbum(id)) {
      await ImageAlbumItem.removeById(ref._id);
    }
  }
}
