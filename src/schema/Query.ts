import { queryType } from 'nexus';

export const Query = queryType({
  definition(t) {
    t.crud.user(),
    t.crud.users(),
    t.crud.account(),
    t.crud.transactions({ filtering: true }),
    t.field('me', {
      type: 'User',
      nullable: true,
      resolve: async (parent, args, { photon, user }) => {
        if (!user) return null;

        return await photon.users.findOne({ where: { id: user.id } });
      }
    })
  },
});
