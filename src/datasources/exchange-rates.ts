import { HTTPCache, RESTDataSource } from 'apollo-datasource-rest';

import { Currency } from '@generated/photon';

export class ExchangeRatesAPI extends RESTDataSource {
  baseURL = 'https://api.exchangeratesapi.io/latest';
  httpCache = new HTTPCache();

  async getRate(base: Currency, currency: Currency) {
    const result = await this.get(`?base=${base}&symbols=${currency}`);

    const rate = result && result.rates && result.rates[currency] || 0;

    return Math.round(rate * 100) / 100;
  }

  async convert(amount: number, base: Currency, currency: Currency) {
    if (base === currency) return amount;

    return await this.getRate(base, currency) * amount;
  }
};
