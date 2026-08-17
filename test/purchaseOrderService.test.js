import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePurchaseOrder } from '../src/services/purchaseOrderService.js';

test('accepts a normal purchase order', () => {
  assert.deepEqual(validatePurchaseOrder({ amount: 500 }), { ok: true });
});

test('rejects zero or negative amounts', () => {
  assert.equal(validatePurchaseOrder({ amount: 0 }).ok, false);
  assert.equal(validatePurchaseOrder({ amount: -10 }).ok, false);
});

test('requires approval for orders above 10000', () => {
  assert.deepEqual(
    validatePurchaseOrder({ amount: 15000 }),
    { ok: false, reason: 'High-value orders require approval' }
  );
});

test('accepts high-value orders when approved', () => {
  assert.deepEqual(
    validatePurchaseOrder({ amount: 15000, approvedBy: 'manager@example.test' }),
    { ok: true }
  );
});
