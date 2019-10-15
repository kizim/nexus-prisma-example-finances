import { objectType, arg } from 'nexus';

export const LoginMethodResponse = objectType({
  name: 'LoginMethodResponse',
  definition(t) {
    t.string('idToken'),
    t.field('user', { type: 'User' })
  },
});
