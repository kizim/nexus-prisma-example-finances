import { Photon } from '@generated/photon';
import faker from 'faker';
import _ from 'lodash';
import bcrypt from 'bcrypt';

main();

async function main() {
  const photon = new Photon();

  await photon.transactions.deleteMany({});
  await photon.accounts.deleteMany({});
  await photon.users.deleteMany({});

  const createUser = async (name: string, email: string) => photon.users.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(email, 10),
      accounts: {
        create: _.invokeMap(_.range(_.random(1, 3)), () => faker.finance.accountName()).map(name => ({
          name,
          // transactions: {
          //   create: _.invokeMap(_.range(_.random(1, 10)), () => parseFloat(faker.finance.amount())).map(amount => ({ amount })),
          // }
        }))
      }
    }
  });

  await createUser('Serg', 'serg@example.com');
  await createUser(faker.name.firstName(), 'test@example.com');
  await createUser(faker.name.firstName(), 'test2@example.com');

  await photon.disconnect();
};
