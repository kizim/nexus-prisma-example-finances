import { Context } from "../context";
import { TransactionCreateInput, Transaction, TransactionCreateArgs } from "@generated/photon";

export const resolversMiddleware = {
  Mutation: {
    // @ts-ignore
    createTransaction: async (resolve, parent, args: TransactionCreateArgs, context: Context, info) => {
      const result = await resolve(parent, args, context, info);

      // @ts-ignore
      const accountId = args.data.account.connect.id;
      const account = await context.photon.accounts.findOne({ where: { id: accountId }, select: { id: true, balance: true } });

      if (!account) return result;

      const balance = account.balance + args.data.amount;

      await context.photon.accounts.update({
        where: { id: account.id },
        data: { balance },
      });

      return result;
    },
  },
};
