#!/usr/bin/env tsx

import { normalizeCaptacaoPayload, compraStatusRank } from './src/shared/divify/normalize.js';
import { isDivifyWebhookConfigured, verifyDivifyWebhook } from './src/shared/divify/auth.js';
import type { CaptacaoEventoTipo, CaptacaoCompraStatus } from './src/shared/core/types/index.js';

interface TestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly message: string;
  readonly duration: number;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  const start = Date.now();
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          results.push({ name, passed: true, message: 'OK', duration: Date.now() - start });
        })
        .catch((err: unknown) => {
          results.push({
            name,
            passed: false,
            message: err instanceof Error ? err.message : String(err),
            duration: Date.now() - start,
          });
        });
    } else {
      results.push({ name, passed: true, message: 'OK', duration: Date.now() - start });
    }
  } catch (err: unknown) {
    results.push({
      name,
      passed: false,
      message: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
    });
  }
}

function assertEquals<T>(actual: T, expected: T, label?: string): void {
  if (actual !== expected) {
    throw new Error(`${label ?? 'Assertion'} failed: expected ${String(expected)}, got ${String(actual)}`);
  }
}

console.log('🧪 Iniciando testes de integração local\n');
console.log('=' .repeat(60));

test('Normalização: UserActiveEvent com offerId', () => {
  const payload = {
    event: 'UserActiveEvent',
    userId: 'user-123',
    offerId: 'offer-abc',
    occurredAt: '2026-09-17T10:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'USER_ACTIVE' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.ofertaId, 'offer-abc', 'Oferta ID');
  assertEquals(normalized.investorId, 'user-123', 'Investor ID');
  assertEquals(normalized.id, 'USER_ACTIVE:offer-abc:user-123', 'Event ID format');
});

test('Normalização: UserActiveEvent sem offerId', () => {
  const payload = {
    event: 'UserActiveEvent',
    userId: 'user-456',
    occurredAt: '2026-09-17T10:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'USER_ACTIVE' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.ofertaId, undefined, 'Sem oferta ID');
  assertEquals(normalized.investorId, 'user-456', 'Investor ID');
  assertEquals(normalized.id, 'USER_ACTIVE:user-456', 'Event ID format sem oferta');
});

test('Normalização: InvestorCreatedEvent', () => {
  const payload = {
    event: 'InvestorCreatedEvent',
    investorId: 'investor-789',
    offerId: 'offer-xyz',
    occurredAt: '2026-09-17T10:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'INVESTOR_CREATED' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.ofertaId, 'offer-xyz', 'Oferta ID');
  assertEquals(normalized.investorId, 'investor-789', 'Investor ID');
});

test('Normalização: PurchaseApprovedEvent', () => {
  const payload = {
    event: 'PurchaseApprovedEvent',
    purchaseId: 'purchase-001',
    offerId: 'offer-abc',
    investorId: 'investor-789',
    status: 'APPROVED',
    amountCents: 500000,
    occurredAt: '2026-09-17T10:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'PURCHASE_APPROVED' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.purchaseId, 'purchase-001', 'Purchase ID');
  assertEquals(normalized.status, 'APPROVED' as CaptacaoCompraStatus, 'Status');
  assertEquals(normalized.amountCents, 500000, 'Amount');
});

test('Normalização: PurchaseExpiredEvent', () => {
  const payload = {
    event: 'PurchaseExpiredEvent',
    purchaseId: 'purchase-002',
    offerId: 'offer-xyz',
    investorId: 'investor-999',
    status: 'EXPIRED',
    occurredAt: '2026-09-17T11:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'PURCHASE_EXPIRED' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.status, 'EXPIRED' as CaptacaoCompraStatus, 'Status expirado');
});

test('Normalização: OFFER_FINISHED_SUCCESS', () => {
  const payload = {
    event: 'OfferFinishedSuccessEvent',
    offerId: 'offer-abc',
    offerStatus: 'FINISHED_SUCCESS',
    occurredAt: '2026-09-17T12:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'OFFER_FINISHED_SUCCESS' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.ofertaId, 'offer-abc', 'Oferta ID');
  assertEquals(normalized.id, 'OFFER_FINISHED_SUCCESS:offer-abc', 'Event ID único por oferta');
});

test('Normalização: OFFER_FINISHED_UNSUCCESS', () => {
  const payload = {
    event: 'OfferFinishedUnsuccessEvent',
    offerId: 'offer-xyz',
    offerStatus: 'FINISHED_UNSUCCESS',
    occurredAt: '2026-09-17T12:00:00Z',
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'OFFER_FINISHED_UNSUCCESS' as CaptacaoEventoTipo, 'Tipo do evento');
  assertEquals(normalized.ofertaId, 'offer-xyz', 'Oferta ID');
});

test('Normalização: Payload com campos aninhados', () => {
  const payload = {
    event: 'PurchaseApprovedEvent',
    data: {
      offer: {
        id: 'offer-nested',
      },
      purchaseId: 'buy-nested',
      amount: 1500.50,
    },
  };
  const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
  assertEquals(normalized.tipo, 'PURCHASE_APPROVED' as CaptacaoEventoTipo, 'Tipo do evento aninhado');
  assertEquals(normalized.ofertaId, 'offer-nested', 'Oferta ID aninhada');
  assertEquals(normalized.amountCents, 150050, 'Valor convertido de reais para centavos');
});

test('Auth webhook: verificação sem configuração', () => {
  const isConfigured = isDivifyWebhookConfigured();
  console.log(`  ℹ️  Webhook configurado no ambiente: ${String(isConfigured)}`);
  if (isConfigured) {
    const headers = { 'x-webhook-secret': 'test' };
    const isValid = verifyDivifyWebhook(headers);
    console.log(`  ℹ️  Teste com secret inválido rejeitado: ${String(!isValid)}`);
  } else {
    console.log('  ℹ️  DIVIFY_WEBHOOK_SECRET não configurado (esperado em dev local)');
  }
});

test('Normalização: variações de nomes de evento', () => {
  const variations = [
    'purchase.approved',
    'PurchaseApproved',
    'compra aprovada',
    'PURCHASE_APPROVED',
  ];
  
  variations.forEach((eventName) => {
    const payload = { event: eventName, purchaseId: 'test', offerId: 'test' };
    const normalized = normalizeCaptacaoPayload(payload, JSON.stringify(payload));
    assertEquals(
      normalized.tipo,
      'PURCHASE_APPROVED' as CaptacaoEventoTipo,
      `Variação "${eventName}" normalizada`,
    );
  });
});

test('Status rank: ordem de prioridade', () => {
  assertEquals(compraStatusRank('UNKNOWN'), 0, 'UNKNOWN rank');
  assertEquals(compraStatusRank('PENDING'), 1, 'PENDING rank');
  assertEquals(compraStatusRank('EXPIRED'), 2, 'EXPIRED rank');
  assertEquals(compraStatusRank('APPROVED'), 4, 'APPROVED rank');
  assertEquals(compraStatusRank('COMPLETED'), 5, 'COMPLETED rank');
  
  const approved = compraStatusRank('APPROVED');
  const expired = compraStatusRank('EXPIRED');
  if (approved <= expired) {
    throw new Error('APPROVED deveria ter rank maior que EXPIRED');
  }
});

setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumo dos testes\n');
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  
  results.forEach((r) => {
    const icon = r.passed ? '✅' : '❌';
    const time = `${r.duration}ms`;
    console.log(`${icon} ${r.name} (${time})`);
    if (!r.passed) {
      console.log(`   ↳ ${r.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${total} | Passou: ${passed} | Falhou: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Alguns testes falharam!');
    process.exit(1);
  } else {
    console.log('\n✅ Todos os testes passaram!');
    process.exit(0);
  }
}, 100);
