"use server";

import { createCart, getCart } from "@/lib/db/cart";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function setProductQuantity(productId: string, quantity: number) {
  // ako cart nije još kreiran, kreiraj ga ili dohvati postojeći
  const cart = (await getCart()) ?? (await createCart());

  // provjeri dali item postoji
  const articleInCart = cart.items.find((item) => item.productId === productId);

  // ako je user odabrao 0, obriši item
  if (quantity === 0) {
    if (articleInCart) {
      // umjesto da dirktno brišem cartItem (delete komentiran ispod- prva verzija),
      // želim updjetati items array u cartu (cart model) na način da ću ih obrisati
      // sa ovakvom operacijom umjesto direktno brisanja cartItem
      // dobijem timestamp updatedAt kada je cart zadnji put updjetan
      // cron job (vercel) će onda anonimne cartove brisati regularno s obzirom
      // na taj timestamp
      await prisma.cart.update({
        // koji cart šaljem requestu
        where: { id: cart.id },
        // šta želim updejtati
        data: {
          // želim updejtat items array u cartu tako što ću obrisat item
          items: {
            delete: { id: articleInCart.id },
          },
        },
      });

      // ! prijašnja verzija - obriše cartItem direktno preko cartItem modela
      // ! na ovaj način parent cart ne dobije updatedAt zadnje radnje
      // await prisma.cartItem.delete({
      //   where: { id: articleInCart.id },
      // });
    }
  } else {
    if (articleInCart) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: {
              where: {
                id: articleInCart.id,
              },
              data: {
                quantity,
              },
            },
          },
        },
      });

      // ! isto kao i gore, umjesto cartItem modela koristim cart model
      // ! da dobijem  updatedAt timestamp na tome cartu
      // await prisma.cartItem.update({
      //   where: { id: articleInCart.id },
      //   data: {
      //     quantity,
      //   },
      // });
    } else {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            create: {
              productId,
              quantity,
            },
          },
        },
      });

      // ! kao i prethodna verzija, koristim cart model umjesto cartItem
      // await prisma.cartItem.create({
      //   data: {
      //     cartId: cart.id,
      //     productId,
      //     quantity,
      //   },
      // });
    }
  }

  revalidatePath("/cart");
}
