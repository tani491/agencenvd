"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { CalendarDays, Eye, MessageCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getServiceLabel, getStatusLabel, quoteStatusOptions } from "@/lib/admin/labels";
import type { QuoteRow, QuoteStatus } from "@/lib/admin/data";

const statusBadgeClass: Record<string, string> = {
  pending: "bg-cyan-100 text-nvd-blue-dark",
  contacted: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  scheduled: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-900 text-white",
  cancelled: "bg-red-100 text-red-700"
};

type QuoteCellContext = {
  row: {
    original: QuoteRow;
  };
};

export function QuotesDataTable({ quotes }: { quotes: QuoteRow[] }) {
  const [rows, setRows] = useState(quotes);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  async function updateStatus(id: string, status: QuoteStatus) {
    setUpdatingId(id);

    const response = await fetch(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      setRows((currentRows) =>
        currentRows.map((row) => (row.id === id ? { ...row, status } : row))
      );
    }

    setUpdatingId("");
  }

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const haystack = [row.full_name, row.phone, row.location, row.utm_source ?? ""]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, rows, statusFilter]);

  const columns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }: QuoteCellContext) => (
          <div className="grid gap-1">
            <span className="font-semibold">
              {formatDate(row.original.created_at)}
            </span>
            {row.original.preferred_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Souhaitée {formatDate(row.original.preferred_date)}
              </span>
            )}
          </div>
        )
      },
      {
        accessorKey: "full_name",
        header: "Client",
        cell: ({ row }: QuoteCellContext) => (
          <div className="grid gap-1">
            <span className="font-black text-nvd-blue-dark">
              {row.original.full_name}
            </span>
            <a
              href={`tel:${row.original.phone}`}
              className="text-xs font-semibold text-muted-foreground hover:text-nvd-blue-primary"
            >
              {row.original.phone}
            </a>
          </div>
        )
      },
      {
        accessorKey: "location",
        header: "Zone",
        cell: ({ row }: QuoteCellContext) => (
          <span className="font-semibold text-slate-700">{row.original.location}</span>
        )
      },
      {
        accessorKey: "services",
        header: "Services",
        cell: ({ row }: QuoteCellContext) => (
          <div className="flex max-w-sm flex-wrap gap-1.5">
            {row.original.services.map((service: string) => (
              <Badge key={service} variant="secondary">
                {getServiceLabel(service)}
              </Badge>
            ))}
          </div>
        )
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }: QuoteCellContext) => (
          <div className="grid min-w-36 gap-2">
            <Badge className={statusBadgeClass[row.original.status]}>
              {getStatusLabel(row.original.status)}
            </Badge>
            <Select
              value={row.original.status}
              onValueChange={(value) => updateStatus(row.original.id, value as QuoteStatus)}
              disabled={updatingId === row.original.id}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quoteStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      },
      {
        id: "media",
        header: "Réception",
        cell: ({ row }: QuoteCellContext) => (
          <MediaPreview quote={row.original} />
        )
      },
      {
        id: "actions",
        header: "Relance",
        cell: ({ row }: QuoteCellContext) => (
          <Button asChild variant="whatsapp" size="sm">
            <a href={buildWhatsappFollowupUrl(row.original)} target="_blank" rel="noreferrer">
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
        )
      }
    ],
    [updatingId]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-white pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom, téléphone ou quartier"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-white sm:w-56">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {quoteStatusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center">
                  Aucune demande ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MediaPreview({ quote }: { quote: QuoteRow }) {
  if (!quote.furniture_photo_url) {
    return <span className="text-xs text-muted-foreground">Aucun média</span>;
  }

  const isVideo = isVideoUrl(quote.furniture_photo_url);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye />
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Visionneuse de réception</DialogTitle>
          <DialogDescription>
            Média envoyé par {quote.full_name} pour évaluer la prestation.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border bg-slate-950">
          {isVideo ? (
            <video
              className="max-h-[70vh] w-full"
              src={quote.furniture_photo_url}
              controls
            />
          ) : (
            <div className="relative aspect-video max-h-[70vh] w-full">
              <Image
                src={quote.furniture_photo_url}
                alt={`Média reçu pour ${quote.full_name}`}
                fill
                sizes="(max-width: 1024px) 100vw, 768px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildWhatsappFollowupUrl(quote: QuoteRow) {
  const services = quote.services.map(getServiceLabel).join(", ");
  const message = [
    `Bonjour ${quote.full_name},`,
    "Merci pour votre demande de devis NVD.",
    `Nous avons bien reçu votre demande pour: ${services}.`,
    `Zone: ${quote.location}.`,
    "Pouvez-vous confirmer votre disponibilité pour une intervention vapeur ?"
  ].join("\n");

  return `https://wa.me/${quote.phone.replace("+", "")}?text=${encodeURIComponent(
    message
  )}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-SN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}
