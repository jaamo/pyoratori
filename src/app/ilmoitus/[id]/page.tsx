import { notFound, redirect } from "next/navigation";
import { getProductById } from "@/server/queries/products";
import { ProductDetail } from "@/components/products/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  if (product.externalUrl) {
    redirect(product.externalUrl);
  }

  return <ProductDetail product={product} />;
}
