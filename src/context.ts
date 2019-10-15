import { Photon } from '@generated/photon';
import { IncomingMessage } from 'http';

import getDataSources, { ApolloDataSources } from './datasources';
import getUser from './helpers/get-user';

const photon = new Photon();

export type Context = {
  photon: Photon,
  datasources: ApolloDataSources,
  user?: any
};

export const createContext = async ({ req }: { req: IncomingMessage }): Promise<Context> => {
  const context: Context = {
    photon,
    datasources: getDataSources(),
  };

  const { authorization } = req.headers;
  if (authorization) context.user = getUser({ authorization });

  return context;
};
