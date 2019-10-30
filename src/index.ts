import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import bodyParser from 'body-parser';
import express from 'express';

import cors from 'cors';
import schema from './schema';
import { createContext } from './context';
import * as middlewares from './middlewares';
import queryEngine from './helpers/query-engine-route'

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/asketes', queryEngine);

const server = new ApolloServer({
  schema: applyMiddleware(schema, middlewares.permissions, middlewares.resolvers),
  context: ({ req }) => createContext({ req }),
  tracing: true,
  introspection: true,
});
server.applyMiddleware({ app, path: '/'});

app.listen({ port: 4000 }, () =>
  console.log(`🚀  Server ready at http://localhost:4000${server.graphqlPath}`),
);