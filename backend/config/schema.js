const { buildSchema } = require("graphql"); // вытаскиваем схему графкуэль

// Схема GraphQL
const schema = buildSchema(`
  type Message {
    id: ID!
    content: String!
    user: String!
    userId: ID!
  }

  type User {
    id: ID!
    email: String!
    name: String
    threadId: Int
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type RefreshTokenPayload {
    accessToken: String!
    refreshToken: String!
  }

  type Query {
    messages: [Message!]!
    users: [User!]!
    user(id: ID!): User
    me: User
  }

  type Mutation {
    sendMessage(content: String!, user: String!): Message!
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    deleteUser(id: ID!): User
    logout: Boolean! # Новая мутация для удаления refresh-токенов
  }

  type Subscription {
    messageAdded: Message!
  }
`);

module.exports = schema;
