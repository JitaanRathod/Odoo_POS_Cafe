import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { useProducts } from "../../hooks/useProducts";
import { productAPI } from "../../api/product.api";

const CATEGORIES = ["Pizza", "Pasta", "Burger", "Drinks", "Desserts", "Snacks"].map((c) => ({
  label: c,
  value: c,
}));

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().positive("Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  tax_pct: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
});

export default function Products() {
  const { data: products = [], isLoading, refetch } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditProduct(null);
    reset({ tax_pct: 5 });
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    reset(product);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editProduct) {
        await productAPI.update(editProduct.id, data);
        toast.success("Product updated");
      } else {
        await productAPI.create(data);
        toast.success("Product created");
      }
      refetch();
      setModalOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productAPI.delete(deleteTarget.id);
      toast.success("Product deleted");
      refetch();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    {
      key: "price",
      label: "Price",
      render: (v) => <span className="font-semibold text-gray-800">₹{v}</span>,
    },
    { key: "unit", label: "Unit" },
    {
      key: "tax_pct",
      label: "Tax",
      render: (v) => `${v}%`,
    },
    {
      key: "is_active",
      label: "Status",
      render: (v) => <Badge label={v ? "Active" : "Inactive"} variant={v ? "success" : "default"} />,
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Products">
      <Card>
        <CardHeader
          title="Product List"
          description="Manage your cafe menu items"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} /> Add Product
            </Button>
          }
        />
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <Table columns={columns} data={products} emptyMessage="No products yet. Add your first product." />
          )}
        </CardBody>
      </Card>

      {/* Product Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? "Edit Product" : "Add Product"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editProduct ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <Input label="Product Name" placeholder="e.g. Margherita Pizza" error={errors.name?.message} {...register("name")} />
          <Select label="Category" options={CATEGORIES} placeholder="Select category" error={errors.category?.message} {...register("category")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" type="number" step="0.01" placeholder="0.00" error={errors.price?.message} {...register("price")} />
            <Input label="Unit" placeholder="piece / kg / ml" error={errors.unit?.message} {...register("unit")} />
          </div>
          <Input label="Tax %" type="number" step="0.1" placeholder="5" error={errors.tax_pct?.message} {...register("tax_pct")} />
          <Input label="Description (optional)" placeholder="Short description..." {...register("description")} />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </PageWrapper>
  );
}
