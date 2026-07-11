/**
 * withRetry — exponential backoff for source fetches (P2 Stage 1;
 * Principle 7: never crash on a transient network fault).
 */
export async function withRetry(fn, { retries = 2, baseDelayMs = 800, label = 'fetch' } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** attempt;
        console.log(
          `  retry ${attempt + 1}/${retries} for ${label} in ${delay}ms (${err.message})`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}
