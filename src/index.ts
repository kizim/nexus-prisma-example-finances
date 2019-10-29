import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import express from 'express';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';


import schema from './schema';
import photon from './photon';
import { createContext } from './context';
import * as middlewares from './middlewares';
import request from 'request-promise';

const app = express();
app.use(bodyParser.json());

app.post('/asketes', async (req: Request, res: Response) => {
  if (!process.env.ENGINE_PORT) {
    await photon.connect();
    //@ts-ignore
    process.env.ENGINE_PORT = photon.fetcher.engine.port;
    console.log(`Prisma engine ready at http://localhost:${process.env.ENGINE_PORT}`)
  }

  const uri = `http://localhost:${process.env.ENGINE_PORT}/`;
  //@ts-ignore
  let result;
  try {
    result = await request.post(uri, {
      headers: req.headers,
      body: JSON.stringify(req.body),
    });
  } catch(e) {}

  res.status(200).end(result);
});

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