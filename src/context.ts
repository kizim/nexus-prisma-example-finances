import { Photon, User } from '@generated/photon';
import { IncomingMessage } from 'http';

import photon from './photon';
import getDataSources, { ApolloDataSources } from './datasources';
import getUser from './helpers/get-user';

export type Context = {
  photon: Photon,
  datasources: ApolloDataSources,
  user: User | null
};

export const createContext = async ({ req }: { req: IncomingMessage }): Promise<Context> => {
  const context: Context = {
    photon,
    datasources: getDataSources(),
    user: null,
  };

  const { authorization } = req.headers;
  if (authorization) context.user = await getUser({ authorization });

  return context;
};
