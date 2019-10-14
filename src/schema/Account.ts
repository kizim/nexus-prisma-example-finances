import { objectType, arg } from 'nexus';

export const Account = objectType({
  name: 'Account',
  definition(t) {
    t.model.id(),
    t.model.name(),
    t.model.currency(),
    t.model.user()
    t.model.transactions({ filtering: true }),
    t.field('balance', {
      type: 'Float',
      args: {
        currency: arg({ type: 'Currency' }),
      },
      resolve: async ({ balance, currency: baseCurrency }, { currency }, { datasources }) => {
        return (currency && currency !== baseCurrency)
          ? await datasources.exchangeRatesAPI.convert(balance, baseCurrency, currency)
          : balance;
      },
    })
  },
});
