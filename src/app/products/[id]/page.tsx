import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import PriceTag from "@/components/PriceTag";
import { cache } from "react";

interface ProductPageProps {
  params: {
    id: string;
  };
}

// ! cache je funkcija iz reacta
const getProduct = cache(async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound(); // ! default import from next/navigation .... redirects to 404
  }

  return product;
});

// ! dinamični metadata (page title, desc) samo za ovu stranicu (svaki product page)
// da nebi dvaput dohvaćao product, jednom za glavnu funkciju, drugi put za metadata
// koristi se cache iz reacta koji  kešira podatke  i koristi ih ovdje i u glavnoj komponenti
export async function generateMetadata({
  params: { id },
}: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductPage({
  params: { id },
}: ProductPageProps) {
  const product = await getProduct(id);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={500}
        height={500}
        className="rounded-lg"
        priority
      />
      <div>
        <h1 className="text-5xl font-bold">{product.name}</h1>
        <PriceTag price={product.price} className="mt-4" />
        <p className="py-6">{product.description}</p>
      </div>
    </div>
  );
}
