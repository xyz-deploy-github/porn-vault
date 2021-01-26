import { gql } from "apollo-server-express";

export default gql`
  type ImageAlbumSearchResults {
    numItems: Int!
    numPages: Int!
    items: [ImageAlbum!]!
  }

  type AlbumSearchQuery {
    query: String
    favorite: Boolean
    bookmark: Boolean
    rating: Int
    include: [String!]
    exclude: [String!]
    sortBy: String
    sortDir: String
    skip: Int
    take: Int
    page: Int
    studios: [String!]
    scenes: [String!]
  }

  extend type Query {
    numAlbums: Int!
    getAlbums(query: AlbumSearchQuery!, seed: String): AlbumSearchResults!
    getAlbumById(id: String!): ImageAlbum
  }

  type ImageAlbum {
    _id: String!
    name: String!
    description: String
    addedOn: Long!
    releaseDate: Long
    favorite: Boolean!
    bookmark: Long
    customFields: Object!
    rating: Int!
    size: Long!
    numImages: Int!

    # Resolvers
    availableFields: [CustomField!]!
    thumbnail: Image
    scene: Scene
    studio: Studio
    actors: [Actor!]!
    labels: [Label!]!
  }

  extend type Mutation {
    addAlbum(name: String!, images: [String!], scene: String): ImageAlbum!
    appendImages(album: String!, images: [String!]!): [Image!]!
    spliceImages(album: String!, ids: [String!]!): Boolean!
    removeAlbums(ids: [String!]!): Boolean!
  }
`;
