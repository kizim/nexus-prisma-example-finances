import jwt from 'jsonwebtoken';

export default ({ authorization }: { authorization: string }) => {
  try {
    const token: any = jwt.verify(authorization.replace('Bearer ', ''), 'secret');

    const user = {
      id: token.sub,
      email: token.email,
      name: token.name,
      roles: token.roles,
    };
    
    return user;
  } catch (e) {
    return null;
  }
};
