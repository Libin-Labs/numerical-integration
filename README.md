# @lp-labs/numerical-integration

Adaptive Simpson quadrature with absolute error estimates, hard evaluation/depth budgets and explicit nonconvergence diagnostics.

Standalone Node.js >=18 package. ESM and CommonJS with separate strict TypeScript declarations. No runtime, peer or sibling dependencies.

## Install

```sh
npm install @lp-labs/numerical-integration
```

## Example

```js
import { integrate } from '@lp-labs/numerical-integration';
const result = integrate((x) => x * x, 0, 1, { tolerance: 1e-10 });
if (!result.converged) throw new Error(result.reason);
console.log(result.value); // approximately 1/3
```

## API, customization, numerical behavior and limits

integrate(fn,a,b,options) integrates finite bounds with finite b-a, including reversed intervals. IntegrationOptions defaults: tolerance=1e-8 (strictly positive finite absolute estimate target), maxEvaluations=10001 (integer 3..1000001), maxDepth=30 (integer 0..50). Zero-width intervals return zero without calling fn. Nonzero intervals initially evaluate endpoints and midpoint (3 calls), then reuse values while evaluating two new quarter points per subdivision. Richardson correction (S_left+S_right-S_parent)/15 supplies the corrected value and local errorEstimate; child tolerances split equally. IntegrationResult includes value, summed errorEstimate, evaluations, converged and reason: tolerance, evaluations, depth, resolution. Budget exhaustion or floating-point subdivision stagnation returns converged=false with the best available partial estimate, never silent success; errorEstimate is Infinity when refinement was unavailable. Depth exhaustion returns an estimated finite error when possible. Always inspect converged before accepting value. The estimate is not a rigorous bound: convergence means the Simpson estimator met tolerance, not that arbitrary discontinuous/oscillatory/singular callbacks were integrated correctly. Smoothness and sufficient sampling are caller responsibilities. User exceptions propagate unchanged; nonfinite callback values or intermediate quadrature overflow throw RangeError. No callback retries or side-effect rollback. O(maxEvaluations) time and O(maxDepth) stack; actual synchronous callback cost is caller-controlled.

## Full declarations

```ts
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
export declare function integrate(
  fn: (x: number) => number,
  a: number,
  b: number,
  options?: IntegrationOptions,
): IntegrationResult;
```

## Development

```sh
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

Tests use Node's built-in runner and include independent or analytic reference cases. No runtime global browser access, I/O or hidden dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
