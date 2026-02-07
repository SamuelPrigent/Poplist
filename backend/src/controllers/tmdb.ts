import type { Context } from 'hono'
import * as tmdb from '../services/tmdb.js'
import type { AppEnv } from '../app.js'

type C = Context<AppEnv>

export const getTrending = async (c: C) => {
  const timeWindow = c.req.param('timeWindow')

  if (timeWindow !== 'day' && timeWindow !== 'week') {
    return c.json({ error: 'timeWindow must be "day" or "week"' }, 400)
  }

  try {
    const data = await tmdb.getTrending(
      timeWindow,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1'
    )
    return c.json(data)
  } catch (error) {
    console.error('Error fetching trending:', error)
    return c.json({ error: 'Failed to fetch trending content' }, 500)
  }
}

export const discover = async (c: C) => {
  const type = c.req.param('type')

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

    const data = await tmdb.discover(type, fetchParams)
    return c.json(data)
  } catch (error) {
    console.error('Error discovering content:', error)
    return c.json({ error: 'Failed to discover content' }, 500)
  }
}

export const getGenres = async (c: C) => {
  const type = c.req.param('type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = await tmdb.getGenres(type, c.req.query('language') || 'fr-FR')
    return c.json(data)
  } catch (error) {
    console.error('Error fetching genres:', error)
    return c.json({ error: 'Failed to fetch genres' }, 500)
  }
}

export const getPopular = async (c: C) => {
  const type = c.req.param('type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = await tmdb.getPopular(
      type,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1',
      c.req.query('region') || 'FR'
    )
    return c.json(data)
  } catch (error) {
    console.error('Error fetching popular:', error)
    return c.json({ error: 'Failed to fetch popular content' }, 500)
  }
}

export const getTopRated = async (c: C) => {
  const type = c.req.param('type')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = await tmdb.getTopRated(
      type,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1',
      c.req.query('region') || 'FR'
    )
    return c.json(data)
  } catch (error) {
    console.error('Error fetching top rated:', error)
    return c.json({ error: 'Failed to fetch top rated content' }, 500)
  }
}

export const getProviders = async (c: C) => {
  const type = c.req.param('type')
  const id = c.req.param('id')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = await tmdb.getProviders(type, id)
    return c.json(data)
  } catch (error) {
    console.error('Error fetching watch providers:', error)
    return c.json({ error: 'Failed to fetch watch providers' }, 500)
  }
}

export const getSimilar = async (c: C) => {
  const type = c.req.param('type')
  const id = c.req.param('id')

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be "movie" or "tv"' }, 400)
  }

  try {
    const data = await tmdb.getSimilar(
      type,
      id,
      c.req.query('language') || 'fr-FR',
      c.req.query('page') || '1'
    )
    return c.json(data)
  } catch (error) {
    console.error('Error fetching similar:', error)
    return c.json({ error: 'Failed to fetch similar content' }, 500)
  }
}
