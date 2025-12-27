import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { PointsTransactionType } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create the cart for a user
   * @param userId - User ID
   * @returns Cart with items and store item details
   */
  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            storeItem: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              storeItem: true,
            },
          },
        },
      });
    }

    // Calculate total points
    const totalPoints = cart.items.reduce(
      (sum, item) => sum + item.storeItem.pointsPrice * item.quantity,
      0,
    );

    return {
      ...cart,
      totalPoints,
      itemCount: cart.items.length,
    };
  }

  /**
   * Add an item to the cart
   * @param userId - User ID
   * @param dto - Add to cart data
   * @returns Updated cart
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    const { storeItemId, quantity = 1 } = dto;

    // Validate store item exists and is available
    const storeItem = await this.validateStoreItem(storeItemId);

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_storeItemId: {
          cartId: cart.id,
          storeItemId,
        },
      },
    });

    if (existingCartItem) {
      // Increment quantity
      const newQuantity = existingCartItem.quantity + quantity;

      // Validate stock
      if (newQuantity > storeItem.stock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${storeItem.stock}, requested total: ${newQuantity}`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Validate stock for new item
      if (quantity > storeItem.stock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${storeItem.stock}, requested: ${quantity}`,
        );
      }

      // Add new item to cart
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          storeItemId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update quantity of a cart item
   * @param userId - User ID
   * @param itemId - Cart item ID
   * @param dto - Update data
   * @returns Updated cart
   */
  async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const { quantity } = dto;

    // Get cart and verify ownership
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Find the cart item
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Validate stock
    const storeItem = await this.validateStoreItem(cartItem.storeItemId);

    if (quantity > storeItem.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${storeItem.stock}, requested: ${quantity}`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove an item from the cart
   * @param userId - User ID
   * @param itemId - Cart item ID
   * @returns Updated cart
   */
  async removeFromCart(userId: string, itemId: string) {
    // Get cart and verify ownership
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Find the cart item
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clear all items from the cart
   * @param userId - User ID
   * @returns Empty cart
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  /**
   * Checkout - Process the cart and create an order
   * @param userId - User ID
   * @returns Created order with items
   */
  async checkout(userId: string) {
    // Get cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            storeItem: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate total points
    const totalPoints = cart.items.reduce(
      (sum, item) => sum + item.storeItem.pointsPrice * item.quantity,
      0,
    );

    // Get or create user's points balance
    let pointsBalance = await this.prisma.pointsBalance.findUnique({
      where: { userId },
    });

    if (!pointsBalance) {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      pointsBalance = await this.prisma.pointsBalance.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    // Validate sufficient balance
    if (pointsBalance.balance < totalPoints) {
      throw new BadRequestException(
        `Insufficient points balance. Current: ${pointsBalance.balance}, required: ${totalPoints}`,
      );
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const currentStock = await this.prisma.storeItem.findUnique({
        where: { id: item.storeItemId },
        select: { stock: true, name: true, isActive: true, offerEndsAt: true },
      });

      if (!currentStock) {
        throw new BadRequestException(`Store item "${item.storeItem.name}" no longer exists`);
      }

      if (!currentStock.isActive) {
        throw new BadRequestException(`Store item "${currentStock.name}" is no longer available`);
      }

      if (currentStock.offerEndsAt && currentStock.offerEndsAt < new Date()) {
        throw new BadRequestException(`Offer for "${currentStock.name}" has expired`);
      }

      if (currentStock.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${currentStock.name}". Available: ${currentStock.stock}, requested: ${item.quantity}`,
        );
      }
    }

    // Execute checkout in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order with status PENDING
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalPoints,
          status: 'PENDING',
        },
      });

      // 2. Create OrderItems for each cart item
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            storeItemId: item.storeItemId,
            quantity: item.quantity,
            pointsPrice: item.storeItem.pointsPrice,
          },
        });
      }

      // 3. Update points balance (debit)
      await tx.pointsBalance.update({
        where: { id: pointsBalance.id },
        data: {
          balance: { decrement: totalPoints },
        },
      });

      // 4. Create PointsTransaction (DEBIT)
      await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: pointsBalance.id,
          type: PointsTransactionType.DEBIT,
          amount: -totalPoints,
          description: `Order #${newOrder.id.slice(0, 8)}`,
          orderId: newOrder.id,
        },
      });

      // 5. For each item: reduce stock and create StockMovement
      for (const item of cart.items) {
        await tx.storeItem.update({
          where: { id: item.storeItemId },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            storeItemId: item.storeItemId,
            quantity: -item.quantity,
            reason: `Order #${newOrder.id.slice(0, 8)}`,
          },
        });
      }

      // 6. Clear cart (delete CartItems)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // 7. Update Order to COMPLETED
      const completedOrder = await tx.order.update({
        where: { id: newOrder.id },
        data: { status: 'COMPLETED' },
        include: {
          items: {
            include: {
              storeItem: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return completedOrder;
    });

    return {
      message: 'Order completed successfully',
      order,
    };
  }

  /**
   * Validate that a store item exists and is available
   * @param storeItemId - Store item ID
   * @returns Store item if valid
   * @throws BadRequestException if item is not available
   */
  private async validateStoreItem(storeItemId: string) {
    const storeItem = await this.prisma.storeItem.findUnique({
      where: { id: storeItemId },
    });

    if (!storeItem) {
      throw new NotFoundException('Store item not found');
    }

    if (!storeItem.isActive) {
      throw new BadRequestException('Store item is not available');
    }

    if (storeItem.offerEndsAt && storeItem.offerEndsAt < new Date()) {
      throw new BadRequestException('Store item offer has expired');
    }

    if (storeItem.stock <= 0) {
      throw new BadRequestException('Store item is out of stock');
    }

    return storeItem;
  }
}
