import { mutationType, stringArg } from 'nexus';
import { UserInputError } from 'apollo-server';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const Mutation = mutationType({
  definition(t) {
    t.crud.createOneUser(),
    t.crud.createOneAccount(),
    t.crud.createOneTransaction({ alias: 'createTransaction' })
    t.field('signUp', {
      type: 'LoginMethodResponse',
      args: {
        email: stringArg(),
        password: stringArg()
      },
      resolve: async (_, { email, password }, { photon }) => {
        try {
          await photon.users.findOne({ where: { email } });
        } catch (e) {
          const hashedPassword = await bcrypt.hash(password, 10);

          console.log('test');

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

        throw new UserInputError('This email is already exist in our system');
      }
    }),
    t.field('signIn', {
      type: 'LoginMethodResponse',
      args: {
        email: stringArg(),
        password: stringArg()
      },
      resolve: async (_, { email, password }, { photon }) => {
        let user;
        try {
          user = await photon.users.findOne({ where: { email } });
          if (!user.password) throw new Error();

          const passwordMatch = await bcrypt.compare(password, user.password as string);
          if (!passwordMatch) throw new Error();
        } catch (e) {
          throw new UserInputError('Invalid email or password');
        }

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
