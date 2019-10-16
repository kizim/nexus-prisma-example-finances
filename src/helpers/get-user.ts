import jwt from 'jsonwebtoken';

import { User } from '@generated/photon';
import photon from '../photon';

export default async ({ authorization }: { authorization: string }): Promise<User | null> => {
  try {
    const token: any = jwt.verify(authorization.replace('Bearer ', ''), 'secret');

    // const user = {
    //   id: token.sub,
    //   email: token.email,
    //   name: token.name,
    //   roles: token.roles,
    // };
    
    const user = await photon.users.findOne({ where: { id: token.sub }});
    delete user.password;

    return user;
  } catch (e) {
    return null;
  }
};
