import { supabase } from '@/lib/supabaseClient';

// Real, non-PII availability data — reservation itself has no public/
// cross-guest read policy (correctly: it holds guest names, emails,
// phones, and now also guests' own reservation access is scoped to only
// their own rows), so this reads from the public_availability view
// (property/room/dates/status only) instead. Used by every booking flow
// — the public booking page and the authenticated Guest Dashboard's own
// booking form — both to render calendars and to re-validate right
// before creating a reservation, so nobody can be sold a room that's
// already sold out.
export async function fetchPublicAvailability(propertyId) {
  const { data, error } = await supabase
    .from('public_availability')
    .select('*')
    .eq('property_id', propertyId);
  if (error) throw error;
  return data || [];
}
