import { objectType, arg } from 'nexus';

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id(),
    t.model.name()
    t.model.email()
    t.model.accounts()
    t.field('balance', {
      type: 'Float',
      args: {
        currency: arg({ type: 'Currency', required: true }),
      },
      resolve: async ({ id }, { currency }, { photon, datasources }) => {
        const accounts = await photon.accounts.findMany({ where: { user: { id } }, select: { balance: true, currency: true } });
        const balances = await Promise.all(accounts.map(a => datasources.exchangeRatesAPI.convert(a.balance, a.currency, currency)));

        return balances.reduce((p, v) => p + v, 0);
      },
    })
  },
});
