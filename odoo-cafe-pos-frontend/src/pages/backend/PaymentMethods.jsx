import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { Wallet, CreditCard, Smartphone } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { paymentAPI } from "../../api/payment.api";

const METHOD_META = {
  CASH: { label: "Cash", icon: Wallet, desc: "Accept physical cash payments" },
  DIGITAL: { label: "Digital / Card", icon: CreditCard, desc: "Accept card and digital wallet payments" },
  UPI: { label: "UPI QR", icon: Smartphone, desc: "Accept UPI payments via QR code" },
};

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [upiInput, setUpiInput] = useState("");

  useEffect(() => {
    paymentAPI.getMethods().then((data) => {
      setMethods(data);
      const upi = data.find((m) => m.type === "UPI");
      if (upi?.upi_id) setUpiInput(upi.upi_id);
    }).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (method, enabled) => {
    setSaving(method.id);
    try {
      const updated = await paymentAPI.updateMethod(method.id, { is_enabled: enabled });
      setMethods((prev) => prev.map((m) => (m.id === method.id ? { ...m, ...updated } : m)));
      toast.success(`${METHOD_META[method.type]?.label} ${enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveUPI = async () => {
    const upiMethod = methods.find((m) => m.type === "UPI");
    if (!upiMethod) return;
    setSaving(upiMethod.id);
    try {
      await paymentAPI.updateMethod(upiMethod.id, { upi_id: upiInput });
      setMethods((prev) => prev.map((m) => m.type === "UPI" ? { ...m, upi_id: upiInput } : m));
      toast.success("UPI ID saved");
    } catch {
      toast.error("Failed to save UPI ID");
    } finally {
      setSaving(null);
    }
  };

  return (
    <PageWrapper title="Payment Methods">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="flex flex-col gap-5 max-w-2xl">
          {methods.map((method) => {
            const meta = METHOD_META[method.type];
            const Icon = meta?.icon;
            return (
              <Card key={method.id}>
                <CardBody className="pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 rounded-xl">
                        {Icon && <Icon size={20} className="text-orange-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{meta?.label}</p>
                        <p className="text-xs text-gray-500">{meta?.desc}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={method.is_enabled}
                      onChange={(val) => handleToggle(method, val)}
                      disabled={saving === method.id}
                    />
                  </div>

                  {/* UPI config section */}
                  {method.type === "UPI" && method.is_enabled && (
                    <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Input
                            label="UPI ID"
                            placeholder="yourname@ybl"
                            value={upiInput}
                            onChange={(e) => setUpiInput(e.target.value)}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveUPI}
                          loading={saving === method.id}
                          disabled={!upiInput}
                        >
                          Save
                        </Button>
                      </div>

                      {method.upi_id && (
                        <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl">
                          <QRCodeSVG value={`upi://pay?pa=${method.upi_id}`} size={140} />
                          <p className="text-xs text-gray-500">QR preview for {method.upi_id}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}