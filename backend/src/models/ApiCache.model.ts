import mongoose, { type Document, Schema } from "mongoose";

export interface IApiCache extends Document {
	requestUrl: string; // URL complète avec query params (clé unique)
	responseData: unknown; // Données de la réponse (sans les images en base64)
	cachedAt: Date;
	expiresAt: Date;
}

const apiCacheSchema = new Schema<IApiCache>(
	{
		requestUrl: {
			type: String,
			required: true,
			unique: true,
			index: true, // Index pour recherche rapide
		},
		responseData: {
			type: Schema.Types.Mixed,
			required: true,
		},
		cachedAt: {
			type: Date,
			required: true,
			default: Date.now,
		},
		expiresAt: {
			type: Date,
			required: true,
			// Ne pas mettre index: true ici car on le définit ci-dessous avec TTL
		},
	},
	{
		timestamps: false, // On gère manuellement cachedAt
	}
);

// TTL index : MongoDB supprimera automatiquement les documents expirés
apiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiCache = mongoose.model<IApiCache>("ApiCache", apiCacheSchema);
