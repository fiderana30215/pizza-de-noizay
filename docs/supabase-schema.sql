-- Schéma de la table des réservations — Pizza Night Noisette
--
-- À exécuter dans l'éditeur SQL de Supabase :
--   Dashboard Supabase → SQL Editor → New query → coller → Run
-- (ou demander à Lovable de créer cette table).
--
-- Aucune policy publique n'est nécessaire : le site passe par des server
-- functions qui utilisent la clé service role côté serveur.

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  child_class text,
  pickup_slot text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'picked_up', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_created_at_idx
  on public.reservations (created_at desc);

create index if not exists reservations_status_idx
  on public.reservations (status);

-- La clé service role contourne RLS : on garde donc RLS activé sans policy publique.
alter table public.reservations enable row level security;
