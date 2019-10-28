import jwt from 'jsonwebtoken';

import { User } from '@generated/photon';
import photon from '../photon';

export default async ({ authorization }: { authorization: string }): Promise<User | null> => {
  const token: any = jwt.verify(authorization.replace('Bearer ', ''), 'secret');
  
  const user = await photon.users.findOne({ where: { id: token.sub }});
  if (user) delete user.password;
  
  return user;
};
