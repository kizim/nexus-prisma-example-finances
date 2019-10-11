import { objectType } from 'nexus';

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id(),
    t.model.name()
    t.model.accounts(),
    t.field('balance', {
      type: 'Float',
      resolve: async ({ id }, args, { photon }) => {
        const accounts = await photon.accounts.findMany({ where: { user: { id } }, select: { id: true } });
        const transactions = await photon.transactions.findMany({ where: { account: { id: { in: accounts.map(a => a.id) } } }, select: { amount: true } });

        return transactions.reduce((r, t) => r + t.amount, 0);
      }
    })
  },
});
