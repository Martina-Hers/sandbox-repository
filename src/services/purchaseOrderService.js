export function validatePurchaseOrder(order) {
  if (!order || typeof order !== 'object') {
    return { ok: false, reason: 'Order is required' };
  }

  const { amount, approvedBy } = order;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'Amount must be a positive number' };
  }

  if (amount > 12000 && !approvedBy) {
    return { ok: false, reason: 'High-value orders require approval' };
  }

  return { ok: true };
}
