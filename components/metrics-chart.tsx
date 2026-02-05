"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface MetricValue {
  id: string;
  date: Date | string;
  value: number;
  metric: {
    key: string;
    label: string;
    unit: string;
  };
}

interface MetricsChartProps {
  metrics: MetricValue[];
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  const metricKeys = Array.from(
    new Set(metrics.map((m) => m.metric.key))
  ).slice(0, 4);

  const dates = Array.from(
    new Set(metrics.map((m) => new Date(m.date).toISOString()))
  )
    .sort()
    .reverse()
    .slice(0, 10);

  const chartData = dates.map((dateStr) => {
    const data: Record<string, string | number> = {
      date: formatDate(new Date(dateStr)),
    };

    metricKeys.forEach((key) => {
      const metric = metrics.find(
        (m) =>
          m.metric.key === key &&
          new Date(m.date).toISOString() === dateStr
      );
      if (metric) {
        data[key] = metric.value;
      }
    });

    return data;
  }).reverse();

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {metricKeys.map((key, index) => {
              const label =
                metrics.find((m) => m.metric.key === key)?.metric.label || key;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index]}
                  name={label}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
