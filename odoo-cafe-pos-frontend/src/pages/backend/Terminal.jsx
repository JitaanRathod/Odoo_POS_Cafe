import { useState } from "react";
import { Monitor, PlayCircle, StopCircle } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../../components/layout/PageWrapper";
import { Card, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useSessionStore } from "../../store/useSessionStore";
import { sessionAPI } from "../../api/session.api";

export default function Terminal() {
  const navigate = useNavigate();
  const { sessionId, isOpen, cashier, openSession, closeSession } = useSessionStore();
  const [closeModal, setCloseModal] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenSession = async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.open();
      openSession({ sessionId: res.id, cashier: res.cashier });
      toast.success("POS Session opened!");
      navigate("/pos/floor");
    } catch {
      toast.error("Failed to open session");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    setLoading(true);
    try {
      await sessionAPI.close({ sessionId, closing_amount: parseFloat(closingAmount) || 0 });
      closeSession();
      toast.success("Session closed successfully");
      setCloseModal(false);
    } catch {
      toast.error("Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="POS Terminal">
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <CardBody className="pt-6">
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="p-5 bg-orange-50 rounded-2xl">
                <Monitor size={40} className="text-orange-500" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {isOpen ? "Session Active" : "POS Terminal"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isOpen
                    ? `Opened by ${cashier} · Session ID: ${sessionId?.slice(0, 8)}...`
                    : "Open a session to start taking orders"}
                </p>
              </div>

              {isOpen ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Session running since {dayjs().format("hh:mm A")}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button onClick={() => navigate("/pos/floor")}>
                      Go to Floor View
                    </Button>
                    <Button variant="danger" onClick={() => setCloseModal(true)}>
                      <StopCircle size={16} /> Close Session
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="lg" loading={loading} onClick={handleOpenSession}>
                  <PlayCircle size={18} /> Open Session
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Close Session Modal */}
      <Modal
        isOpen={closeModal}
        onClose={() => setCloseModal(false)}
        title="Close Session"
        footer={
          <>
            <Button variant="outline" onClick={() => setCloseModal(false)}>Cancel</Button>
            <Button variant="danger" loading={loading} onClick={handleCloseSession}>
              Confirm Close
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Enter the closing cash amount in the register before closing the session.
        </p>
        <Input
          label="Closing Cash Amount (₹)"
          type="number"
          placeholder="0.00"
          value={closingAmount}
          onChange={(e) => setClosingAmount(e.target.value)}
        />
      </Modal>
    </PageWrapper>
  );
}