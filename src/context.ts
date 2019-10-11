import { Photon, Datasources } from '@generated/photon';

import getDataSources, { ApolloDataSources } from './datasources';

const photon = new Photon();

export type Context = {
  photon: Photon,
  datasources: ApolloDataSources,
};

export const createContext = (): Context => ({
  photon,
  datasources: getDataSources(),
});
