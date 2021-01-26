import ImageAlbum from "../types/image_album";
import { getClient, indexMap } from "../search";
import Studio from "../types/studio";
import { mapAsync } from "../utils/async";
import { logger } from "../utils/logger";
import { addSearchDocs, buildIndex, indexItems, ProgressCallback } from "./internal/buildIndex";
import {
  arrayFilter,
  bookmark,
  excludeFilter,
  favorite,
  getCount,
  getPage,
  getPageSize,
  includeFilter,
  ISearchResults,
  ratingFilter,
  searchQuery,
  shuffle,
  sort,
} from "./common";

export interface IAlbumSearchDoc {
  id: string;
  addedOn: number;
  name: string;
  labels: string[];
  numLabels: number;
  labelNames: string[];
  rating: number;
  /* score: number; */
  bookmark: number | null;
  favorite: boolean;
  custom: Record<string, boolean | string | number | string[] | null>;
  studios: string[];
  studioNames: string[];
  numImages: number;
  size: number;
}

export async function createAlbumSearchDoc(album: ImageAlbum): Promise<IAlbumSearchDoc> {
  const labels = await ImageAlbum.getLabels(album);

  const studios = [] as Studio[];
  const studio = album.studio ? await Studio.getById(album.studio) : null;
  if (studio) {
    studios.push(studio);
    studios.push(...(await Studio.getParents(studio)));
  }

  return {
    id: album._id,
    addedOn: album.addedOn,
    name: album.name,
    labels: labels.map((l) => l._id),
    numLabels: labels.length,
    labelNames: labels.map((l) => l.name),
    /*     score: Actor.calculateScore(actor, numViews, numScenes), */
    rating: album.rating,
    bookmark: album.bookmark,
    favorite: album.favorite,
    custom: album.customFields,
    studios: studios.map((st) => st._id),
    studioNames: studios.map((st) => st.name),
    numImages: album.numImages,
    size: album.size,
  };
}

export async function removeAlbum(albumId: string): Promise<void> {
  await getClient().delete({
    index: indexMap.imageAlbums,
    id: albumId,
    type: "_doc",
  });
}

export async function removeAlbums(actorIds: string[]): Promise<void> {
  await mapAsync(actorIds, removeAlbum);
}

export async function indexAlbums(
  albums: ImageAlbum[],
  progressCb?: ProgressCallback
): Promise<number> {
  logger.verbose(`Indexing ${albums.length} image albums`);
  return indexItems(albums, createAlbumSearchDoc, addAlbumSearchDocs, progressCb);
}

async function addAlbumSearchDocs(docs: IAlbumSearchDoc[]): Promise<void> {
  return addSearchDocs(indexMap.imageAlbums, docs);
}

export async function buildAlbumIndex(): Promise<void> {
  await buildIndex(indexMap.imageAlbums, ImageAlbum.getAll, indexAlbums);
}

export interface IAlbumSearchQuery {
  query: string;
  favorite?: boolean;
  bookmark?: boolean;
  rating: number;
  include?: string[];
  exclude?: string[];
  sortBy?: string;
  sortDir?: string;
  skip?: number;
  take?: number;
  page?: number;
  studios?: string[];
  scenes?: string[];
  // custom?: CustomFieldFilter[];
}

export async function searchAlbums(
  options: Partial<IAlbumSearchQuery>,
  shuffleSeed = "default",
  extraFilter: unknown[] = []
): Promise<ISearchResults> {
  logger.verbose(`Searching image albums for '${options.query || "<no query>"}'...`);

  const count = await getCount(indexMap.imageAlbums);
  if (count === 0) {
    logger.debug(`No items in ES, returning 0`);
    return {
      items: [],
      numPages: 0,
      total: 0,
    };
  }

  const result = await getClient().search<IAlbumSearchDoc>({
    index: indexMap.actors,
    ...getPage(options.page, options.skip, options.take),
    body: {
      ...sort(options.sortBy, options.sortDir, options.query),
      track_total_hits: true,
      query: {
        bool: {
          must: [
            ...shuffle(shuffleSeed, options.sortBy),
            ...searchQuery(options.query, ["name^1.5", "labelNames"]),
          ],
          filter: [
            ...ratingFilter(options.rating),
            ...bookmark(options.bookmark),
            ...favorite(options.favorite),

            ...includeFilter(options.include),
            ...excludeFilter(options.exclude),

            ...arrayFilter(options.studios, "studios", "OR"),
            ...arrayFilter(options.scenes, "scenes", "OR"),

            // ...buildCustomFilter(options.custom),

            ...extraFilter,
          ],
        },
      },
    },
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const total: number = result.hits.total.value;

  return {
    items: result.hits.hits.map((doc) => doc._source.id),
    total,
    numPages: Math.ceil(total / getPageSize(options.take)),
  };
}
