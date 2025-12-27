import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get current user's cart with items and total points
   */
  @Get()
  getCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }

  /**
   * Add an item to the cart
   */
  @Post('items')
  addToCart(
    @CurrentUser('sub') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  /**
   * Update quantity of a cart item
   */
  @Patch('items/:itemId')
  updateCartItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(userId, itemId, updateCartItemDto);
  }

  /**
   * Remove an item from the cart
   */
  @Delete('items/:itemId')
  removeFromCart(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeFromCart(userId, itemId);
  }

  /**
   * Clear all items from the cart
   */
  @Delete()
  clearCart(@CurrentUser('sub') userId: string) {
    return this.cartService.clearCart(userId);
  }

  /**
   * Checkout - Process cart and create order
   */
  @Post('checkout')
  checkout(@CurrentUser('sub') userId: string) {
    return this.cartService.checkout(userId);
  }
}
