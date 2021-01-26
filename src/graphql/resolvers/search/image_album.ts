import ImageAlbum from "../../../types/image_album";
import { albumCollection } from "../../../database";
import { IAlbumSearchQuery, searchAlbums } from "../../../search/image_album";
import { logger } from "../../../utils/logger";

export async function getAlbums(
  _: unknown,
  { query, seed }: { query: Partial<IAlbumSearchQuery>; seed?: string }
): Promise<
  | {
      numItems: number;
      numPages: number;
      items: ImageAlbum[];
    }
  | undefined
> {
  const timeNow = +new Date();

  const result = await searchAlbums(query, seed);
  logger.verbose(`Search results: ${result.total} hits found in ${(Date.now() - timeNow) / 1000}s`);

  const albums = await albumCollection.getBulk(result.items);
  logger.verbose(`Search done in ${(Date.now() - timeNow) / 1000}s.`);

  return {
    numItems: result.total,
    numPages: result.numPages,
    items: albums.filter(Boolean),
  };
}
