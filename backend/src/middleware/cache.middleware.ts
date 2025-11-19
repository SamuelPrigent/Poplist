import { Request, Response, NextFunction } from 'express';
import { ApiCache } from '../models/ApiCache.model.js';

/**
 * Middleware de cache pour les requêtes API externes (TMDB, etc.)
 * Vérifie si la requête a déjà été faite dans les 30 derniers jours
 * Si oui, retourne la réponse en cache
 * Si non, laisse passer et le controller gérera la mise en cache
 */
export const cacheMiddleware = (cacheDurationDays: number = 30) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Construire l'URL complète avec query params pour l'utiliser comme clé
      const baseUrl = req.baseUrl + req.path;

      // Sort query params to ensure consistent cache keys
      const sortedParams = Object.keys(req.query)
        .sort()
        .reduce((acc, key) => {
          acc[key] = req.query[key] as string;
          return acc;
        }, {} as Record<string, string>);

      const queryString = new URLSearchParams(sortedParams).toString();
      const requestUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      // Chercher en cache
      const cached = await ApiCache.findOne({
        requestUrl,
        expiresAt: { $gt: new Date() }, // Seulement les entrées non expirées
      });

      if (cached) {
        // console.log(`\n🟢 ===== CACHE HIT =====`);
        // console.log(`📍 URL: ${requestUrl}`);
        // console.log(`📅 Cached: ${cached.cachedAt.toISOString()}`);
        // console.log(`⏰ Expires: ${cached.expiresAt.toISOString()}`);
        // console.log(`🟢 ====================\n`);

        // Ajouter un header pour indiquer que c'est du cache
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Date', cached.cachedAt.toISOString());

        return res.json(cached.responseData);
      }

      //   console.log(`\n🔴 ===== CACHE MISS =====`);
      //   console.log(`📍 URL: ${requestUrl}`);
      //   console.log(`🔴 ====================\n`);

      // Pas de cache, continuer vers le controller
      res.setHeader('X-Cache', 'MISS');

      // Stocker l'URL dans res.locals pour que le controller puisse l'utiliser
      res.locals.cacheKey = requestUrl;
      res.locals.cacheDurationDays = cacheDurationDays;

      next();
    } catch (error) {
      console.error('Erreur dans le middleware de cache:', error);
      // En cas d'erreur, continuer sans cache
      next();
    }
  };
};

/**
 * Fonction utilitaire pour sauvegarder en cache depuis un controller
 */
export const saveToCache = async (
  requestUrl: string,
  responseData: any,
  cacheDurationDays: number = 30
) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + cacheDurationDays);

    const result = await ApiCache.findOneAndUpdate(
      { requestUrl },
      {
        requestUrl,
        responseData,
        cachedAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // console.log(`\n💾 ===== CACHE SAVED =====`);
    // console.log(`📍 URL: ${requestUrl}`);
    // console.log(`⏰ Expires: ${expiresAt.toISOString()}`);
    // console.log(`📦 Size: ${JSON.stringify(responseData).length} bytes`);
    // console.log(`💾 ====================\n`);
  } catch (error) {
    // console.error(`\n❌ ===== CACHE ERROR =====`);
    // console.error(`📍 URL: ${requestUrl}`);
    // console.error(`Error:`, error);
    // console.error(`❌ ====================\n`);
    // Ne pas faire échouer la requête si le cache échoue
  }
};

/**
 * Fonction pour invalider le cache manuellement si nécessaire
 */
export const invalidateCache = async (pattern?: string) => {
  try {
    if (pattern) {
      // Invalider les URLs contenant le pattern
      const result = await ApiCache.deleteMany({
        requestUrl: { $regex: pattern, $options: 'i' },
      });
      console.log(`🗑️ Invalidation de ${result.deletedCount} entrées avec pattern: ${pattern}`);
      return result.deletedCount;
    } else {
      // Invalider tout le cache
      const result = await ApiCache.deleteMany({});
      console.log(`🗑️ Invalidation de tout le cache: ${result.deletedCount} entrées`);
      return result.deletedCount;
    }
  } catch (error) {
    console.error("Erreur lors de l'invalidation du cache:", error);
    return 0;
  }
};
