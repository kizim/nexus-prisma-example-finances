import { Photon } from '@generated/photon';
import faker from 'faker';
import _ from 'lodash';

main();

async function main() {
  const photon = new Photon();

  await photon.transactions.deleteMany({});
  await photon.accounts.deleteMany({});
  await photon.users.deleteMany({});

  const createUser = (name: string) => photon.users.create({
    data: {
      name,
      accounts: {
        create: _.invokeMap(_.range(_.random(1, 3)), () => faker.finance.accountName()).map(name => ({
          name,
          transactions: {
            create: _.invokeMap(_.range(_.random(1, 10)), () => parseFloat(faker.finance.amount())).map(amount => ({ amount })),
          }
        }))
      }
    }
  });

  await createUser('Serg');
  await createUser(faker.name.firstName());
  await createUser(faker.name.firstName());

  await photon.disconnect();
};
