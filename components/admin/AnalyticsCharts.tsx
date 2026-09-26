"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/lib/admin/data";

const chartColors = ["#0072CE", "#00C4FF", "#10B981", "#0F2C59", "#F59E0B"];

export function AnalyticsCharts({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Demandes reçues" value={summary.totalQuotes.toString()} />
        <MetricCard
          label="Demandes converties"
          value={summary.convertedQuotes.toString()}
        />
        <MetricCard label="Taux conversion" value={`${summary.conversionRate}%`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Origine des prospects</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.sourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={104}
                  paddingAngle={2}
                >
                  {summary.sourceData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services les plus demandés</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="service"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="demandes" fill="#0072CE" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par quartier</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.locationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="location" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="demandes" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycle de traitement</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F2C59" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm font-semibold text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-black text-nvd-blue-dark">{value}</div>
      </CardContent>
    </Card>
  );
}
