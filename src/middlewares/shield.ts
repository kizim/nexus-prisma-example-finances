import { rule, shield, and, or, not } from 'graphql-shield';
import _ from 'lodash';

import { UserRole } from '@generated/photon';

import { Context } from '../context';

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context) => {
    return ctx.user !== null;
  },
);

const isGuest = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context) => {
    return ctx.user === null;
  },
);

const hasRole = (roles: UserRole[]) => rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user && ctx.user.roles && !!_.intersection(ctx.user.roles, roles).length;
  },
);

export const permissions = shield({
  Query: {
    user: hasRole(['ADMIN']),
    users: hasRole(['ADMIN']),
    account: isAuthenticated,
  },
  Mutation: {
    createTransaction: isAuthenticated,
    createAccount: isAuthenticated,
    signUp: isGuest,
    signIn: isGuest,
  },
});