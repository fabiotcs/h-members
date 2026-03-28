# Gateways de Pagamento

## Gateways Disponiveis

| Gateway | Metodos | PIX | Boleto | Cartao | SDK |
|---------|---------|-----|--------|--------|-----|
| **Stripe** | Card, PIX | Sim | Nao | Sim | stripe npm |
| **Mercado Pago** | Card, PIX, Boleto | Sim | Sim | Sim | fetch (sem SDK) |
| **Asaas** | Card, PIX, Boleto | Sim | Sim | Sim | fetch (sem SDK) |

## Configuracao

### Stripe
- Criar conta em https://stripe.com
- Obter Secret Key e Publishable Key no Dashboard
- Configurar webhook endpoint: POST /api/v1/payments/webhook/stripe
- Eventos necessarios: checkout.session.completed

### Mercado Pago
- Criar conta em https://www.mercadopago.com.br
- Obter Access Token e Public Key em Suas Integracoes
- Webhook configurado automaticamente via notification_url

### Asaas
- Criar conta em https://www.asaas.com
- Obter API Key em Configuracoes > Integracao
- Configurar webhook: POST /api/v1/payments/webhook/asaas
- Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
- Possui modo sandbox para testes

## Variaveis de Ambiente

```env
PAYMENT_GATEWAY=asaas  # stripe | mercadopago | asaas | none

# Asaas
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_SANDBOX=true
```
