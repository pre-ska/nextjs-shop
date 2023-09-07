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
    await prisma.cartItem.update({
      where: { id: articleInCart.id },
      data: {
        quantity: { increment: 1 },
      },
    });
  } else {
    // ako ne, kreiraj novi item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: 1,
      },
    });
  }

  // refrešaj page, ovo je server side akcija
  revalidatePath("/products/[id]");
}
