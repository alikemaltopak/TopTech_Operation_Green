export interface TankerConfig {
  capacityLiters: number; // e.g., 3000
  baseHeightMeters: number; // e.g., 0.5 (table height)
  netWaterHeightMeters: number; // e.g., 1.65 (water height in full tank)
  pipeLengthMeters?: number; // e.g., 20m (length of hose/pipe)
  irrigationType?: 'drip' | 'free_flow'; // Sulama yöntemi
  dripperCount?: number; // Damlatıcı delik sayısı (damla sulamada)
  dripperFlowRateLph?: number; // Damlatıcı başına nominal debi (L/saat, ör. 4, 8, 12)
  valveSize?: 'DN15' | 'DN20' | 'DN25';
}

export interface InstantState {
  remainingLiters: number;
  percentage: number;
  flowRateLitersPerSec: number;
  flowRateLitersPerMin: number;
  totalConsumedLiters: number;
}

export class WaterIrrigationPhysicsEngine {
  private config: TankerConfig;
  private AT: number; // Tank cross‑section area (m²)
  private k: number;  // Flow coefficient
  private h0: number; // Initial hydraulic height (m)
  private initialVolume: number; // Initial volume (L)
  private startTime: number | null = null;

  constructor(config: TankerConfig) {
    this.config = config;
    // Tank base area (m²) = volume (m³) / water height (m)
    this.AT = (config.capacityLiters / 1000) / config.netWaterHeightMeters;

    const isDrip = config.irrigationType === 'drip' || config.irrigationType === undefined;

    if (isDrip) {
      // ─── DAMLA SULAMA MODU ───
      // Nominal damlatıcı debisi (L/saat, varsayılan 8.0 L/saat - tarımsal damlatıcı/geniş delik)
      const N = config.dripperCount !== undefined ? Math.max(1, config.dripperCount) : 300;
      const lph = config.dripperFlowRateLph !== undefined ? config.dripperFlowRateLph : 8.0;
      const qNominalM3s = (lph / 1000) / 3600; // m³/s
      // k_drip = N * (q_nominal / sqrt(10m))
      this.k = N * (qNominalM3s / Math.sqrt(10.0));
    } else {
      // ─── SERBEST AKIŞ (AÇIK BORU) MODU ───
      // Orifice / Valve area Av (m²) – fixed DN20 (20mm)
      const Av = 3.1416e-4; // 20mm diameter (r = 0.01m)
      const L = config.pipeLengthMeters !== undefined ? Math.max(1, config.pipeLengthMeters) : 20;
      const D = 0.020; // 20mm (DN20)
      const f = 0.026; // plastic pipe friction factor
      const K_fittings = 3.5; // valve & fitting losses
      const Cd = 1 / Math.sqrt(1 + (f * L / D) + K_fittings);
      const g = 9.81;
      this.k = Cd * Av * Math.sqrt(2 * g);
    }

    this.initialVolume = config.capacityLiters;
    // Initial hydraulic height includes base (table) height + water column
    this.h0 = config.baseHeightMeters + config.netWaterHeightMeters;
  }

  /** Reset tank to a specific volume (e.g., after refill) */
  public resetTank(currentLiters: number = this.config.capacityLiters) {
    this.initialVolume = currentLiters;
    const currentWaterHeight = (currentLiters / 1000) / this.AT;
    this.h0 = this.config.baseHeightMeters + currentWaterHeight;
    this.startTime = Date.now();
  }

  /** Call when irrigation starts to capture the start timestamp */
  public startIrrigation() {
    this.startTime = Date.now();
  }

  /**
   * Calculate the full physical state after `elapsedSeconds` seconds.
   * Returns an InstantState object ready for UI consumption.
   */
  public calculateState(elapsedSeconds: number): InstantState {
    const t = elapsedSeconds;
    const sqrtH0 = Math.sqrt(this.h0);
    const sqrtHt = sqrtH0 - (this.k / (2 * this.AT)) * t;

    // If the tank is emptied, clamp all values to zero
    if (sqrtHt <= Math.sqrt(this.config.baseHeightMeters)) {
      return {
        remainingLiters: 0,
        percentage: 0,
        flowRateLitersPerSec: 0,
        flowRateLitersPerMin: 0,
        totalConsumedLiters: this.initialVolume,
      };
    }

    const ht = sqrtHt * sqrtHt; // hydraulic height h(t)
    const qSec = 1000 * this.k * sqrtHt; // L/s
    const qMin = qSec * 60;               // L/min
    const currentWaterHeight = ht - this.config.baseHeightMeters;
    const remainingLiters = Math.max(0, 1000 * this.AT * currentWaterHeight);
    const percentage = Math.min(100, Math.max(0, (remainingLiters / this.config.capacityLiters) * 100));
    const totalConsumedLiters = Math.max(0, this.initialVolume - remainingLiters);

    return {
      remainingLiters: Number(remainingLiters.toFixed(1)),
      percentage: Number(percentage.toFixed(1)),
      flowRateLitersPerSec: Number(qSec.toFixed(2)),
      flowRateLitersPerMin: Number(qMin.toFixed(1)),
      totalConsumedLiters: Number(totalConsumedLiters.toFixed(1)),
    };
  }

  /**
   * Deponun tamamen boşalacağı tahmini süreyi dakika cinsinden hesaplar.
   * Torricelli kapalı form çözümü: t_drain = 2 * AT * (sqrt(h0) - sqrt(h_sehpa)) / k
   */
  public getEstimatedDrainTimeMinutes(): number {
    const sqrtH0 = Math.sqrt(this.h0);
    const sqrtBase = Math.sqrt(this.config.baseHeightMeters);
    const tDrainSeconds = (2 * this.AT * (sqrtH0 - sqrtBase)) / this.k;
    return Math.max(0, tDrainSeconds / 60);
  }
}
