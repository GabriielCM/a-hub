import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface KyoskQRPayloadData {
  kyosk_id: string;
  order_id: string;
  total_points: number;
  expires_at: string;
  hmac: string;
}

export interface KyoskQRValidationResult {
  valid: boolean;
  kyoskId?: string;
  orderId?: string;
  totalPoints?: number;
  error?: string;
}

@Injectable()
export class KyoskQRService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate QR payload with HMAC signature
   */
  generatePayload(
    kyoskId: string,
    orderId: string,
    totalPoints: number,
    expiresAt: Date,
    secret: string,
  ): string {
    const data = {
      kyosk_id: kyoskId,
      order_id: orderId,
      total_points: totalPoints,
      expires_at: expiresAt.toISOString(),
    };

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    return JSON.stringify({ ...data, hmac });
  }

  /**
   * Validate QR payload signature and expiration
   */
  async validatePayload(payload: string): Promise<KyoskQRValidationResult> {
    let parsed: KyoskQRPayloadData;

    try {
      parsed = JSON.parse(payload);
    } catch {
      return { valid: false, error: 'QR code invalido' };
    }

    const { kyosk_id, order_id, total_points, expires_at, hmac } = parsed;

    if (!kyosk_id || !order_id || total_points === undefined || !expires_at || !hmac) {
      return { valid: false, error: 'QR code incompleto' };
    }

    // Fetch kyosk to get the secret
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyosk_id },
    });

    if (!kyosk) {
      return { valid: false, error: 'Kyosk nao encontrado' };
    }

    // Verify HMAC
    const dataToVerify = {
      kyosk_id,
      order_id,
      total_points,
      expires_at,
    };

    const expectedHmac = crypto
      .createHmac('sha256', kyosk.qrSecret)
      .update(JSON.stringify(dataToVerify))
      .digest('hex');

    if (hmac !== expectedHmac) {
      return { valid: false, error: 'QR code invalido' };
    }

    // Check expiration
    const expiresAtDate = new Date(expires_at);
    if (new Date() > expiresAtDate) {
      return { valid: false, error: 'QR code expirado' };
    }

    // Verify order exists and is pending
    const order = await this.prisma.kyoskOrder.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      return { valid: false, error: 'Pedido nao encontrado' };
    }

    if (order.status !== 'PENDING') {
      return { valid: false, error: 'Pedido ja foi processado' };
    }

    return {
      valid: true,
      kyoskId: kyosk_id,
      orderId: order_id,
      totalPoints: total_points,
    };
  }
}
