import type { Context } from 'hono'
import type { TMDBAPI } from '@poplist/shared'
import * as tmdb from '../services/tmdb.service.js'
import type { AppEnv } from '../app.js'

type C = Context<AppEnv>

function param(c: C, name: string): string {
  return c.req.param(name) as string
}

export const getTrending = async (c: C) => {
  const timeWindow = param(c, 'timeWindow')

  if (timeWindow !== 'day' && timeWindow !== 'week') {
    return c.json({ error: 'timeWindow must be "day" or "week"' }, 400)
  }

  try {
    const data = (await tmdb.getTrending(
      timeWindow,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1'
    )) as TMDBAPI.TrendingResponse
    return c.json(data satisfies TMDBAPI.TrendingResponse)
  } catch (error) {
    console.error('Error fetching trending:', error)
    return c.json({ error: 'Failed to fetch trending content' }, 500)
  }
}

export const searchExplore = async (c: C) => {
  const type = param(c, 'type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  const query = c.req.query('query') ?? ''
  if (!query.trim()) {
    return c.json({ error: 'query is required' }, 400)
  }

  const withGenresStr = c.req.query('with_genres') ?? ''
  const withGenres = withGenresStr
    ? withGenresStr
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n))
    : []

  const yearFromStr = c.req.query('year_from')
  const yearToStr = c.req.query('year_to')
  const yearFromNum = yearFromStr ? Number(yearFromStr) : undefined
  const yearToNum = yearToStr ? Number(yearToStr) : undefined

  const sortByParam = c.req.query('sort_by') as 'popularity' | 'vote_average' | undefined

  try {
    const data = await tmdb.searchExplore({
      type,
      query: query.trim(),
      language: c.req.query('language') || 'fr-FR',
      uiPage: Number(c.req.query('page') || '1') || 1,
      withGenres,
      yearFrom: Number.isFinite(yearFromNum) ? yearFromNum : undefined,
      yearTo: Number.isFinite(yearToNum) ? yearToNum : undefined,
      sortBy: sortByParam,
    })
    return c.json(data satisfies TMDBAPI.SearchExploreResponse)
  } catch (error) {
    console.error('Error searching explore:', error)
    return c.json({ error: 'Failed to search content' }, 500)
  }
}

export const discover = async (c: C) => {
  const type = param(c, 'type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const fetchParams: Record<string, string> = {
      language: c.req.query('language') || 'fr-FR',
      page: c.req.query('page') || '1',
      region: c.req.query('region') || 'FR',
      sort_by: c.req.query('sort_by') || 'popularity.desc',
    }

    const withGenres = c.req.query('with_genres')
    const voteCountGte = c.req.query('vote_count.gte')
    const primaryReleaseDateGte = c.req.query('primary_release_date.gte')
    const primaryReleaseDateLte = c.req.query('primary_release_date.lte')
    const firstAirDateGte = c.req.query('first_air_date.gte')
    const firstAirDateLte = c.req.query('first_air_date.lte')

    if (withGenres) fetchParams.with_genres = withGenres
    if (voteCountGte) fetchParams['vote_count.gte'] = voteCountGte

    if (type === 'movie') {
      if (primaryReleaseDateGte) fetchParams['primary_release_date.gte'] = primaryReleaseDateGte
      if (primaryReleaseDateLte) fetchParams['primary_release_date.lte'] = primaryReleaseDateLte
    } else {
      if (firstAirDateGte) fetchParams['first_air_date.gte'] = firstAirDateGte
      if (firstAirDateLte) fetchParams['first_air_date.lte'] = firstAirDateLte
    }

    const data = (await tmdb.discover(type, fetchParams)) as TMDBAPI.DiscoverResponse
    return c.json(data satisfies TMDBAPI.DiscoverResponse)
  } catch (error) {
    console.error('Error discovering content:', error)
    return c.json({ error: 'Failed to discover content' }, 500)
  }
}

export const getGenres = async (c: C) => {
  const type = param(c, 'type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = (await tmdb.getGenres(
      type,
      c.req.query('language') || 'fr-FR'
    )) as TMDBAPI.GenresResponse
    return c.json(data satisfies TMDBAPI.GenresResponse)
  } catch (error) {
    console.error('Error fetching genres:', error)
    return c.json({ error: 'Failed to fetch genres' }, 500)
  }
}

export const getPopular = async (c: C) => {
  const type = param(c, 'type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = (await tmdb.getPopular(
      type,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1',
      c.req.query('region') || 'FR'
    )) as TMDBAPI.PopularResponse
    return c.json(data satisfies TMDBAPI.PopularResponse)
  } catch (error) {
    console.error('Error fetching popular:', error)
    return c.json({ error: 'Failed to fetch popular content' }, 500)
  }
}

export const getTopRated = async (c: C) => {
  const type = param(c, 'type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = (await tmdb.getTopRated(
      type,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1',
      c.req.query('region') || 'FR'
    )) as TMDBAPI.TopRatedResponse
    return c.json(data satisfies TMDBAPI.TopRatedResponse)
  } catch (error) {
    console.error('Error fetching top rated:', error)
    return c.json({ error: 'Failed to fetch top rated content' }, 500)
  }
}

export const getProviders = async (c: C) => {
  const type = param(c, 'type')
  const id = param(c, 'id')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = (await tmdb.getProviders(type, id)) as TMDBAPI.ProvidersResponse
    return c.json(data satisfies TMDBAPI.ProvidersResponse)
  } catch (error) {
    console.error('Error fetching watch providers:', error)
    return c.json({ error: 'Failed to fetch watch providers' }, 500)
  }
}

export const getSimilar = async (c: C) => {
  const type = param(c, 'type')
  const id = param(c, 'id')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = (await tmdb.getSimilar(
      type,
      id,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1'
    )) as TMDBAPI.SimilarResponse
    return c.json(data satisfies TMDBAPI.SimilarResponse)
  } catch (error) {
    console.error('Error fetching similar:', error)
    return c.json({ error: 'Failed to fetch similar content' }, 500)
  }
}
