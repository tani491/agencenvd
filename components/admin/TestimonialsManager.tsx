"use client";

import { useState } from "react";
import { Loader2, Pencil, PlusCircle, Save, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TestimonialItem } from "@/lib/admin/data";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type TestimonialResponse = {
  success?: boolean;
  item?: Partial<TestimonialItem>;
  error?: string;
};

export function TestimonialsManager({
  initialItems
}: {
  initialItems: TestimonialItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState("");
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState("5");
  const [serviceUsed, setServiceUsed] = useState("Nettoyage canapé");
  const [comment, setComment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function submitTestimonial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const response = await fetch(
      editingId ? `/api/admin/testimonials/${editingId}` : "/api/admin/testimonials",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientName,
          client_name: clientName,
          rating: Number(rating),
          serviceUsed,
          service_used: serviceUsed,
          comment,
          avatarUrl,
          avatar_url: avatarUrl,
          isPublished,
          is_published: isPublished
        })
      }
    );
    const payload = (await response.json().catch(() => null)) as
      | TestimonialResponse
      | null;

    if (!response.ok || !payload?.item) {
      setFeedback({
        type: "error",
        message:
          payload?.error ?? "Impossible d'enregistrer ce témoignage pour le moment."
      });
      setIsSaving(false);
      return;
    }

    const item = normalizeTestimonialItem(payload.item, {
      id: editingId,
      client_name: clientName,
      rating: Number(rating),
      service_used: serviceUsed,
      comment,
      avatar_url: avatarUrl || null,
      is_published: isPublished
    });

    setItems((current) =>
      editingId
        ? current.map((currentItem) => (currentItem.id === editingId ? item : currentItem))
        : [item, ...current]
    );
    resetForm();
    setFeedback({
      type: "success",
      message: editingId ? "Témoignage modifié." : "Témoignage ajouté."
    });
    setIsSaving(false);
  }

  function startEditing(item: TestimonialItem) {
    setEditingId(item.id);
    setClientName(item.client_name);
    setRating(String(item.rating));
    setServiceUsed(item.service_used);
    setComment(item.comment);
    setAvatarUrl(item.avatar_url ?? "");
    setIsPublished(item.is_published);
    setFeedback(null);
  }

  function resetForm() {
    setEditingId("");
    setClientName("");
    setRating("5");
    setServiceUsed("Nettoyage canapé");
    setComment("");
    setAvatarUrl("");
    setIsPublished(true);
  }

  async function deleteTestimonial(item: TestimonialItem) {
    const confirmed = window.confirm(
      `Supprimer définitivement le témoignage de ${item.client_name} ?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setFeedback(null);

    const response = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => null)) as
      | TestimonialResponse
      | null;

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: payload?.error ?? "Impossible de supprimer ce témoignage."
      });
      setDeletingId("");
      return;
    }

    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    setFeedback({
      type: "success",
      message: "Témoignage supprimé."
    });
    setDeletingId("");

    if (editingId === item.id) {
      resetForm();
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Modifier le témoignage" : "Ajouter un témoignage"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitTestimonial}>
            <label className="grid gap-2 text-sm font-semibold">
              Nom du client
              <Input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Note sur 5
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Service utilisé
                <Input
                  value={serviceUsed}
                  onChange={(event) => setServiceUsed(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              URL avatar client
              <Input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Commentaire
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={5}
                required
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4 accent-nvd-blue-primary"
              />
              Publier sur la vitrine
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="nvd" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : editingId ? (
                  <Save />
                ) : (
                  <PlusCircle />
                )}
                {editingId ? "Enregistrer" : "Ajouter l'avis"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    resetForm();
                  }}
                >
                  <X />
                  Annuler
                </Button>
              )}
            </div>
          </form>

          {feedback && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Témoignages existants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {items.length === 0 && (
              <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-sm font-semibold text-muted-foreground">
                Aucun témoignage client enregistré pour le moment.
              </div>
            )}

            {items.map((item) => (
              <article key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-nvd-blue-dark">
                        {item.client_name}
                      </h3>
                      <Badge variant={item.is_published ? "eco" : "outline"}>
                        {item.is_published ? "Publié" : "Masqué"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {item.service_used}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        startEditing(item);
                      }}
                    >
                      <Pencil />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void deleteTestimonial(item);
                      }}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div
                  className="mt-3 flex text-amber-400"
                  aria-label={`Note ${item.rating} sur 5`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4"
                      fill={index < Math.round(item.rating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {item.comment}
                </p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeTestimonialItem(
  item: Partial<TestimonialItem>,
  fallback: Partial<TestimonialItem>
): TestimonialItem {
  const rating = Number(item.rating ?? fallback.rating ?? 5);

  return {
    id: item.id || fallback.id || crypto.randomUUID(),
    created_at: item.created_at || fallback.created_at || new Date().toISOString(),
    client_name: item.client_name || fallback.client_name || "Client NVD",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
    comment: item.comment || fallback.comment || "",
    service_used: item.service_used || fallback.service_used || "Nettoyage vapeur",
    avatar_url: item.avatar_url ?? fallback.avatar_url ?? null,
    is_published: item.is_published ?? fallback.is_published ?? true
  };
}
