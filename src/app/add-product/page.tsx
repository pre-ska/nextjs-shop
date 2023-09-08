import FormSubmitBtn from "@/components/FormSubmitBtn";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export const metadata = {
  title: "Add product",
};

// ! ovu server akciju mogu staviti ovdje jer ovo nije client component
async function addProduct(formData: FormData) {
  "use server"; // ! server action flag

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/add-product");
  }

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const price = Number(formData.get("price") || 0);

  if (!name || !description || !imageUrl || !price) {
    throw Error("Missing fields");
  }

  await prisma.product.create({
    data: {
      name,
      description,
      imageUrl,
      price,
    },
  });

  redirect("/");
}

export default async function AddProductPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/add-product");
  }
  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">AddProductPage</h1>
      <form action={addProduct}>
        <input
          required
          name="name"
          type="text"
          placeholder="Name"
          className="input-bordered input mb-3 w-full"
        />
        <textarea
          required
          name="description"
          className="textarea-bordered textarea mb-3 w-full"
          placeholder="Description"
        />
        <input
          required
          name="imageUrl"
          type="url"
          placeholder="Image URL"
          className="input-bordered input mb-3 w-full"
        />
        <input
          required
          name="price"
          type="number"
          placeholder="Price"
          className="input-bordered input mb-3 w-full"
        />

        <FormSubmitBtn className="btn-block">Add product</FormSubmitBtn>
      </form>
    </div>
  );
}
