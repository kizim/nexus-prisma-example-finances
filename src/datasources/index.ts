import { DataSources } from 'apollo-server-core/dist/graphqlOptions';

import { ExchangeRatesAPI } from './exchange-rates';

const getDataSources = () => ({
  exchangeRatesAPI: new ExchangeRatesAPI(),
});

export interface ApolloDataSources extends DataSources<any> {
  exchangeRatesAPI: ExchangeRatesAPI;
};

export default getDataSources;
