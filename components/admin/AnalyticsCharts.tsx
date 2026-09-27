"use client";

import type { ComponentType } from "react";
import Link from "next/link";
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
import {
  ImagePlus,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Settings,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/lib/admin/data";

const chartColors = ["#0072CE", "#00C4FF", "#10B981", "#0F2C59", "#F59E0B"];

export function AnalyticsCharts({
  summary,
  variant = "full"
}: {
  summary: AnalyticsSummary;
  variant?: "dashboard" | "full";
}) {
  if (variant === "dashboard") {
    return (
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Visiteurs uniques"
            value={summary.uniqueVisitors.toString()}
            icon={Users}
          />
          <MetricCard
            label="Clics WhatsApp"
            value={summary.whatsappClicks.toString()}
            icon={MessageCircle}
          />
          <MetricCard
            label="Appels téléphoniques"
            value={summary.phoneCalls.toString()}
            icon={Phone}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ShortcutCard
            href="/admin/dashboard/media"
            label="CMS Médias"
            description="Hero, portfolio et réalisations avant/après"
            icon={ImagePlus}
          />
          <ShortcutCard
            href="/admin/dashboard/testimonials"
            label="Témoignages"
            description="Avis clients affichés sur la vitrine"
            icon={MessageSquareQuote}
          />
          <ShortcutCard
            href="/admin/dashboard/settings"
            label="Paramètres"
            description="Logo, contacts et sécurité admin"
            icon={Settings}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Visiteurs uniques" value={summary.uniqueVisitors.toString()} />
        <MetricCard
          label="Vues de pages"
          value={summary.totalPageViews.toString()}
        />
        <MetricCard label="Demandes reçues" value={summary.totalQuotes.toString()} />
        <MetricCard
          label="Conversion visiteurs"
          value={`${summary.visitorConversionRate}%`}
        />
        <MetricCard
          label="Devis transformés"
          value={`${summary.quoteConversionRate}%`}
        />
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

function MetricCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-muted-foreground">{label}</div>
          {Icon && (
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-nvd-blue-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-2 text-3xl font-black text-nvd-blue-dark">{value}</div>
      </CardContent>
    </Card>
  );
}

function ShortcutCard({
  href,
  label,
  description,
  icon: Icon
}: {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-nvd-cyan hover:shadow-md"
    >
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-nvd-blue-primary text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-black text-nvd-blue-dark">{label}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
