import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Download,
  Lock,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBackground } from "@/components/page-background";
import { EVENT, formatEuros, formatSlot } from "@/lib/event";
import {
  deleteReservation,
  downloadReservationsCsv,
  getBackendMode,
  getLocalCaisseCode,
  itemsSummary,
  listReservations,
  reservationItemCount,
  STATUS_LABELS,
  STATUS_ORDER,
  updateReservationStatus,
  verifyCaisseCode,
  type Reservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { cn } from "@/lib/utils";

const CODE_STORAGE_KEY = "noisette-caisse-code";

export const Route = createFileRoute("/caisse")({
  head: () => ({
    meta: [
      { title: "Espace admin · Soirée Pizza Noizay" },
      {
        name: "description",
        content: "Espace réservé aux bénévoles pour suivre les réservations et les encaissements.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CaissePage,
});

function CaissePage() {
  const [code, setCode] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(CODE_STORAGE_KEY);
    if (stored) setCode(stored);
    setCheckingSession(false);
  }, []);

  if (checkingSession) {
    return (
      <PageBackground>
        <main className="flex min-h-[70vh] items-center justify-center px-6">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" aria-label="Chargement" />
        </main>
      </PageBackground>
    );
  }

  if (!code) {
    return (
      <PageBackground>
        <CaisseGate
          onUnlock={(value) => {
            window.sessionStorage.setItem(CODE_STORAGE_KEY, value);
            setCode(value);
          }}
        />
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <CaisseDashboard
        code={code}
        onLock={() => {
          window.sessionStorage.removeItem(CODE_STORAGE_KEY);
          setCode(null);
        }}
      />
    </PageBackground>
  );
}

function CaisseGate({ onUnlock }: { onUnlock: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isLocal = getBackendMode() === "local";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsChecking(true);

    try {
      const valid = await verifyCaisseCode(code);
      if (valid) {
        onUnlock(code.trim());
      } else {
        setError("Mot de passe incorrect.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mot de passe incorrect.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-3xl bg-card p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-primary">Espace admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Réservé aux bénévoles de la soirée. Entrez le mot de passe pour suivre les réservations.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
            }}
            placeholder="Mot de passe"
            type="password"
            autoComplete="current-password"
            aria-label="Mot de passe"
            className="h-11 bg-background text-center"
          />
          {error && (
            <p role="alert" className="text-sm font-bold text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={isChecking || !code.trim()}>
            {isChecking ? "Vérification…" : "Ouvrir l'admin"}
          </Button>
        </form>

        {isLocal && (
          <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            Mode démo local : le mot de passe est{" "}
            <code className="font-bold">{getLocalCaisseCode()}</code>. Configurez Supabase pour
            partager les réservations entre appareils.
          </p>
        )}
      </div>
    </main>
  );
}

function CaisseDashboard({ code, onLock }: { code: string; onLock: () => void }) {
  const queryClient = useQueryClient();
  const backend = getBackendMode();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");

  const reservationsQuery = useQuery({
    queryKey: ["reservations", backend],
    queryFn: () => listReservations(code),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      updateReservationStatus(code, id, status),
    onSuccess: ({ emailSent }) => {
      if (emailSent === true) {
        toast.success("Mail envoyé au client", {
          style: { background: "#16a34a", color: "#ffffff", border: "none" },
        });
      } else if (emailSent === false) {
        toast.error("L'e-mail n'a pas pu être envoyé au client");
      }
      return queryClient.invalidateQueries({ queryKey: ["reservations", backend] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReservation(code, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations", backend] }),
  });

  const reservations = useMemo(() => reservationsQuery.data ?? [], [reservationsQuery.data]);

  const stats = useMemo(() => {
    const active = reservations.filter((reservation) => reservation.status !== "cancelled");
    const totalCents = active.reduce((sum, reservation) => sum + reservation.totalCents, 0);
    const paidCents = active
      .filter((reservation) => reservation.status === "paid" || reservation.status === "picked_up")
      .reduce((sum, reservation) => sum + reservation.totalCents, 0);

    return {
      orders: active.length,
      pizzas: active.reduce((sum, reservation) => sum + reservationItemCount(reservation), 0),
      totalCents,
      paidCents,
      remainingCents: totalCents - paidCents,
    };
  }, [reservations]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      if (statusFilter !== "all" && reservation.status !== statusFilter) return false;
      if (!query) return true;

      return [
        reservation.customerName,
        reservation.phone,
        reservation.reference,
        reservation.childClass ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [reservations, search, statusFilter]);

  const actionError = statusMutation.error ?? deleteMutation.error;

  function handleDelete(reservation: Reservation) {
    const confirmed = window.confirm(
      `Supprimer définitivement la réservation ${reservation.reference} de ${reservation.customerName} ?`,
    );
    if (confirmed) deleteMutation.mutate(reservation.id);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-widest text-accent">Espace bénévoles</p>
          <h1 className="mt-1 text-4xl font-bold text-primary md:text-5xl">Admin de la soirée</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {EVENT.dateLabel} · {EVENT.locationName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              backend === "supabase"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900",
            )}
          >
            {backend === "supabase" ? "Supabase connecté" : "Mode démo local"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reservationsQuery.refetch()}
            disabled={reservationsQuery.isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", reservationsQuery.isFetching && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReservationsCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onLock}>
            <Lock className="h-4 w-4" />
            Verrouiller
          </Button>
        </div>
      </div>

      {backend === "local" && (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Mode démo :</strong> les réservations sont enregistrées dans ce navigateur
          uniquement. Ajoutez les variables <code>VITE_SUPABASE_URL</code>,{" "}
          <code>SUPABASE_URL</code> et <code>SUPABASE_SERVICE_ROLE_KEY</code> pour les partager
          entre appareils.
        </p>
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Commandes"
          value={String(stats.orders)}
        />
        <StatCard
          icon={<ChefHat className="h-5 w-5" />}
          label="Pizzas"
          value={String(stats.pizzas)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Encaissé"
          value={formatEuros(stats.paidCents)}
          hint={`sur ${formatEuros(stats.totalCents)}`}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Reste à encaisser"
          value={formatEuros(stats.remainingCents)}
        />
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un nom, un numéro…"
            aria-label="Rechercher une réservation"
            className="h-10 bg-background pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Toutes
          </FilterButton>
          {STATUS_ORDER.map((status) => (
            <FilterButton
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {STATUS_LABELS[status]}
            </FilterButton>
          ))}
        </div>
      </section>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm font-bold text-destructive"
        >
          {actionError instanceof Error ? actionError.message : "Une action a échoué."}
        </p>
      )}

      {reservationsQuery.isError && (
        <div className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-bold">Impossible de charger les réservations.</p>
          <p>
            {reservationsQuery.error instanceof Error
              ? reservationsQuery.error.message
              : "Erreur inconnue."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void reservationsQuery.refetch()}
          >
            Réessayer
          </Button>
        </div>
      )}

      {reservationsQuery.isLoading ? (
        <p className="mt-8 text-center text-muted-foreground">Chargement des réservations…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-card p-10 text-center shadow-md">
          <p className="text-4xl" aria-hidden>
            🍕
          </p>
          <p className="mt-3 text-lg font-bold">
            {reservations.length === 0
              ? "Aucune réservation pour le moment."
              : "Aucune réservation ne correspond à votre recherche."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les nouvelles commandes apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          {filtered.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              disabled={statusMutation.isPending || deleteMutation.isPending}
              onStatus={(id, status) => statusMutation.mutate({ id, status })}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {filtered.length} réservation{filtered.length > 1 ? "s" : ""} affichée
        {filtered.length > 1 ? "s" : ""} · actualisation automatique toutes les 15 secondes.
      </p>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-md">
      <span className="text-accent">{icon}</span>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-900",
  picked_up: "bg-sky-100 text-sky-900",
  cancelled: "bg-muted text-muted-foreground",
};

function ReservationCard({
  reservation,
  disabled,
  onStatus,
  onDelete,
}: {
  reservation: Reservation;
  disabled: boolean;
  onStatus: (id: string, status: ReservationStatus) => void;
  onDelete: (reservation: Reservation) => void;
}) {
  const created = new Date(reservation.createdAt);
  const createdLabel = Number.isNaN(created.getTime())
    ? ""
    : created.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <article
      className={cn(
        "rounded-3xl bg-card p-5 shadow-md",
        reservation.status === "cancelled" && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold text-primary">
              {reservation.reference}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                STATUS_STYLES[reservation.status],
              )}
            >
              {STATUS_LABELS[reservation.status]}
            </span>
          </div>
          <p className="mt-1 font-bold">
            {reservation.customerName}
            {reservation.childClass ? ` · ${reservation.childClass}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href={`tel:${reservation.phone}`}
              className="font-bold text-foreground hover:underline"
            >
              {reservation.phone}
            </a>
            {reservation.email ? ` · ${reservation.email}` : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-2xl font-bold text-primary">
            {formatEuros(reservation.totalCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Retrait {formatSlot(reservation.pickupSlot)}
            {createdLabel ? ` · créée le ${createdLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-background p-3 text-sm">
        <p>
          <strong>
            {reservationItemCount(reservation)} pizza
            {reservationItemCount(reservation) > 1 ? "s" : ""}
          </strong>{" "}
          · {itemsSummary(reservation)}
        </p>
        {reservation.notes && <p className="mt-1 text-muted-foreground">📝 {reservation.notes}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {reservation.status === "pending" && (
          <Button size="sm" onClick={() => onStatus(reservation.id, "paid")} disabled={disabled}>
            <Wallet className="h-4 w-4" />
            Marquer payée
          </Button>
        )}
        {(reservation.status === "pending" || reservation.status === "paid") && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onStatus(reservation.id, "picked_up")}
            disabled={disabled}
          >
            <CheckCircle2 className="h-4 w-4" />
            Marquer récupérée
          </Button>
        )}
        {reservation.status !== "cancelled" && reservation.status !== "picked_up" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatus(reservation.id, "cancelled")}
            disabled={disabled}
          >
            <XCircle className="h-4 w-4" />
            Annuler
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(reservation)}
          disabled={disabled}
          aria-label={`Supprimer la réservation ${reservation.reference}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </article>
  );
}
