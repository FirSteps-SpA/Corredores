-- Spec 1 (esquema-y-rls): el público lee lo que no es borrador; solo el admin escribe.

-- security definer: `admins` no es legible por el público. search_path vacío para que nadie
-- pueda suplantar `admins` con un objeto en otro esquema.
create function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

-- Grants explícitos: no dependemos de los privilegios por defecto del esquema public.
-- RLS sigue siendo la barrera real.
revoke all on public.propiedades, public.propiedad_fotos, public.admins from anon, authenticated;
grant select on public.propiedades, public.propiedad_fotos to anon, authenticated;
grant insert, update, delete on public.propiedades, public.propiedad_fotos to authenticated;
grant select on public.admins to authenticated;

alter table public.propiedades enable row level security;
alter table public.propiedad_fotos enable row level security;
alter table public.admins enable row level security;

-- propiedades
create policy propiedades_select on public.propiedades for select to anon, authenticated
  using (estado <> 'borrador' or (select public.es_admin()));

create policy propiedades_insert on public.propiedades for insert to authenticated
  with check ((select public.es_admin()));

create policy propiedades_update on public.propiedades for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy propiedades_delete on public.propiedades for delete to authenticated
  using ((select public.es_admin()));

-- propiedad_fotos: visibles si su propiedad lo es
create policy propiedad_fotos_select on public.propiedad_fotos for select to anon, authenticated
  using (
    (select public.es_admin())
    or exists (
      select 1 from public.propiedades p
      where p.id = propiedad_id and p.estado <> 'borrador'
    )
  );

create policy propiedad_fotos_insert on public.propiedad_fotos for insert to authenticated
  with check ((select public.es_admin()));

create policy propiedad_fotos_update on public.propiedad_fotos for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy propiedad_fotos_delete on public.propiedad_fotos for delete to authenticated
  using ((select public.es_admin()));

-- admins: cada uno ve solo su fila; sin policies de escritura.
create policy admins_select on public.admins for select to authenticated
  using (user_id = (select auth.uid()));
