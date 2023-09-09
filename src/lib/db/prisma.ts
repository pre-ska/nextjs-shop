// ! npx prisma generate će generirati klijenta sa kojim brljam po bazi
// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaBase = globalForPrisma.prisma ?? new PrismaClient();

// ! extendam svaki prisma request sa extenzijom
// ! i to onaj na cart modelu za update
// ! jer mi to treba da imam updatedAt timestamp na cartu
// ! za svaku operaciju koju sam radio nad cartItem-s
// ! zato sam i prebacivao sve akcije sa cartItem na cart model
// u lib/db/cart, app/proiduct/[id]/action i u app/cart/actions
export const prisma = prismaBase.$extends({
  query: {
    cart: {
      async update({ args, query }) {
        args.data = {
          ...args.data,
          updatedAt: new Date(),
        };

        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaBase;
