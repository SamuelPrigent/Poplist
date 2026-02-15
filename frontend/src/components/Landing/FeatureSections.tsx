'use client';

import { Plus, Share2, Users } from 'lucide-react';

// Schéma collaborateurs - popover compact (largeur réduite)
function CollaboratorsSchema() {
  return (
    <div className="relative max-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-card/60 p-3">
      <div className="space-y-2.5">
        {/* Titre du popover */}
        <div>
          <h4 className="text-xs font-semibold text-white">Ajouter un collaborateur</h4>
          <p className="mt-0.5 text-[9px] text-gray-400">Entrez le nom d&apos;utilisateur</p>
        </div>
        {/* Input avec validation */}
        <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5">
          <span className="flex-1 text-[10px] text-gray-400">@username</span>
          <div className="h-3.5 w-3.5 rounded-full border-2 border-green-500 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-green-500" />
          </div>
        </div>
        {/* Bouton ajouter */}
        <button className="w-full rounded-md bg-white/10 py-1.5 text-[10px] font-medium text-white">
          Ajouter
        </button>
        {/* Collaborateurs actuels */}
        <div className="border-t border-white/10 pt-2">
          <p className="mb-1.5 text-[9px] font-semibold text-gray-400">Collaborateurs</p>
          <div className="space-y-1">
            {['Alice', 'Bob'].map((name, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-md bg-white/5 p-1.5">
                <div
                  className={`h-4 w-4 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}
                />
                <span className="flex-1 text-[10px] text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent" />
    </div>
  );
}

// Schéma partage - représente le ListHeader schématique avec bouton partage
function ShareSchema() {
  return (
    <div className="relative max-w-[280px] overflow-hidden rounded-xl border border-white/10 bg-card/60 p-3">
      {/* Schéma du ListHeader */}
      <div className="space-y-3">
        {/* Header: Cover + Info */}
        <div className="flex gap-3">
          {/* Cover image placeholder */}
          <div className="h-14 w-14 shrink-0 rounded-lg bg-white/10" />
          {/* Info */}
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 rounded bg-white/20" />
            <div className="h-2 w-14 rounded bg-white/10" />
            <div className="flex items-center gap-1 pt-1">
              <div className="h-4 w-4 rounded-full bg-gray-500/50" />
              <div className="h-2 w-10 rounded bg-white/10" />
            </div>
          </div>
        </div>
        {/* Action buttons row */}
        <div className="flex items-center gap-2 border-t border-white/10 pt-2">
          {/* Save button */}
          <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-gray-400" />
          </div>
          {/* Share button - highlighted */}
          <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/50">
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          {/* Menu button */}
          <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <div className="h-1 w-1 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent" />
    </div>
  );
}

// ============================================
// FEATURE SECTION V1 - Layout alterné
// Utilisable indépendamment dans la landing
// ============================================
export function FeatureSectionAlternating() {
  const features = [
    {
      icon: Users,
      color: 'purple',
      title: 'Collaborez ensemble',
      description: 'Invitez vos amis à contribuer à vos listes',
      highlight: 'en temps réel',
      highlightText: '.',
      schema: <CollaboratorsSchema />,
    },
    {
      icon: Share2,
      color: 'emerald',
      title: 'Partagez facilement',
      description: 'Un',
      highlight: 'simple lien',
      highlightText: ' suffit pour partager avec votre entourage.',
      schema: <ShareSchema />,
      reverse: true,
    },
  ];

  const colorMap = {
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      gradient: 'from-purple-500 to-pink-500',
    },
    emerald: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      gradient: 'from-emerald-500 to-cyan-500',
    },
  };

  return (
    <div className="space-y-20">
      {features.map((feature, index) => {
        const colors = colorMap[feature.color as keyof typeof colorMap];
        const Icon = feature.icon;

        return (
          <div
            key={index}
            className={`flex flex-col items-center gap-10 lg:flex-row ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}
          >
            {/* Texte */}
            <div className="flex-1 space-y-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
              <p className="text-gray-400">
                {feature.description}{' '}
                <span className="relative inline-block text-white">
                  {feature.highlight}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-[2px] w-full bg-linear-to-r ${colors.gradient}`}
                  />
                </span>
                {feature.highlightText}
              </p>
            </div>

            {/* Schéma */}
            <div className="w-full flex-1 lg:max-w-md">{feature.schema}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// FEATURE SECTION V3 - Layout compact
// Collab + Share sur la même ligne, tout empilé verticalement
// ============================================
export function FeatureSectionCompact() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
      {/* Collaborateurs - tout vertical */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
          <Users className="h-5 w-5 text-purple-400" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-white">Collaborez ensemble</h3>
        <p className="mt-1.5 text-sm text-gray-400">
          Invitez vos amis à contribuer à vos listes en temps réel.
        </p>
        <div className="mt-4">
          <CollaboratorsSchema />
        </div>
      </div>

      {/* Partage - tout vertical */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
          <Share2 className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-white">Partagez facilement</h3>
        <p className="mt-1.5 text-sm text-gray-400">
          Un simple lien suffit pour partager avec votre entourage.
        </p>
        <div className="mt-4">
          <ShareSchema />
        </div>
      </div>
    </div>
  );
}
