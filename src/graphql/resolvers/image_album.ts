import ImageAlbum from "types/image_album";
import Scene from "../../types/scene";
import CustomField, { CustomFieldTarget } from "../../types/custom_field";
import Image from "../../types/image";
import Studio from "../../types/studio";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  async availableFields(): Promise<CustomField[]> {
    const fields = await CustomField.getAll();
    return fields.filter((field) => field.target.includes(CustomFieldTarget.ALBUMS));
  },
  async thumbnail(album: ImageAlbum): Promise<Image | null> {
    if (album.thumbnail) {
      return Image.getById(album.thumbnail);
    }
    return null;
  },
  async scene(album: ImageAlbum): Promise<Scene | null> {
    if (album.scene) {
      return Scene.getById(album.scene);
    }
    return null;
  },
  async studio(album: ImageAlbum): Promise<Studio | null> {
    if (album.studio) {
      return Studio.getById(album.studio);
    }
    return null;
  },
  async actors(album: ImageAlbum): Promise<Actor[]> {
    return ImageAlbum.getActors(album);
  },
  async labels(album: ImageAlbum): Promise<Label[]> {
    return ImageAlbum.getLabels(album);
  },
};
