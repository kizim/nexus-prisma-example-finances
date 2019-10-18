import { nexusPrismaPlugin } from 'nexus-prisma';
import { makeSchema } from 'nexus'
import * as Query from './Query';
import * as Mutation from './Mutation';
import * as Account from './Account';
import * as Transaction from './Transaction';
import * as User from './User';
import * as Auth from './Auth';

const types = [Query, Mutation, Account, Transaction, User, Auth];

export default makeSchema({
  types,
  plugins: [nexusPrismaPlugin()],
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '@generated/photon',
        alias: 'photon',
      },
      {
        source: require.resolve('../context'),
        alias: 'Context',
      },
    ],
  },
});
