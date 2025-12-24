'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { api, MemberCard, Benefit } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => ({ default: mod.QRCodeSVG })),
  { ssr: false, loading: () => <div className="w-[120px] h-[120px] bg-gray-200 animate-pulse" /> }
);
import { Badge } from '@/components/ui/badge';
import { CreditCard, MapPin, Percent, HeartHandshake, User } from 'lucide-react';

export default function CarteirinhaPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [discounts, setDiscounts] = useState<Benefit[]>([]);
  const [partnerships, setPartnerships] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const [cardData, discountsData, partnershipsData] = await Promise.all([
          api.getMyMemberCard(accessToken),
          api.getBenefits('DISCOUNT'),
          api.getBenefits('PARTNERSHIP'),
        ]);

        setMemberCard(cardData);
        setDiscounts(discountsData);
        setPartnerships(partnershipsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [accessToken, authLoading]);

  const formatMatricula = (matricula: number) => {
    return matricula.toString().padStart(4, '0');
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Minha Carteirinha</h1>
        <p className="text-muted-foreground">
          Visualize sua carteirinha de associado e os beneficios disponiveis
        </p>
      </div>

      {/* Member Card Section */}
      <section>
        {memberCard ? (
          <div className="max-w-md mx-auto">
            {/* Physical Card Design */}
            <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-6 shadow-xl text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
              </div>

              {/* Card Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    <span className="font-semibold text-lg">A-hub</span>
                  </div>
                  <span className="text-sm opacity-80">Associacao Cristofoli</span>
                </div>

                {/* Main Content */}
                <div className="flex gap-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/40">
                      {memberCard.photo ? (
                        <img
                          src={memberCard.photo}
                          alt={user?.name || 'Foto do associado'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-10 w-10 text-white/60" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">
                      {user?.name || memberCard.user?.name}
                    </h2>
                    <p className="text-sm opacity-80 truncate">
                      {user?.email || memberCard.user?.email}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-sm">Matricula:</span>
                      <span className="font-mono font-bold">
                        {formatMatricula(memberCard.matricula)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mt-6 flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-lg">
                    <QRCodeSVG
                      value={memberCard.qrCode}
                      size={120}
                      level="M"
                    />
                  </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs mt-4 opacity-60">
                  Apresente este QR Code para validar sua carteirinha
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - No Card */
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Voce ainda nao possui uma carteirinha</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Entre em contato com a administracao para solicitar sua carteirinha de associado.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Discounts Section */}
      {discounts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Descontos</h2>
              <p className="text-sm text-muted-foreground">
                Descontos exclusivos para associados
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discounts.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </div>
        </section>
      )}

      {/* Partnerships Section */}
      {partnerships.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/50 rounded-lg">
              <HeartHandshake className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Convenios</h2>
              <p className="text-sm text-muted-foreground">
                Parcerias e convenios disponiveis
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partnerships.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </div>
        </section>
      )}

      {/* Empty Benefits State */}
      {discounts.length === 0 && partnerships.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <HeartHandshake className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum beneficio disponivel</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Novos beneficios serao adicionados em breve. Fique atento!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Benefit Card Component
interface BenefitCardProps {
  benefit: Benefit;
}

function BenefitCard({ benefit }: BenefitCardProps) {
  const formatAddress = () => {
    const parts = [];
    if (benefit.street && benefit.number) {
      parts.push(`${benefit.street}, ${benefit.number}`);
    }
    if (benefit.neighborhood) {
      parts.push(benefit.neighborhood);
    }
    if (benefit.city) {
      parts.push(benefit.city);
    }
    return parts.join(' - ');
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="aspect-video bg-muted relative">
        {benefit.photos && benefit.photos.length > 0 ? (
          <img
            src={benefit.photos[0]}
            alt={benefit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {benefit.type === 'DISCOUNT' ? (
              <Percent className="h-12 w-12 text-muted-foreground/50" />
            ) : (
              <HeartHandshake className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
        )}
        {/* Type Badge */}
        <Badge
          variant={benefit.type === 'DISCOUNT' ? 'default' : 'secondary'}
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          {benefit.type === 'DISCOUNT' ? (
            <>
              <Percent className="h-3 w-3" />
              Desconto
            </>
          ) : (
            <>
              <HeartHandshake className="h-3 w-3" />
              Convenio
            </>
          )}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{benefit.name}</h3>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{formatAddress()}</span>
        </div>

        {/* Description */}
        {benefit.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {benefit.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
