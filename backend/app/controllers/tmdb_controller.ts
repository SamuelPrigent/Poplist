import type { HttpContext } from '@adonisjs/core/http'
import * as tmdb from '#services/tmdb_service'

export default class TmdbController {
  async getTrending({ params, request, response }: HttpContext) {
    const { timeWindow } = params

    if (timeWindow !== 'day' && timeWindow !== 'week') {
      return response.badRequest({ error: 'timeWindow must be "day" or "week"' })
    }

    try {
      const data = await tmdb.getTrending(
        timeWindow,
        request.input('language', 'fr-FR'),
        request.input('page', '1')
      )
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching trending:', error)
      return response.internalServerError({ error: 'Failed to fetch trending content' })
    }
  }

  async getSimilar({ params, request, response }: HttpContext) {
    const { type, id } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const data = await tmdb.getSimilar(
        type,
        id,
        request.input('language', 'fr-FR'),
        request.input('page', '1')
      )
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching similar:', error)
      return response.internalServerError({ error: 'Failed to fetch similar content' })
    }
  }

  async getPopular({ params, request, response }: HttpContext) {
    const { type } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const data = await tmdb.getPopular(
        type,
        request.input('language', 'fr-FR'),
        request.input('page', '1'),
        request.input('region', 'FR')
      )
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching popular:', error)
      return response.internalServerError({ error: 'Failed to fetch popular content' })
    }
  }

  async getTopRated({ params, request, response }: HttpContext) {
    const { type } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const data = await tmdb.getTopRated(
        type,
        request.input('language', 'fr-FR'),
        request.input('page', '1'),
        request.input('region', 'FR')
      )
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching top rated:', error)
      return response.internalServerError({ error: 'Failed to fetch top rated content' })
    }
  }

  async discover({ params, request, response }: HttpContext) {
    const { type } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const fetchParams: Record<string, string> = {
        language: request.input('language', 'fr-FR'),
        page: request.input('page', '1'),
        region: request.input('region', 'FR'),
        sort_by: request.input('sort_by', 'popularity.desc'),
      }

      const withGenres = request.input('with_genres')
      const voteCountGte = request.input('vote_count.gte')
      const primaryReleaseDateGte = request.input('primary_release_date.gte')
      const primaryReleaseDateLte = request.input('primary_release_date.lte')
      const firstAirDateGte = request.input('first_air_date.gte')
      const firstAirDateLte = request.input('first_air_date.lte')

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
      return response.ok(data)
    } catch (error) {
      console.error('Error discovering content:', error)
      return response.internalServerError({ error: 'Failed to discover content' })
    }
  }

  async getGenres({ params, request, response }: HttpContext) {
    const { type } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const data = await tmdb.getGenres(type, request.input('language', 'fr-FR'))
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching genres:', error)
      return response.internalServerError({ error: 'Failed to fetch genres' })
    }
  }

  async getProviders({ params, response }: HttpContext) {
    const { type, id } = params

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be "movie" or "tv"' })
    }

    try {
      const data = await tmdb.getProviders(type, id)
      return response.ok(data)
    } catch (error) {
      console.error('Error fetching watch providers:', error)
      return response.internalServerError({ error: 'Failed to fetch watch providers' })
    }
  }
}
