'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { PointsReportFilters, User } from '@/lib/api';

interface PointsFiltersProps {
  filters: PointsReportFilters;
  users: Pick<User, 'id' | 'name' | 'email'>[];
  onFiltersChange: (filters: PointsReportFilters) => void;
  onClear: () => void;
}

const transactionTypes = [
  { value: 'CREDIT', label: 'Credito' },
  { value: 'DEBIT', label: 'Debito' },
  { value: 'TRANSFER_IN', label: 'Transferencia Recebida' },
  { value: 'TRANSFER_OUT', label: 'Transferencia Enviada' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
];

export function PointsFilters({
  filters,
  users,
  onFiltersChange,
  onClear,
}: PointsFiltersProps) {
  const hasFilters = filters.startDate || filters.endDate || filters.userId || filters.type;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Filtros</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm">Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm">Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId" className="text-sm">Usuario</Label>
          <Select
            value={filters.userId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, userId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="userId">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm">Tipo</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, type: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {transactionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
