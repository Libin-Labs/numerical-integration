import assert from 'node:assert/strict';
import test from 'node:test';
import * as api from '../dist/esm/index.js';
const close = (a, b, tol = 1e-12) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
test('analytic polynomial quadrature', () => {
  for (let degree = 0; degree <= 6; degree++) {
    const r = api.integrate((x) => x ** degree, 0, 1, { tolerance: 1e-10 });
    assert.equal(r.converged, true);
    close(r.value, 1 / (degree + 1), 1e-9);
    assert.ok(r.errorEstimate <= 1e-10);
  }
});
test('sine and reversed intervals', () => {
  const r = api.integrate(Math.sin, 0, Math.PI, { tolerance: 1e-10 });
  assert.equal(r.converged, true);
  close(r.value, 2, 1e-9);
  close(api.integrate((x) => x * x, 1, 0).value, -1 / 3);
});
test('evaluation budget exact', () => {
  let calls = 0;
  const r = api.integrate(
    (x) => {
      calls++;
      return Math.exp(x);
    },
    0,
    1,
    { maxEvaluations: 3 },
  );
  assert.equal(calls, 3);
  assert.equal(r.evaluations, 3);
  assert.equal(r.converged, false);
  assert.equal(r.reason, 'evaluations');
  assert.equal(r.errorEstimate, Infinity);
});
test('depth exhaustion and zero interval', () => {
  const r = api.integrate(Math.exp, 0, 1, { maxDepth: 0, tolerance: 1e-20 });
  assert.equal(r.converged, false);
  assert.equal(r.reason, 'depth');
  assert.equal(r.evaluations, 5);
  let calls = 0;
  assert.equal(
    api.integrate(
      () => {
        calls++;
        return 1;
      },
      2,
      2,
    ).value,
    0,
  );
  assert.equal(calls, 0);
});
test('callback errors and overflow', () => {
  const error = new Error('original');
  assert.throws(
    () =>
      api.integrate(
        () => {
          throw error;
        },
        0,
        1,
      ),
    (e) => e === error,
  );
  assert.throws(() => api.integrate(() => NaN, 0, 1), RangeError);
  assert.throws(() => api.integrate(() => 1e308, 0, 10), RangeError);
});
test('invalid options and resolution diagnostics', () => {
  for (const opts of [
    { tolerance: 0 },
    { tolerance: NaN },
    { maxDepth: 51 },
    { maxEvaluations: 2 },
    { maxEvaluations: 3.5 },
  ])
    assert.throws(() => api.integrate((x) => x, 0, 1, opts), RangeError);
  assert.throws(() => api.integrate((x) => x, -1e308, 1e308));
  const r = api.integrate(() => 1, 1, 1 + Number.EPSILON, { tolerance: 1e-30 });
  assert.equal(r.converged, false);
  assert.equal(r.reason, 'resolution');
});
