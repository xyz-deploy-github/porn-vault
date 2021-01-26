import ImageAlbumItem from "types/image_album_item";
import LabelledItem from "../../types/labelled_item";
import ImageAlbum from "../../types/image_album";
import ActorReference from "../../types/actor_reference";
import { albumCollection } from "../../database";
import Image from "../../types/image";
import { statAsync } from "../../utils/fs/async";
import { indexAlbums, removeAlbum } from "../../search/image_album";

export default {
  async addAlbum(
    _: unknown,
    args: { name: string; images?: string[]; scene?: string }
  ): Promise<ImageAlbum> {
    let album = new ImageAlbum(args.name);

    if (Array.isArray(args.images) && args.images.length) {
      await ImageAlbum.setImages(album, args.images);

      for (const imageId of args.images) {
        const image = await Image.getById(imageId);
        if (image && image.path) {
          const stats = await statAsync(image.path);
          album.size += stats.size;
        }
      }
      album.numImages = args.images.length;
    }

    // TODO: plugin event
    /* try {
      album = await onMovieCreate(album);
    } catch (error) {
      logger.error(error);
    } */

    await albumCollection.upsert(album._id, album);

    await ImageAlbum.syncActors(album);
    await ImageAlbum.syncLabels(album);

    await indexAlbums([album]);

    return album;
  },

  async removeAlbums(_: unknown, { ids }: { ids: string[] }): Promise<boolean> {
    for (const id of ids) {
      const album = await ImageAlbum.getById(id);

      if (album) {
        await ImageAlbum.remove(album._id);
        await removeAlbum(album._id);

        await ActorReference.removeByItem(album._id);
        await LabelledItem.removeByItem(album._id);
        await ImageAlbumItem.removeByAlbum(album._id);
      }
    }
    return true;
  },
};
