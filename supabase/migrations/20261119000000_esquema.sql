-- Spec 1 (esquema-y-rls): tablas del catálogo de propiedades.
-- Las policies van en 20261119000001_rls.sql y el bucket en 20261119000002_storage.sql.

create table public.propiedades (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  codigo text unique,
  titulo text not null,
  descripcion text,
  operacion text not null check (operacion in ('venta', 'arriendo')),
  tipo text not null
    check (tipo in ('casa', 'departamento', 'oficina', 'local', 'terreno', 'parcela', 'bodega')),
  precio numeric not null check (precio >= 0),
  moneda text not null check (moneda in ('CLP', 'UF')),
  gastos_comunes numeric check (gastos_comunes >= 0),
  region text,
  comuna text not null,
  sector text,
  direccion text,
  -- Si es false, el sitio muestra solo sector/comuna y una ubicación aproximada.
  mostrar_direccion boolean not null default false,
  lat double precision,
  lng double precision,
  dormitorios int check (dormitorios >= 0),
  banos int check (banos >= 0),
  estacionamientos int check (estacionamientos >= 0),
  bodegas int check (bodegas >= 0),
  m2_utiles numeric check (m2_utiles >= 0),
  m2_totales numeric check (m2_totales >= 0),
  -- Piscina, quincho, amoblado… Solo presencia; si alguna necesita un valor, pasa a columna.
  caracteristicas text[] not null default '{}',
  estado text not null default 'borrador'
    check (estado in ('borrador', 'publicada', 'reservada', 'vendida', 'arrendada')),
  destacada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index propiedades_estado_idx on public.propiedades (estado);

-- Sin unique (propiedad_id, orden): reordenar arrastrando chocaría en cada paso.
-- La galería se ordena con `order by orden, id`.
create table public.propiedad_fotos (
  id uuid primary key default gen_random_uuid(),
  propiedad_id uuid not null references public.propiedades (id) on delete cascade,
  -- Ruta en el bucket `propiedades`: <propiedad_id>/<uuid>.<ext>
  path text not null,
  orden int not null default 0,
  alt text
);

create index propiedad_fotos_propiedad_orden_idx on public.propiedad_fotos (propiedad_id, orden);

-- Cuentas con permiso de administración. Las altas se hacen con SQL fuera de la app.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger propiedades_updated_at
  before update on public.propiedades
  for each row execute function public.set_updated_at();
