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
      resolve: async ({ id, currency: baseCurrency }, { currency }, { photon, datasources }) => {
        const transactions = await photon.transactions.findMany({ where: { account: { id } }, select: { amount: true } });

        const balance = transactions.reduce((r, t) => r + t.amount, 0);

        const total = currency
          ? await datasources.exchangeRatesAPI.convert(balance, baseCurrency, currency)
          : balance;

        return Math.round(total * 100) / 100;
      }
    })
  },
});
