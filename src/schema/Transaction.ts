import { objectType } from 'nexus';

export const Transaction = objectType({
  name: 'Transaction',
  definition(t) {
    t.model.id(),
    t.model.amount(),
    t.model.account(),
    t.model.createdAt()
  },
});
