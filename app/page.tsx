'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, ArrowRight, Users, Share2, BarChart3 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

// Import some flags for decoration
import { getTeamFlagCode } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';

// Import TEAMS from the worldcup2026 lib
import { TEAMS } from '@/lib/worldcup2026';
import { useEffect, useState } from 'react';

// Get all real teams (excluding slots)
const ALL_TEAMS = Object.values(TEAMS).filter(t => !t.isPlayoffSlot);

export default function HomePage() {
  const [shuffledTeams, setShuffledTeams] = useState(ALL_TEAMS);

  // Shuffle teams on mount to ensure random order each visit
  useEffect(() => {
    setShuffledTeams([...ALL_TEAMS].sort(() => Math.random() - 0.5));
  }, []);

  // Duplicate the list to create seamless infinite scroll
  const marqueeFlags = [...shuffledTeams, ...shuffledTeams];

  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-wc-red/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-wc-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-wc-green/10 rounded-full blur-3xl" />
      </div>

      <PageShell className="relative" paddingY="lg">
        {/* Hero Section */}
        <section className="text-center mb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-wc-blue/5 border border-wc-blue/10 px-4 py-2 mb-6"
          >
            <span className="text-sm font-medium text-gray-600">
              🇺🇸 🇲🇽 🇨🇦
            </span>
            <span className="text-sm font-semibold text-wc-blue">
              Junio - Julio 2026
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-wc-blue">
              Predice el Mundial
            </span>
            <br />
            <span className="text-foreground">2026</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Elige tus ganadores desde la fase de grupos hasta la final.
            <br className="hidden sm:block" />
            Comparte tu predicción y compite con el mundo.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/simular"
              className="group relative inline-flex items-center gap-2 rounded-2xl bg-wc-blue px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-wc-blue/30 transition-all hover:shadow-2xl hover:shadow-wc-blue/40 hover:scale-105"
            >
              <Trophy className="h-5 w-5" />
              Crear mi predicción
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/top"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card dark:bg-white/5 dark:backdrop-blur-sm px-8 py-4 text-lg font-semibold text-card-foreground shadow-sm transition-all hover:border-wc-blue hover:text-wc-blue hover:shadow-md"
            >
              <BarChart3 className="h-5 w-5" />
              Ver predicciones más votadas
            </Link>
          </motion.div>
        </section>

        {/* Infinite Flags Marquee */}
        <div className="w-full overflow-hidden mb-20 mask-linear-gradient">
          {/* Mask effect using CSS mask-image for fade out edges */}
          <div className="relative w-full flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <motion.div
              className="flex gap-8 py-4 min-w-max"
              // Actually usually tickers move Right-to-Left (content passes by). 
              // If user said "moving towards right", they might mean the CONTENT flows -> ->.
              // Let's interpret "moving to the right" as text scrolling from left to right.
              // Normal Western reading is left-to-right, but marquees usually push left.
              // Let's stick to standard marquee (moving left, content flowing rightwards into view) unless "hacia la derecha" explicitly means the direction of motion vector.
              // "Que se van moviendo hacia la derecha" = The objects translate to the right. X increases.
              // So I will animate from X = -2000 to 0.
              // To handle infinite loop seamlessness, we need careful width calculation.
              // Simplest is to just animate a long strip.
              // Let's try standard slow linear pan.
              // Wait, if I move TO THE RIGHT, I should start at -50% and move to 0%.
              initial={{ x: '-50%' }}
              animate={{ x: '0%' }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 60 // Slow, majestic speed
              }}
            >
              {marqueeFlags.map((team, index) => {
                const FlagComponent = Flags[getTeamFlagCode(team) as keyof typeof Flags];
                return (
                  <div
                    key={`${team.id}-${index}`}
                    className="flex flex-col items-center gap-2 min-w-[80px]"
                  >
                    <div
                      className="w-20 h-14 rounded-lg overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-wc-blue transition-all hover:scale-110 cursor-pointer bg-card dark:bg-white/5 dark:backdrop-blur-sm"
                      title={team.name}
                    >
                      {FlagComponent && (
                        <FlagComponent className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{team.shortName}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Todas las selecciones participantes
          </p>
        </div>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Trophy,
              title: 'Predice el Campeón',
              description:
                'Ordena los equipos en cada grupo y elige los ganadores de cada partido hasta la gran final.',
              color: 'wc-red',
            },
            {
              icon: Share2,
              title: 'Comparte tu Bracket',
              description:
                'Obtén un enlace único para compartir tu predicción en redes sociales con tus amigos.',
              color: 'wc-blue',
            },
            {
              icon: Users,
              title: 'Compite con Otros',
              description:
                'Vota por las mejores predicciones y descubre cuál es el campeón favorito de la comunidad.',
              color: 'wc-green',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card dark:bg-black/20 dark:backdrop-blur-sm dark:border-white/10 p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}/10 mb-4`}
                style={{
                  backgroundColor:
                    feature.color === 'wc-red'
                      ? 'rgba(230, 29, 37, 0.1)'
                      : feature.color === 'wc-blue'
                        ? 'rgba(42, 57, 141, 0.1)'
                        : 'rgba(60, 172, 59, 0.1)',
                }}
              >
                <feature.icon
                  className="h-6 w-6"
                  style={{
                    color:
                      feature.color === 'wc-red'
                        ? '#E61D25'
                        : feature.color === 'wc-blue'
                          ? '#2A398D'
                          : '#3CAC3B',
                  }}
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>

              {/* Decorative gradient */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at bottom right, ${feature.color === 'wc-red'
                    ? 'rgba(230, 29, 37, 0.05)'
                    : feature.color === 'wc-blue'
                      ? 'rgba(42, 57, 141, 0.05)'
                      : 'rgba(60, 172, 59, 0.05)'
                    }, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-3xl bg-wc-blue p-8 sm:p-12 text-white text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            El torneo más grande de la historia
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '48', label: 'Equipos' },
              { value: '12', label: 'Grupos' },
              { value: '104', label: 'Partidos' },
              { value: '16', label: 'Sedes' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-bold text-white/90 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-16"
        >
          <p className="text-gray-500 mb-6">¿Listo para hacer tu predicción?</p>
          <Link
            href="/simular"
            className="inline-flex items-center gap-2 text-wc-red font-semibold hover:underline"
          >
            Comenzar ahora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.section>
      </PageShell>
    </div>
  );
}
