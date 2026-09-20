// Invoice generation on checkout.
//
// Before this, Invoice was read in two places (Finance.jsx's ledger,
// GuestPortal.jsx's "your invoices" list) but created literally nowhere —
// every reservation could complete its whole lifecycle and neither screen
// would ever show anything. This is the fix: called from every checkout
// action (FrontDesk.jsx, RoomRack.jsx) so a real Invoice row exists the
// moment a stay actually ends.
const db = () => globalThis.__B44_DB__;

export async function generateInvoiceForReservation(reservation) {
  if (!reservation?.id) return null;
  try {
    // Idempotent: FrontDesk and RoomRack both call this on the same
    // "check out" action for different UIs — never double-invoice the
    // same stay if it's somehow triggered twice.
    const existing = await db().entities.Invoice.list().catch(() => []);
    if ((existing || []).some(i => i.reservation_id === reservation.id)) return null;

    const total = Number(reservation.total_amount) || 0;
    const paid = Number(reservation.paid_amount) || 0;
    const status = total > 0 && paid >= total ? 'paid' : paid > 0 ? 'partial' : 'issued';

    return await db().entities.Invoice.create({
      organization_id: reservation.organization_id,
      property_id: reservation.property_id,
      reservation_id: reservation.id,
      guest_id: reservation.guest_id,
      invoice_number: `INV-${reservation.reservation_number || Date.now()}`,
      issue_date: new Date().toISOString().slice(0, 10),
      total,
      paid_amount: paid,
      currency: reservation.currency,
      status,
    });
  } catch (e) {
    // Best-effort: a failed invoice generation should never block the
    // guest actually being checked out.
    console.error(e);
    return null;
  }
}
