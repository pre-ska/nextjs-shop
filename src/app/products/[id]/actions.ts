"use server";

import { createCart, getCart } from "@/lib/db/cart";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function incrementProductQuantity(productId: string) {
  // ako cart nije još kreiran, kreiraj ga ili dohvati postojeći
  const cart = (await getCart()) ?? (await createCart());

  // provjeri dali item postoji
  const articleInCart = cart.items.find((item) => item.productId === productId);

  // ako postoji, povećaj mu quantity
  if (articleInCart) {
    // ! ovo je isprva bilo drugačije
    // ! vidi app/cart/actions.ts zašto koristim cart model
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: {
          update: {
            where: { id: articleInCart.id },
            data: { quantity: { increment: 1 } },
          },
        },
      },
    });
  } else {
    // ako ne, kreiraj novi item
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: {
          create: {
            productId,
            quantity: 1,
          },
        },
      },
    });
  }

  // refrešaj page, ovo je server side akcija
  revalidatePath("/products/[id]");
}
