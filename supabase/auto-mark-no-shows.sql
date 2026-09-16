-- =============================================================================
-- Hostera — real scheduled automation: auto-mark no-shows
-- =============================================================================
-- Spec section 40 (background jobs, scheduled tasks) and section 44
-- (reservation state machine's controlled No Show transition). Runs daily
-- via pg_cron, idempotent (only ever touches rows still in
-- confirmed/pending with a past check-in date — safe to re-run), and
-- tenant-aware (one notification per affected organization, not global).
-- =============================================================================

create extension if not exists pg_cron;

create or replace function auto_mark_no_shows()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org_rec record;
  affected_count integer;
begin
  for org_rec in
    select organization_id, count(*) as cnt
    from reservation
    where (data->>'status') in ('confirmed', 'pending')
      and (data->>'check_in')::date < current_date
    group by organization_id
  loop
    update reservation
    set data = data || jsonb_build_object('status', 'no_show'),
        updated_at = now()
    where organization_id = org_rec.organization_id
      and (data->>'status') in ('confirmed', 'pending')
      and (data->>'check_in')::date < current_date;

    get diagnostics affected_count = row_count;

    if affected_count > 0 then
      insert into notification (organization_id, data)
      values (
        org_rec.organization_id,
        jsonb_build_object(
          'title', 'No-shows marked automatically',
          'message', affected_count || ' reservation(s) past check-in date with no check-in were automatically marked as no-show.',
          'type', 'automation',
          'read', false
        )
      );
    end if;
  end loop;
end;
$$;

select cron.schedule(
  'auto-mark-no-shows-daily',
  '0 3 * * *',
  $$select auto_mark_no_shows();$$
);
