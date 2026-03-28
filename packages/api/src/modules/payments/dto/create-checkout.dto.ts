import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutResponseDto {
  @ApiProperty({ example: 'https://checkout.stripe.com/pay/cs_test_...' })
  checkoutUrl: string;

  @ApiProperty({ example: 'cs_test_abc123' })
  sessionId: string;

  @ApiProperty({ example: 'stripe', enum: ['stripe', 'mercadopago'] })
  gateway: string;
}

export class PaymentConfigResponseDto {
  @ApiProperty({
    example: 'stripe',
    enum: ['stripe', 'mercadopago', 'none'],
    description: 'Currently active payment gateway',
  })
  activeGateway: string;

  @ApiProperty({
    example: 'pk_test_abc123',
    nullable: true,
    description: 'Stripe publishable key (client-safe)',
  })
  stripe: string | null;

  @ApiProperty({
    example: 'TEST-abc123',
    nullable: true,
    description: 'Mercado Pago public key (client-safe)',
  })
  mercadoPago: string | null;
}
