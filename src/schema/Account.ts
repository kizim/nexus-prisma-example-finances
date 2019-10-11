import { objectType } from 'nexus';

export const Account = objectType({
  name: 'Account',
  definition(t) {
    t.model.id(),
    t.model.name(),
    t.model.user()
    t.model.transactions(),
    t.field('balance', {
      type: 'Float',
      resolve: async ({ id }, args, { photon }) => {
        const transactions = await photon.transactions.findMany({ where: { account: { id } }, select: { amount: true } });

        return transactions.reduce((r, t) => r + t.amount, 0);
      }
    })
  },
});
