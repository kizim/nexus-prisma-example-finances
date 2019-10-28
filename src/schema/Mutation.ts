import { mutationType, stringArg } from 'nexus';
import { UserInputError, ForbiddenError } from 'apollo-server';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const Mutation = mutationType({
  definition(t) {
    t.crud.createOneTransaction({ alias: 'createTransaction' }),
    t.field('signUp', {
      type: 'LoginMethodResponse',
      args: {
        email: stringArg(),
        password: stringArg()
      },
      resolve: async (_, { email, password }, { photon }) => {
        const existingUser = await photon.users.findOne({ where: { email } });
        if (existingUser) throw new UserInputError('This email is already exist in our system');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await photon.users.create({ data: { email, password: hashedPassword } });

        const idToken = jwt.sign({
          email: user.email,
          name: user.name,
          roles: user.roles,
          sub: user.id,
          iss: 'https://auth.fujix.io/basic'
        }, 'secret', {
          algorithm: 'HS256',
        });

        return { idToken, user };
      }
    }),
    t.field('signIn', {
      type: 'LoginMethodResponse',
      args: {
        email: stringArg(),
        password: stringArg()
      },
      resolve: async (_, { email, password }, { photon }) => {
        const user = await photon.users.findOne({ where: { email } });
        if (!user || !user.password) throw new ForbiddenError('Incorrect email or password');

        const passwordMatch = await bcrypt.compare(password, user.password as string);
        if (!passwordMatch) throw new ForbiddenError('Incorrect email or password');

        const idToken = jwt.sign({
          email: user.email,
          name: user.name,
          roles: user.roles,
          sub: user.id,
          iss: 'https://auth.fujix.io/basic'
        }, 'secret', {
          algorithm: 'HS256',
        });

        return { idToken, user };
      }
    })
  },
});
