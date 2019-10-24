import { ApolloServer } from 'apollo-server';
import { applyMiddleware } from 'graphql-middleware'

import schema from './schema';
import { createContext } from './context';
import * as middlewares from './middlewares';

const server = new ApolloServer({
  schema: applyMiddleware(schema, middlewares.permissions, middlewares.resolvers),
  context: ({ req }) => createContext({ req }),
  tracing: true,
  introspection: true,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
