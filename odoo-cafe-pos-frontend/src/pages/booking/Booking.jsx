import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import PageWrapper from "../../components/layout/PageWrapper";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { useBookings } from "../../hooks/useBookings";
import { bookingAPI } from "../../api/booking.api";

const schema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  customer_phone: z.string().optional(),
  booked_at: z.string().min(1, "Date & time required"),
  guests: z.coerce.number().int().min(1, "At least 1 guest"),
  table_id: z.string().min(1, "Select a table"),
});

const STATUS_VARIANT = {
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "info",
};

export default function Booking() {
  const { data: bookings = [], isLoading, refetch } = useBookings();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await bookingAPI.create(data);
      toast.success("Booking created");
      refetch();
      setModalOpen(false);
      reset();
    } catch {
      toast.error("Failed to create booking");
    }
  };

  const columns = [
    { key: "customer_name", label: "Guest Name" },
    { key: "customer_phone", label: "Phone", render: (v) => v || "—" },
    {
      key: "booked_at",
      label: "Date & Time",
      render: (v) => dayjs(v).format("DD MMM YYYY · hh:mm A"),
    },
    { key: "guests", label: "Guests" },
    {
      key: "status",
      label: "Status",
      render: (v) => <Badge label={v} variant={STATUS_VARIANT[v] ?? "default"} />,
    },
  ];

  return (
    <PageWrapper title="Booking">
      <Card>
        <CardHeader
          title="Table Reservations"
          description="Manage upcoming bookings"
          action={
            <Button size="sm" onClick={() => { reset(); setModalOpen(true); }}>
              <Plus size={14} /> New Booking
            </Button>
          }
        />
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !bookings.length ? (
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="Add your first reservation"
              action={<Button onClick={() => setModalOpen(true)}>New Booking</Button>}
            />
          ) : (
            <Table columns={columns} data={bookings} />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Booking"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Create</Button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <Input label="Guest Name" placeholder="John Doe" error={errors.customer_name?.message} {...register("customer_name")} />
          <Input label="Phone (optional)" placeholder="+91 ..." {...register("customer_phone")} />
          <Input label="Date & Time" type="datetime-local" error={errors.booked_at?.message} {...register("booked_at")} />
          <Input label="Number of Guests" type="number" min={1} error={errors.guests?.message} {...register("guests")} />
          <Input label="Table ID" placeholder="Table UUID" error={errors.table_id?.message} {...register("table_id")} />
        </form>
      </Modal>
    </PageWrapper>
  );
}