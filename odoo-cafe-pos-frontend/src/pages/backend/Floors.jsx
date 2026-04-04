import { useState } from "react";
import { Plus, Layers, Table2 } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageWrapper from "../../components/layout/PageWrapper";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { useFloors } from "../../hooks/useFloors";
import { floorAPI } from "../../api/floor.api";

const floorSchema = z.object({ name: z.string().min(1, "Floor name is required") });
const tableSchema = z.object({
  table_number: z.coerce.number().int().positive(),
  seats: z.coerce.number().int().positive(),
});

const STATUS_VARIANT = { FREE: "free", OCCUPIED: "occupied", BILL_READY: "ready" };

export default function Floors() {
  const { data: floors = [], isLoading, refetch } = useFloors();
  const [activeFloor, setActiveFloor] = useState(null);
  const [floorModal, setFloorModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);

  const floorForm = useForm({ resolver: zodResolver(floorSchema) });
  const tableForm = useForm({ resolver: zodResolver(tableSchema) });

  const onAddFloor = async (data) => {
    try {
      await floorAPI.createFloor(data);
      toast.success("Floor added");
      refetch();
      setFloorModal(false);
      floorForm.reset();
    } catch {
      toast.error("Failed to add floor");
    }
  };

  const onAddTable = async (data) => {
    try {
      await floorAPI.createTable({ ...data, floor_id: activeFloor.id });
      toast.success("Table added");
      refetch();
      setTableModal(false);
      tableForm.reset();
    } catch {
      toast.error("Failed to add table");
    }
  };

  return (
    <PageWrapper title="Floor Plan">
      {/* Floor Tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {floors.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFloor(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFloor?.id === f.id
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-orange-400"
            }`}
          >
            {f.name}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setFloorModal(true)}>
          <Layers size={14} /> Add Floor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !activeFloor ? (
        <EmptyState
          icon={Layers}
          title="No floor selected"
          description="Add a floor or select one from the tabs above"
          action={<Button onClick={() => setFloorModal(true)}>Add First Floor</Button>}
        />
      ) : (
        <Card>
          <CardHeader
            title={activeFloor.name}
            description={`${activeFloor.tables?.length ?? 0} tables`}
            action={
              <Button size="sm" onClick={() => setTableModal(true)}>
                <Plus size={14} /> Add Table
              </Button>
            }
          />
          <CardBody>
            {!activeFloor.tables?.length ? (
              <EmptyState icon={Table2} title="No tables yet" description="Add tables to this floor" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {activeFloor.tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-orange-300 transition-colors"
                  >
                    <span className="text-lg font-bold text-gray-800">T{table.table_number}</span>
                    <span className="text-xs text-gray-500">{table.seats} seats</span>
                    <Badge label={table.status} variant={STATUS_VARIANT[table.status] ?? "default"} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Floor Modal */}
      <Modal
        isOpen={floorModal}
        onClose={() => setFloorModal(false)}
        title="Add Floor"
        footer={
          <>
            <Button variant="outline" onClick={() => setFloorModal(false)}>Cancel</Button>
            <Button loading={floorForm.formState.isSubmitting} onClick={floorForm.handleSubmit(onAddFloor)}>Add</Button>
          </>
        }
      >
        <Input label="Floor Name" placeholder="e.g. Ground Floor" error={floorForm.formState.errors.name?.message} {...floorForm.register("name")} />
      </Modal>

      {/* Add Table Modal */}
      <Modal
        isOpen={tableModal}
        onClose={() => setTableModal(false)}
        title={`Add Table to ${activeFloor?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setTableModal(false)}>Cancel</Button>
            <Button loading={tableForm.formState.isSubmitting} onClick={tableForm.handleSubmit(onAddTable)}>Add Table</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Table Number" type="number" placeholder="e.g. 1" error={tableForm.formState.errors.table_number?.message} {...tableForm.register("table_number")} />
          <Input label="Seats" type="number" placeholder="e.g. 4" error={tableForm.formState.errors.seats?.message} {...tableForm.register("seats")} />
        </div>
      </Modal>
    </PageWrapper>
  );
}