import ImageAlbumItem from "../../types/image_album_item";
import LabelledItem from "../../types/labelled_item";
import ImageAlbum from "../../types/image_album";
import ActorReference from "../../types/actor_reference";
import { albumCollection } from "../../database";
import Image from "../../types/image";
import { statAsync } from "../../utils/fs/async";
import { indexAlbums, removeAlbum } from "../../search/image_album";
import { indexImages } from "../../search/image";

export default {
  async spliceImages(_: unknown, args: { album: string; ids: string[] }) {
    const album = await ImageAlbum.getById(args.album);
    if (!album) {
      throw new Error("Album not found");
    }

    for (const id of args.ids) {
      const image = await Image.getById(id);
      if (image && image.path) {
        await ImageAlbumItem.removeById(ImageAlbumItem.getId(album._id, id));
        const stats = await statAsync(image.path);
        album.size -= stats.size;
        album.numImages--;
      }
    }

    await albumCollection.upsert(album._id, album);
    await ImageAlbum.syncActors(album);
    await ImageAlbum.syncLabels(album);
    await indexAlbums([album]);

    return true;
  },

  async appendImages(_: unknown, args: { album: string; images: string[] }) {
    const album = await ImageAlbum.getById(args.album);
    if (!album) {
      throw new Error("Album not found");
    }

    const items = await ImageAlbum.addImages(album, args.images);

    await ImageAlbum.syncActors(album);
    await ImageAlbum.syncLabels(album);
    await indexAlbums([album]);

    for (const imageId of args.images) {
      const image = await Image.getById(imageId);
      if (image) {
        await indexImages([image]);
      }
    }

    return items;
  },

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
