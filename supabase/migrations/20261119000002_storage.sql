-- Spec 1 (esquema-y-rls): bucket de fotos de propiedades.
-- Público: las URLs /storage/v1/object/public/… no pasan por RLS. Por eso no hay policy de
-- select para el público: así nadie puede listar el bucket (revelaría fotos de borradores).
-- El admin sí necesita select para upsert, borrar y listar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('propiedades', 'propiedades', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy propiedades_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'propiedades' and (select public.es_admin()));

create policy propiedades_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'propiedades' and (select public.es_admin()));

create policy propiedades_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'propiedades' and (select public.es_admin()))
  with check (bucket_id = 'propiedades' and (select public.es_admin()));

create policy propiedades_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'propiedades' and (select public.es_admin()));
