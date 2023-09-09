import { cookies } from "next/dist/client/components/headers";
import { prisma } from "./prisma";
import { Cart, CartItem, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type CartWithProducts = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true };
}>;

export type ShoppingCart = CartWithProducts & {
  size: number;
  subtotal: number;
};

export async function getCart(): Promise<ShoppingCart | null> {
  const session = await getServerSession(authOptions);

  let cart: CartWithProducts | null = null;

  if (session) {
    cart = await prisma.cart.findFirst({
      where: { userId: session.user?.id },
      include: { items: { include: { product: true } } },
    });
  } else {
    const localCartId = cookies().get("localCartId")?.value;

    cart = localCartId
      ? await prisma.cart.findUnique({
          where: { id: localCartId },
          include: { items: { include: { product: true } } },
        })
      : null;
  }

  if (!cart) {
    return null;
  }

  return {
    ...cart,
    size: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: cart.items.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0
    ),
  };
}

export async function createCart(): Promise<ShoppingCart> {
  const session = await getServerSession(authOptions);

  let newCart: Cart;

  if (session) {
    newCart = await prisma.cart.create({
      data: {
        userId: session.user?.id,
      },
    });
  } else {
    newCart = await prisma.cart.create({
      data: {},
    });

    cookies().set("localCartId", newCart.id);
  }

  return {
    ...newCart,
    items: [],
    size: 0,
    subtotal: 0,
  };
}

export async function mergeAnonymousCartIntoUserCart(userId: string) {
  // ! 1 - prvo pogledam dali postoji local cart (anonimi cart koji je user napravio bez da je bio logiran)
  const localCartId = cookies().get("localCartId")?.value;

  const localCart = localCartId
    ? await prisma.cart.findUnique({
        where: { id: localCartId },
        include: { items: true },
      })
    : null;

  // ! ako ne postoji lokalni cart, nista se nece izvršit
  if (!localCart) {
    return;
  }

  // ! 2 - ako postoji local cart, dohvatim cart koji je user napravio - ako postoji
  const userCart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
  });

  // ! 3- radim usporedbu, koja je wrapana u "$transaction", tx je prisma obj
  // $transaction znači da sve operacije unutar transakcije moraju biti uspiješne
  // ako jedna pukne, sve se vraća na početno stanje
  await prisma.$transaction(async (tx) => {
    if (userCart) {
      // ako postoji cart od logiranog korisnika, moramo mergeat cart items iz local carta u user cart
      const mergedCartItems = mergeCartItems(localCart.items, userCart.items);

      // obrišem postojeće itemse u user cart
      await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

      // ! ovo je isprva bilo drugačije - cartItem.createMany komentiran dolje
      // ! vidi app/cart/actions.ts zašto koristim cart model
      // stvorim nove itemse u user cartu (merge postojećih i iz localnog carta)
      await prisma.cart.update({
        where: { id: userCart.id },
        data: {
          items: {
            createMany: {
              data: mergedCartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
        },
      });

      // await tx.cartItem.createMany({
      //   data: mergedCartItems.map((item) => ({
      //     cartId: userCart.id,
      //     productId: item.productId,
      //     quantity: item.quantity,
      //   })),
      // });
    } else {
      // ako ne postoji cart od logiranog korisnika, moramo stvorit novi cart
      // sa itemslima iz lokalnog carta
      // btw. relation - creairam cart i u njemu itemse u jednom requestu
      await tx.cart.create({
        data: {
          userId,
          items: {
            createMany: {
              data: localCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
        },
      });
    }

    // nakon merganja moramo deletat localni cart i cookie
    await tx.cart.delete({ where: { id: localCart.id } });
    cookies().set("localCartId", "");
  });
}

// helper funkcija za mergeAnonymousCartIntoUserCart
// merga itemse iz localne (anonymous cart) u user cart (user cart
function mergeCartItems(...cartItems: CartItem[][]): CartItem[] {
  return cartItems.reduce((acc, items) => {
    items.forEach((item) => {
      const existingItem = acc.find((i) => i.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        acc.push(item);
      }
    });
    return acc;
  }, [] as CartItem[]);
}
