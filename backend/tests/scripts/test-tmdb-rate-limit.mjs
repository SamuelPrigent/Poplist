/**
 * TMDB Rate Limit Test Script
 *
 * Test 1: Cache enabled (default) - 60 req/sec should all be served from cache
 * Test 2: Cache disabled (via flag) - 60 req/sec should trigger bottleneck
 *
 * Usage:
 *   npm run test:rate-limit           # Test with cache (should see CACHE HIT)
 *   npm run test:rate-limit -- --no-cache  # Test without cache (should see QUEUE messages)
 */

const API_BASE = process.env.API_URL || 'http://localhost:3456'
const REQUESTS_PER_SECOND = 60
const TEST_DURATION_SECONDS = 3

// Various endpoints to test (different types of requests)
const ENDPOINTS = [
  '/tmdb/trending/day',
  '/tmdb/trending/week',
  '/tmdb/movie/popular',
  '/tmdb/tv/popular',
  '/tmdb/movie/top_rated',
  '/tmdb/tv/top_rated',
  '/tmdb/genre/movie/list',
  '/tmdb/genre/tv/list',
  '/tmdb/discover/movie?with_genres=28',
  '/tmdb/discover/movie?with_genres=35',
  '/tmdb/discover/tv?with_genres=16',
  '/tmdb/movie/550/similar', // Fight Club
  '/tmdb/movie/680/similar', // Pulp Fiction
  '/tmdb/tv/1399/similar', // Game of Thrones
  '/tmdb/movie/550/providers',
  '/tmdb/tv/1399/providers',
]

async function makeRequest(endpoint) {
  const start = Date.now()
  try {
    const response = await fetch(`${API_BASE}${endpoint}`)
    return {
      endpoint,
      status: response.status,
      duration: Date.now() - start,
      success: response.ok,
    }
  } catch (error) {
    return {
      endpoint,
      status: 0,
      duration: Date.now() - start,
      success: false,
    }
  }
}

async function runTest(testName, totalRequests) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TEST: ${testName}`)
  console.log(`Sending ${totalRequests} requests (${REQUESTS_PER_SECOND}/sec for ${TEST_DURATION_SECONDS}s)`)
  console.log(`${'='.repeat(60)}\n`)

  const results = []
  const startTime = Date.now()

  // Send requests in batches
  for (let second = 0; second < TEST_DURATION_SECONDS; second++) {
    const batchStart = Date.now()
    const promises = []

    for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
      // Rotate through endpoints
      const endpoint = ENDPOINTS[i % ENDPOINTS.length]
      promises.push(makeRequest(endpoint))
    }

    const batchResults = await Promise.all(promises)
    results.push(...batchResults)

    // Wait for the rest of the second if needed
    const batchDuration = Date.now() - batchStart
    if (batchDuration < 1000 && second < TEST_DURATION_SECONDS - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - batchDuration))
    }

    console.log(`Second ${second + 1}: ${batchResults.filter((r) => r.success).length}/${REQUESTS_PER_SECOND} successful`)
  }

  const totalDuration = Date.now() - startTime

  // Summary
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const maxDuration = Math.max(...results.map((r) => r.duration))
  const minDuration = Math.min(...results.map((r) => r.duration))

  console.log(`\n${'─'.repeat(60)}`)
  console.log('RESULTS:')
  console.log(`  Total requests: ${results.length}`)
  console.log(`  Successful: ${successful} (${((successful / results.length) * 100).toFixed(1)}%)`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total duration: ${totalDuration}ms`)
  console.log(`  Avg response time: ${avgDuration.toFixed(0)}ms`)
  console.log(`  Min response time: ${minDuration}ms`)
  console.log(`  Max response time: ${maxDuration}ms`)
  console.log(`${'─'.repeat(60)}\n`)

  // Status code breakdown
  const statusCodes = {}
  for (const r of results) {
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1
  }
  console.log('Status codes:')
  for (const [code, count] of Object.entries(statusCodes)) {
    console.log(`  ${code}: ${count}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const noCache = args.includes('--no-cache')

  console.log('\n🧪 TMDB Rate Limit Test')
  console.log(`API: ${API_BASE}`)
  console.log(`Mode: ${noCache ? 'NO CACHE (testing bottleneck)' : 'WITH CACHE (testing cache)'}`)

  if (noCache) {
    console.log('\n⚠️  Pour tester sans cache, désactivez temporairement le cache dans tmdb_service.ts:')
    console.log('   Dans fetchWithCache(), commentez le check cache:')
    console.log('   // const cached = await getFromCache(cacheKey)')
    console.log('   // if (cached !== null) return cached as T')
  }

  const totalRequests = REQUESTS_PER_SECOND * TEST_DURATION_SECONDS

  await runTest(noCache ? 'Sans cache (bottleneck)' : 'Avec cache', totalRequests)

  console.log('\n✅ Test terminé!')
  console.log('\nVérifiez les logs du serveur pour voir:')
  if (noCache) {
    console.log('  - [TMDB QUEUE] Request #X executing | Queued: Y | Running: Z')
    console.log('  - Les requêtes devraient être limitées à ~40/sec')
  } else {
    console.log('  - [CACHE HIT] tmdb:/endpoint...')
    console.log('  - Toutes les requêtes devraient être servies depuis le cache')
  }
}

main().catch(console.error)
