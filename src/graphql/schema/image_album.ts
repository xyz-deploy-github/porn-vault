import { gql } from "apollo-server-express";

export default gql`
  type ImageAlbumSearchResults {
    numItems: Int!
    numPages: Int!
    items: [ImageAlbum!]!
  }

  extend type Query {
    numAlbums: Int!
    # getAlbums(query: AlbumSearchQuery!, seed: String): AlbumSearchResults!
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
    removeAlbums(ids: [String!]!): Boolean!
  }
`;
