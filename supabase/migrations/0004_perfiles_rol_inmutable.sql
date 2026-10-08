-- Cierra el escalamiento de privilegios de la migracion 0002:
-- `grant update on profiles to authenticated` daba UPDATE sobre TODAS las
-- columnas, incluida `rol`, y la policy `profiles_update_own` solo restringia
-- `id`. Un cliente autenticado podia hacer
--   PATCH /rest/v1/profiles?id=eq.<su uuid>  {"rol":"admin"}
-- con la anon key (que es publica) y convertirse en administrador.
--
-- Demostrado contra produccion antes de este fix: HTTP 200 con el rol cambiado.

-- 1) El cliente solo puede tocar su nombre, no su rol.
revoke update on profiles from anon;
revoke insert, update, delete on profiles from anon;
revoke update on profiles from authenticated;
grant update (nombre) on profiles to authenticated;

-- 2) Cinturon y tirantes: ningun camino de escritura cambia el rol.
create or replace function public.profiles_rol_inmutable()
returns trigger
language plpgsql
as $$
begin
  if new.rol is distinct from old.rol then
    raise exception 'El rol solo se cambia por SQL o por un administrador';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_rol_inmutable on public.profiles;
create trigger profiles_rol_inmutable
  before update on public.profiles
  for each row
  execute function public.profiles_rol_inmutable();

-- 3) Email en minusculas: el login lo normaliza y `orders_select_own`
--    compara con el email del JWT, asi que "Juan.Perez@Gmail.com" no
--    encontraba sus propios pedidos.
create or replace function public.normaliza_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists profiles_email_normalizado on public.profiles;
create trigger profiles_email_normalizado
  before insert or update on public.profiles
  for each row
  execute function public.normaliza_email();

-- 4) Un indice unico sobre lower(email) para que la normalizacion no pueda
--    crear dos cuentas con el mismo correo en distinta capitalizacion.
create unique index if not exists profiles_email_unico
  on public.profiles (lower(email));

-- Correccion: el trigger tambien bloquea a la API cuando `ensureAdmin` promote
-- una cuenta. Se permite cuando la peticion viene de la API (service_role),
-- que es el unico camino legitimate para cambiar un rol.
create or replace function public.profiles_rol_inmutable()
returns trigger
language plpgsql
as $$
begin
  if new.rol is distinct from old.rol
     and coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true)) <> 'service_role'
  then
    raise exception 'El rol solo se cambia por SQL o por la API administrativa';
  end if;
  return new;
end;
$$;
