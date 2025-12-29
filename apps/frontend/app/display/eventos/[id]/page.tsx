'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { api, EventDisplayData } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Gift, Clock, CheckCircle } from 'lucide-react';

// Dynamic import for QR code to avoid SSR issues
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => ({ default: mod.QRCodeSVG })),
  { ssr: false, loading: () => <div className="w-80 h-80 bg-white/20 rounded-xl animate-pulse" /> }
);

export default function EventDisplayPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [displayData, setDisplayData] = useState<EventDisplayData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDisplayData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await api.getEventDisplay(eventId, accessToken);
      setDisplayData(data);
      setCountdown(data.nextRotationIn);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('Error fetching display data:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, accessToken]);

  // Initial load and polling
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    fetchDisplayData();

    // Poll every 5 seconds
    const pollInterval = setInterval(fetchDisplayData, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchDisplayData, authLoading, isAuthenticated]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <p className="text-xl">Acesso nao autorizado</p>
          <p className="text-slate-400 mt-2">Faca login para acessar o display</p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Carregando evento...</p>
        </div>
      </div>
    );
  }

  // Evento encerrado
  if (error === 'EVENTO_ENCERRADO') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 p-8">
        <CheckCircle className="h-24 w-24 text-green-400 mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Evento Encerrado
        </h1>
        <p className="text-xl text-white/70 mb-8">
          Obrigado pela participacao!
        </p>
        {displayData && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Users className="h-8 w-8 text-white/70 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{displayData.stats.uniqueUsers}</p>
              <p className="text-sm text-white/60">Participantes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <CheckCircle className="h-8 w-8 text-white/70 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{displayData.stats.totalCheckins}</p>
              <p className="text-sm text-white/60">Check-ins</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Evento ainda nao iniciou
  if (error === 'EVENTO_NAO_INICIADO') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900 p-8">
        <Clock className="h-24 w-24 text-blue-300 mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Aguardando Inicio
        </h1>
        <p className="text-xl text-white/70">
          O evento ainda nao comecou
        </p>
      </div>
    );
  }

  // Evento inativo ou outro erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-700">
        <div className="text-white text-center">
          <p className="text-2xl font-bold mb-2">Evento Inativo</p>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return null;
  }

  const { event, qrPayload, stats } = displayData;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: event.displayBackgroundColor || '#1a365d' }}
    >
      {/* Logo */}
      {event.displayLogo && (
        <img
          src={event.displayLogo}
          alt="Logo"
          className="h-20 mb-6 object-contain"
        />
      )}

      {/* Event Name */}
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">
        {event.name}
      </h1>

      {/* Event Period */}
      <p className="text-lg text-white/70 mb-8">
        {format(new Date(event.startAt), "dd 'de' MMMM", { locale: ptBR })} -{' '}
        {format(new Date(event.endAt), "dd 'de' MMMM", { locale: ptBR })}
      </p>

      {/* QR Code */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl mb-8 transition-all">
        <QRCodeSVG
          value={qrPayload}
          size={320}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Instruction */}
      <p className="text-xl text-white/80 mb-8">
        Escaneie o QR Code para fazer check-in
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center">
          <Users className="h-8 w-8 text-white/70 mx-auto mb-2" />
          <p className="text-3xl md:text-4xl font-bold text-white">
            {stats.uniqueUsers}
          </p>
          <p className="text-sm text-white/60">Participantes</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center">
          <CheckCircle className="h-8 w-8 text-white/70 mx-auto mb-2" />
          <p className="text-3xl md:text-4xl font-bold text-white">
            {stats.totalCheckins}
          </p>
          <p className="text-sm text-white/60">Check-ins</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center">
          <Gift className="h-8 w-8 text-white/70 mx-auto mb-2" />
          <p className="text-3xl md:text-4xl font-bold text-white">
            {event.totalPoints}
          </p>
          <p className="text-sm text-white/60">Pontos</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center">
          <Clock className="h-8 w-8 text-white/70 mx-auto mb-2" />
          <p className="text-3xl md:text-4xl font-bold text-white">
            {countdown}s
          </p>
          <p className="text-sm text-white/60">Proximo QR</p>
        </div>
      </div>

      {/* Multiple check-ins info */}
      {event.allowMultipleCheckins && (
        <p className="text-white/60 text-sm">
          Ate {event.maxCheckinsPerUser} check-ins por participante
        </p>
      )}

      {/* Progress bar for QR rotation */}
      <div className="w-full max-w-md mt-4">
        <div className="w-full bg-white/20 rounded-full h-1">
          <div
            className="bg-white h-1 rounded-full transition-all duration-1000"
            style={{
              width: `${(countdown / event.qrRotationSeconds) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
