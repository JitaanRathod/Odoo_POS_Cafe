import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { useReports } from "../../hooks/useReports";
import PageWrapper from "../../components/layout/PageWrapper";
import MetricCard from "../../components/ui/MetricCard";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { reportAPI } from "../../api/report.api";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import dayjs from "dayjs";

const PERIODS = ["today", "week", "month"];

export default function Dashboard() {
  const [period, setPeriod] = useState("today");
  const { data, isLoading } = useReports({ period });

  const orderColumns = [
    { key: "order_number", label: "#", width: 60 },
    { key: "table", label: "Table" },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          label={v}
          variant={v === "PAID" ? "success" : v === "OPEN" ? "info" : "default"}
        />
      ),
    },
    {
      key: "method",
      label: "Payment",
      render: (v) => <span className="capitalize text-sm text-gray-600">{v?.toLowerCase()}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => <span className="font-semibold text-gray-800">₹{v}</span>,
    },
    {
      key: "created_at",
      label: "Time",
      render: (v) => <span className="text-gray-500 text-xs">{dayjs(v).format("hh:mm A")}</span>,
    },
  ];

  const handleExport = async (type) => {
    const url = await reportAPI.export(type, { period });
    window.open(url, "_blank");
  };

  return (
    <PageWrapper title="Sales Dashboard">
      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              period === p
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
            <FileText size={14} /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("xls")}>
            <Download size={14} /> Export XLS
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Sales"
              value={`₹${data?.totalSales ?? 0}`}
              icon={DollarSign}
              trend="up"
              trendValue="+12% vs last period"
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
            />
            <MetricCard
              title="Orders"
              value={data?.totalOrders ?? 0}
              icon={ShoppingBag}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Avg Order Value"
              value={`₹${data?.avgOrder ?? 0}`}
              icon={TrendingUp}
              iconBg="bg-green-100"
              iconColor="text-green-600"
            />
            <MetricCard
              title="Customers"
              value={data?.customers ?? 0}
              icon={Users}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Sales by Hour</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`₹${v}`, "Sales"]} />
                <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</h2>
            <Table
              columns={orderColumns}
              data={data?.recentOrders ?? []}
              emptyMessage="No orders yet for this period."
            />
          </div>
        </>
      )}
    </PageWrapper>
  );
}