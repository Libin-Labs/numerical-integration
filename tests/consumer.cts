import * as api from '@lp-labs/numerical-integration';
const options: api.IntegrationOptions = { tolerance: 1e-8, maxDepth: 20, maxEvaluations: 1001 };
const result: api.IntegrationResult = api.integrate((x) => x * x, 0, 1, options);
void result;
// @ts-expect-error Invalid API input must be rejected.
api.integrate((x) => String(x), 0, 1);
