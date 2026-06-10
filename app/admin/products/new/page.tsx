import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display font-bold text-xl mb-6">Novo produto</h1>
      <ProductForm />
    </main>
  );
}
