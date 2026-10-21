import { describe, it, expect } from 'vitest';
import { WaterIrrigationPhysicsEngine, TankerConfig } from '../lib/WaterIrrigationPhysicsEngine';

// Uygulamanın yeni kullanıcıya atadığı varsayılan depo (lib/db.ts ile aynı)
const DEFAULT_CONFIG: TankerConfig = {
  capacityLiters: 3000,
  baseHeightMeters: 0.5,
  netWaterHeightMeters: 1.65,
  pipeLengthMeters: 20,
  irrigationType: 'drip',
  dripperCount: 300,
  dripperFlowRateLph: 8,
  valveSize: 'DN20',
};

describe('WaterIrrigationPhysicsEngine — Torricelli depo boşalma modeli', () => {
  it('t=0 anında depo dolu, tüketim sıfır', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    const s = engine.calculateState(0);
    expect(s.remainingLiters).toBe(3000);
    expect(s.percentage).toBe(100);
    expect(s.totalConsumedLiters).toBe(0);
  });

  it('damla sulamada başlangıç debisi fiziksel olarak doğru (300 damlatıcı × 8 L/sa @10 m, 2.15 m basınç)', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    // Beklenen: N * q_nom * sqrt(h0 / 10m) = 300 * 8 L/sa * sqrt(2.15/10) ≈ 18.55 L/dk
    const expectedLpm = (300 * 8 / 60) * Math.sqrt(2.15 / 10);
    const s = engine.calculateState(0);
    expect(s.flowRateLitersPerMin).toBeCloseTo(expectedLpm, 1);
    expect(s.flowRateLitersPerSec).toBeCloseTo(expectedLpm / 60, 2);
  });

  it('kütle korunumu: kalan + tüketilen = başlangıç hacmi', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    for (const t of [10, 60, 600, 1800, 3600]) {
      const s = engine.calculateState(t);
      expect(s.remainingLiters + s.totalConsumedLiters).toBeCloseTo(3000, 0);
    }
  });

  it('su seviyesi ve debi zamanla monoton azalır (basınç düştükçe akış yavaşlar)', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    let prev = engine.calculateState(0);
    for (let t = 300; t <= 7200; t += 300) {
      const s = engine.calculateState(t);
      expect(s.remainingLiters).toBeLessThan(prev.remainingLiters);
      expect(s.flowRateLitersPerSec).toBeLessThanOrEqual(prev.flowRateLitersPerSec);
      prev = s;
    }
  });

  it('kapalı form çözüm, dV/dt = -k·√h diferansiyel denkleminin sayısal integrali ile örtüşür', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    const AT = 3 / 1.65; // m²
    const k = 300 * (8 / 1000 / 3600) / Math.sqrt(10);
    let h = 0.5 + 1.65; // hidrolik yükseklik (m)
    const dt = 0.1;
    const T = 1800; // 30 dk
    for (let t = 0; t < T; t += dt) {
      h -= (k * Math.sqrt(h) / AT) * dt;
    }
    const numericRemaining = 1000 * AT * (h - 0.5);
    expect(engine.calculateState(T).remainingLiters).toBeCloseTo(numericRemaining, 0);
  });

  it('tahmini boşalma süresi tutarlı: süreden hemen önce su var, sonra depo boş', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    const drainSec = engine.getEstimatedDrainTimeMinutes() * 60;
    expect(drainSec).toBeGreaterThan(0);
    expect(engine.calculateState(drainSec * 0.95).remainingLiters).toBeGreaterThan(0);
    const empty = engine.calculateState(drainSec + 1);
    expect(empty).toEqual({
      remainingLiters: 0,
      percentage: 0,
      flowRateLitersPerSec: 0,
      flowRateLitersPerMin: 0,
      totalConsumedLiters: 3000,
    });
  });

  it('resetTank kısmi dolulukla başlatır (ör. 1500 L → %50)', () => {
    const engine = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    engine.resetTank(1500);
    const s = engine.calculateState(0);
    expect(s.remainingLiters).toBe(1500);
    expect(s.percentage).toBe(50);
    // Daha az suyla daha düşük basınç → daha düşük debi
    const full = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG).calculateState(0);
    expect(s.flowRateLitersPerSec).toBeLessThan(full.flowRateLitersPerSec);
    // Yarım depo, dolu depodan daha kısa sürede biter
    expect(engine.getEstimatedDrainTimeMinutes()).toBeLessThan(
      new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG).getEstimatedDrainTimeMinutes(),
    );
  });

  it('damlatıcı sayısı ve debisi arttıkça akış artar', () => {
    const base = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG).calculateState(0).flowRateLitersPerSec;
    const moreDrippers = new WaterIrrigationPhysicsEngine({ ...DEFAULT_CONFIG, dripperCount: 600 }).calculateState(0).flowRateLitersPerSec;
    const biggerDrippers = new WaterIrrigationPhysicsEngine({ ...DEFAULT_CONFIG, dripperFlowRateLph: 16 }).calculateState(0).flowRateLitersPerSec;
    expect(moreDrippers).toBeCloseTo(base * 2, 1);
    expect(biggerDrippers).toBeCloseTo(base * 2, 1);
  });

  it('serbest akışta (açık boru) boru uzadıkça sürtünme artar, debi düşer', () => {
    const short = new WaterIrrigationPhysicsEngine({ ...DEFAULT_CONFIG, irrigationType: 'free_flow', pipeLengthMeters: 5 });
    const long = new WaterIrrigationPhysicsEngine({ ...DEFAULT_CONFIG, irrigationType: 'free_flow', pipeLengthMeters: 50 });
    expect(long.calculateState(0).flowRateLitersPerSec).toBeLessThan(short.calculateState(0).flowRateLitersPerSec);
  });

  it('serbest akış, damla sulamadan çok daha hızlı boşaltır', () => {
    const drip = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    const free = new WaterIrrigationPhysicsEngine({ ...DEFAULT_CONFIG, irrigationType: 'free_flow' });
    expect(free.calculateState(0).flowRateLitersPerSec).toBeGreaterThan(drip.calculateState(0).flowRateLitersPerSec);
    expect(free.getEstimatedDrainTimeMinutes()).toBeLessThan(drip.getEstimatedDrainTimeMinutes());
  });

  it('sulama tipi belirtilmezse damla sulama varsayılır', () => {
    const { irrigationType, ...rest } = DEFAULT_CONFIG;
    const implicit = new WaterIrrigationPhysicsEngine(rest);
    const explicit = new WaterIrrigationPhysicsEngine(DEFAULT_CONFIG);
    expect(implicit.calculateState(120)).toEqual(explicit.calculateState(120));
  });
});
