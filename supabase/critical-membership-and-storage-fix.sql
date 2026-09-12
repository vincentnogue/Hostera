-- =============================================================================
-- Hostera — Critical fix: organization creation never granted membership
-- =============================================================================
-- Discovered live: `memberships` has RLS policies for SELECT (own rows)
-- and an ALL policy for platform admins, but NO INSERT policy for regular
-- users at all. That means a user creating a new Organization during
-- onboarding had no way to ever become a member of it — so the very next
-- call in the same flow, Property.create({organization_id}), would fail
-- RLS (is_org_member() returns false for zero membership rows). Nobody
-- could have completed onboarding successfully against this database
-- until this trigger existed.
-- =============================================================================

create or replace function handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into memberships (user_id, organization_id, role)
  values (auth.uid(), new.id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_organization_created on organization;
create trigger on_organization_created
  after insert on organization
  for each row
  execute function handle_new_organization();

-- =============================================================================
-- Storage buckets — neither existed at all, so every photo upload
-- (property cover photos, room type photos) was failing, and there was
-- nowhere for KYC documents to go either.
-- =============================================================================

insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;

drop policy if exists "public can read uploads" on storage.objects;
create policy "public can read uploads" on storage.objects for select using (bucket_id = 'uploads');

drop policy if exists "authenticated can upload to uploads" on storage.objects;
create policy "authenticated can upload to uploads" on storage.objects for insert to authenticated with check (bucket_id = 'uploads');

drop policy if exists "authenticated can update uploads" on storage.objects;
create policy "authenticated can update uploads" on storage.objects for update to authenticated using (bucket_id = 'uploads');

-- Private bucket for KYC documents (business registration, manager ID,
-- manager selfie) — genuinely sensitive PII. Files are uploaded with
-- path "{organization_id}/{filename}"; storage.foldername(name) extracts
-- that first segment so the policy can check org membership on it.
insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false) on conflict (id) do nothing;

drop policy if exists "org members can upload their own kyc documents" on storage.objects;
create policy "org members can upload their own kyc documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents' and is_org_member((storage.foldername(name))[1]::uuid));

drop policy if exists "org members or platform admins can read kyc documents" on storage.objects;
create policy "org members or platform admins can read kyc documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and (is_platform_admin() or is_org_member((storage.foldername(name))[1]::uuid)));
