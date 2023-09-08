import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/db/cart";
import ShoppingCartBtn from "./ShoppingCartBtn";
import UserMenuBtn from "./UserMenuBtn";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function searchProducts(formData: FormData) {
  "use server";

  const searchQuery = formData.get("searchQuery");

  if (searchQuery) {
    redirect("/search?query=" + searchQuery);
  }
}

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const cart = await getCart();
  return (
    <div className="bg-base-100">
      <div className="navbar mx-auto max-w-7xl flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Link href="/" className="btn-ghost btn text-xl normal-case">
            <Image src={logo} alt="logo" width={40} height={40} />
            nextShop
          </Link>
        </div>

        <div className="flex-none gap-2">
          <form action={searchProducts}>
            <div className="form-control">
              <input
                type="text"
                placeholder="Search"
                name="searchQuery"
                className="input-bordered input w-full min-w-[200px]"
              />
            </div>
          </form>

          <ShoppingCartBtn cart={cart} />
          <UserMenuBtn session={session} />
        </div>
      </div>
    </div>
  );
}
