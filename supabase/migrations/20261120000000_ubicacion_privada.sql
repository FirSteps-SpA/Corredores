-- Spec 8 (mapa): la dirección y la ubicación exacta de una propiedad con mostrar_direccion = false
-- no deben llegar al público. RLS filtra filas, no columnas: con la clave publishable se podía leer
-- `direccion` de cualquier propiedad visible. El sitio público pasa a leer la vista
-- propiedades_publicas y `anon` pierde acceso a direccion, lat y lng de la tabla.

-- Sal secreta para la ubicación aproximada, en un esquema que la API no expone. Sin ella, el
-- desplazamiento no se puede recalcular desde el id (que es público).
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table privado.ajustes (
  clave text primary key,
  valor text not null
);
insert into privado.ajustes (clave, valor) values ('sal_ubicacion', gen_random_uuid()::text);

-- Punto desplazado de forma determinista (el mismo en cada lectura, para que promediar no revele el
-- punto real) hasta ±0,0025° de latitud y su equivalente en longitud (≈ ±280 m), redondeado a 4
-- decimales. Distancia máxima al punto real ≈ 400 m: un círculo de 500 m siempre lo contiene.
create function privado.desplazamiento(p_id uuid)
returns double precision[] language sql stable security definer set search_path = '' as $$
  with h as (
    select md5(p_id::text || (select valor from privado.ajustes where clave = 'sal_ubicacion')) as v
  )
  select array[
    ('x' || substr(v, 1, 8))::bit(32)::int / 2147483648.0,
    ('x' || substr(v, 9, 8))::bit(32)::int / 2147483648.0
  ]::double precision[]
  from h;
$$;

-- Vista del sitio público: del dueño (sin security_invoker) porque lee columnas que anon ya no
-- puede leer; por eso filtra los borradores ella misma. El advisor de Supabase la marca como
-- "security definer view": es intencional.
create view public.propiedades_publicas as
select
  p.id, p.slug, p.codigo, p.titulo, p.descripcion, p.operacion, p.tipo, p.precio, p.moneda,
  p.gastos_comunes, p.region, p.comuna, p.sector,
  case when p.mostrar_direccion then p.direccion end as direccion,
  p.mostrar_direccion,
  case
    when p.lat is null or p.lng is null then null
    when p.mostrar_direccion then p.lat
    else round((p.lat + d.v[1] * 0.0025)::numeric, 4)::double precision
  end as lat,
  case
    when p.lat is null or p.lng is null then null
    when p.mostrar_direccion then p.lng
    else round((p.lng + d.v[2] * 0.0025 / cos(radians(p.lat)))::numeric, 4)::double precision
  end as lng,
  p.dormitorios, p.banos, p.estacionamientos, p.bodegas, p.m2_utiles, p.m2_totales,
  p.caracteristicas, p.estado, p.destacada, p.created_at, p.updated_at
from public.propiedades p
cross join lateral (select privado.desplazamiento(p.id) as v) d
where p.estado <> 'borrador';

grant select on public.propiedades_publicas to anon, authenticated;

-- anon: todas las columnas de la tabla menos direccion, lat y lng. La policy de propiedad_fotos
-- consulta id y estado, que siguen permitidas.
revoke select on public.propiedades from anon;
grant select (
  id, slug, codigo, titulo, descripcion, operacion, tipo, precio, moneda, gastos_comunes, region,
  comuna, sector, mostrar_direccion, dormitorios, banos, estacionamientos, bodegas, m2_utiles,
  m2_totales, caracteristicas, estado, destacada, created_at, updated_at
) on public.propiedades to anon;
