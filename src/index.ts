export interface IntegrationOptions {
  tolerance?: number;
  maxEvaluations?: number;
  maxDepth?: number;
}
export interface IntegrationResult {
  value: number;
  errorEstimate: number;
  evaluations: number;
  converged: boolean;
  reason: 'tolerance' | 'evaluations' | 'depth' | 'resolution';
}
export function integrate(
  fn: (x: number) => number,
  a: number,
  b: number,
  options: IntegrationOptions = {},
): IntegrationResult {
  const tolerance = options.tolerance ?? 1e-8,
    maxEvaluations = options.maxEvaluations ?? 10001,
    maxDepth = options.maxDepth ?? 30;
  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    !Number.isFinite(b - a) ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0
  )
    throw new RangeError('Finite bounds, span and positive tolerance required.');
  if (
    !Number.isInteger(maxEvaluations) ||
    maxEvaluations < 3 ||
    maxEvaluations > 1_000_001 ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 50
  )
    throw new RangeError('Invalid evaluation/depth budget.');
  let evaluations = 0;
  const evaluate = (x: number) => {
    evaluations++;
    const y = fn(x);
    if (!Number.isFinite(y)) throw new RangeError('Callback returned nonfinite value.');
    return y;
  };
  const finite = (x: number) => {
    if (!Number.isFinite(x)) throw new RangeError('Quadrature overflow.');
    return x;
  };
  const midpoint = (x: number, y: number) => x + (y - x) / 2;
  const simpson = (l: number, r: number, fl: number, fm: number, fr: number) =>
    finite((r - l) * (fl / 6 + fm * (2 / 3) + fr / 6));
  if (a === b)
    return { value: 0, errorEstimate: 0, evaluations: 0, converged: true, reason: 'tolerance' };
  const m = midpoint(a, b),
    fa = evaluate(a),
    fm = evaluate(m),
    fb = evaluate(b),
    initial = simpson(a, b, fa, fm, fb);
  let reason: IntegrationResult['reason'] = 'tolerance';
  const walk = (
    l: number,
    r: number,
    fl: number,
    fc: number,
    fr: number,
    whole: number,
    tol: number,
    depth: number,
  ): [number, number] => {
    const c = midpoint(l, r),
      lm = midpoint(l, c),
      rm = midpoint(c, r);
    if (lm === l || rm === r || lm === c || rm === c) {
      reason = 'resolution';
      return [whole, Infinity];
    }
    if (evaluations + 2 > maxEvaluations) {
      reason = 'evaluations';
      return [whole, Infinity];
    }
    const flm = evaluate(lm),
      frm = evaluate(rm);
    const left = simpson(l, c, fl, flm, fc),
      right = simpson(c, r, fc, frm, fr),
      sum = finite(left + right),
      delta = finite(sum - whole),
      error = Math.abs(delta) / 15;
    if (error <= tol) return [finite(sum + delta / 15), error];
    if (depth === maxDepth) {
      reason = 'depth';
      return [sum, error];
    }
    const p = walk(l, c, fl, flm, fc, left, tol / 2, depth + 1);
    const q = walk(c, r, fc, frm, fr, right, tol / 2, depth + 1);
    return [finite(p[0] + q[0]), p[1] + q[1]];
  };
  const [value, errorEstimate] = walk(a, b, fa, fm, fb, initial, tolerance, 0);
  return { value, errorEstimate, evaluations, converged: reason === 'tolerance', reason };
}
