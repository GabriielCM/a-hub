import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StoreItem, StockMovement } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new store item and registers initial stock movement
   */
  async create(createStoreItemDto: CreateStoreItemDto): Promise<StoreItem> {
    const { stock, offerEndsAt, ...rest } = createStoreItemDto;

    return this.prisma.$transaction(async (tx) => {
      // Create the store item
      const storeItem = await tx.storeItem.create({
        data: {
          ...rest,
          stock,
          offerEndsAt: offerEndsAt ? new Date(offerEndsAt) : null,
        },
      });

      // Register initial stock movement if stock > 0
      if (stock > 0) {
        await tx.stockMovement.create({
          data: {
            storeItemId: storeItem.id,
            quantity: stock,
            reason: 'Initial stock',
          },
        });
      }

      return storeItem;
    });
  }

  /**
   * Returns available items (active, not expired, with stock)
   */
  async findAll(): Promise<StoreItem[]> {
    const now = new Date();

    return this.prisma.storeItem.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        OR: [
          { offerEndsAt: null },
          { offerEndsAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns a single store item by ID
   */
  async findOne(id: string): Promise<StoreItem> {
    const storeItem = await this.prisma.storeItem.findUnique({
      where: { id },
    });

    if (!storeItem) {
      throw new NotFoundException('Store item not found');
    }

    return storeItem;
  }

  /**
   * Updates a store item
   */
  async update(id: string, updateStoreItemDto: UpdateStoreItemDto): Promise<StoreItem> {
    await this.findOne(id);

    const { offerEndsAt, ...rest } = updateStoreItemDto;

    return this.prisma.storeItem.update({
      where: { id },
      data: {
        ...rest,
        ...(offerEndsAt !== undefined && {
          offerEndsAt: offerEndsAt ? new Date(offerEndsAt) : null,
        }),
      },
    });
  }

  /**
   * Soft deletes a store item (sets isActive to false)
   */
  async remove(id: string): Promise<StoreItem> {
    await this.findOne(id);

    return this.prisma.storeItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Adjusts stock and creates a stock movement record
   */
  async adjustStock(id: string, adjustStockDto: AdjustStockDto): Promise<StoreItem> {
    const storeItem = await this.findOne(id);

    const newStock = storeItem.stock + adjustStockDto.quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current: ${storeItem.stock}, Requested: ${adjustStockDto.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          storeItemId: id,
          quantity: adjustStockDto.quantity,
          reason: adjustStockDto.reason,
        },
      });

      // Update stock
      return tx.storeItem.update({
        where: { id },
        data: { stock: newStock },
      });
    });
  }

  /**
   * Returns stock movement history for a store item
   */
  async getStockHistory(id: string): Promise<StockMovement[]> {
    await this.findOne(id);

    return this.prisma.stockMovement.findMany({
      where: { storeItemId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
