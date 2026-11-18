// Fisika tali dan kartu ID (verlet integration), murni TypeScript tanpa Three.js.
// Koordinat: satuan piksel CSS, sumbu y ke ATAS (cocok dengan kamera Three.js).
// Dipisah dari renderer supaya mudah diuji dan tidak bergantung pada WebGL.

export type Layout = {
	width: number;
	height: number;
	cardW: number;
	cardH: number;
	/** jarak dari titik gantung (lubang kartu) ke tepi atas kartu */
	slot: number;
	/** panjang tali yang terlihat di dalam canvas */
	visibleRope: number;
	anchorX: number;
	anchorY: number;
	/** lebar tali (px) */
	strapW: number;
	/** jarak dari ujung tali (penjepit) ke lubang kartu, diukur sepanjang sumbu kartu */
	hookLen: number;
};

export const SEGMENTS = 6;
/** posisi lubang kartu dari tepi atas, sebagai rasio tinggi kartu (dipakai juga oleh cardArt.ts) */
export const SLOT_RATIO = 0.045;
/** ukuran lubang kartu relatif terhadap tekstur 720x1125 (dipakai cardArt.ts dan scene.ts) */
export const SLOT_W_RATIO = 160 / 720;
export const SLOT_H_RATIO = 36 / 1125;
export const ASPECT = 0.64; // lebar / tinggi kartu
const STRAP_RATIO = 0.16; // lebar tali / lebar kartu (tali ID card asli sekitar 20 mm vs kartu 54 mm)

/** Ukuran perangkat keras (cincin, mata rantai, penjepit) relatif terhadap lebar kartu. Dipakai fisika dan renderer. */
export function hardwareMetrics(cardW: number, cardH: number) {
	const slot = cardH * SLOT_RATIO;
	const ringR = cardW * 0.044;
	const wire = ringR * 0.16;
	const linkW = cardW * 0.11;
	const linkH = cardW * 0.19;
	const bar = cardW * 0.016;
	const crimpH = cardW * 0.075;
	// batang bawah mata rantai berada di dalam cincin
	const linkBottom = 2 * ringR - wire - bar - cardW * 0.004;
	const crimpCenter = linkBottom + linkH + crimpH * 0.15;
	const hookLen = crimpCenter + crimpH * 0.25;
	return { slot, ringR, wire, linkW, linkH, bar, crimpH, linkBottom, crimpCenter, hookLen };
}
const OVERSCAN = 36; // tali mulai sedikit di atas canvas supaya terlihat keluar dari tepi atas

export function computeLayout(width: number, height: number): Layout {
	const reserve = 44; // ruang kosong di bawah kartu untuk tombol petunjuk
	const minRope = 60;
	// tinggi total yang dipakai kartu + perangkat keras di bawah ujung tali, per satuan cardH
	const k = hardwareMetrics(ASPECT, 1).hookLen + 1 - SLOT_RATIO;
	let cardH = Math.min(height * 0.66, 520, (width * 0.66) / ASPECT);
	cardH = Math.max(cardH, 170);
	if (height - reserve - cardH * k < minRope) cardH = Math.max(140, (height - reserve - minRope) / k);
	const ropeCap = Math.min(height * 0.42, 260);
	const visibleRope = Math.min(Math.max(height - reserve - cardH * k, minRope), ropeCap);
	const cardW = cardH * ASPECT;
	const hw = hardwareMetrics(cardW, cardH);
	return {
		width,
		height,
		cardW,
		cardH,
		slot: hw.slot,
		visibleRope,
		anchorX: width / 2,
		anchorY: height + OVERSCAN,
		strapW: cardW * STRAP_RATIO,
		hookLen: hw.hookLen
	};
}

type Grab = { gx: number; gy: number; tx: number; ty: number };

export class LanyardSim {
	readonly layout: Layout;
	readonly segments: number;
	/** indeks titik: 0 = jangkar, segments = ujung tali / penjepit (T), segments + 1 = dasar kartu (B) */
	readonly x: number[];
	readonly y: number[];
	private px: number[];
	private py: number[];
	private readonly inv: number[];
	private readonly links: [number, number, number][] = [];
	private grab: Grab | null = null;
	private calm = 0;
	/** putaran kartu pada sumbu vertikal (radian), dipakai untuk efek 3D */
	twist = 0;
	private twistV = 0;
	/** pembalikan kartu (0 = depan, PI = belakang), bergerak halus menuju flipTarget */
	flip = 0;
	private flipTarget = 0;
	private readonly damping: number;
	private readonly gravity: number;

	constructor(layout: Layout, opts: { swing?: boolean; damping?: number } = {}) {
		this.layout = layout;
		this.segments = SEGMENTS;
		const n = this.segments;
		const total = layout.visibleRope + (layout.anchorY - layout.height);
		const seg = total / n;
		const d = layout.hookLen + layout.cardH - layout.slot;
		this.damping = opts.damping ?? 0.99;
		this.gravity = 2400 / 3600; // px per langkah^2 (2400 px/s^2 pada 60 Hz)

		const phi = opts.swing ? 0.3 : 0;
		const dx = Math.sin(phi);
		const dy = -Math.cos(phi);
		this.x = [];
		this.y = [];
		for (let i = 0; i <= n; i++) {
			this.x.push(layout.anchorX + dx * seg * i);
			this.y.push(layout.anchorY + dy * seg * i);
		}
		this.x.push(this.x[n] + dx * d);
		this.y.push(this.y[n] + dy * d);
		this.px = this.x.slice();
		this.py = this.y.slice();

		// massa: tali ringan, kartu berat agar kartu terasa bobotnya
		this.inv = [];
		for (let i = 0; i <= n + 1; i++) this.inv.push(i === 0 ? 0 : i === n ? 1 / 2 : i === n + 1 ? 1 / 7 : 1);
		for (let i = 0; i < n; i++) this.links.push([i, i + 1, seg]);
		this.links.push([n, n + 1, d]);
	}

	get dragging(): boolean {
		return this.grab !== null;
	}

	/** sudut kartu terhadap garis lurus ke bawah (radian) */
	angle(): number {
		const n = this.segments;
		return Math.atan2(this.x[n + 1] - this.x[n], -(this.y[n + 1] - this.y[n]));
	}

	/** titik lubang kartu: tepat di garis antara ujung tali (T) dan dasar kartu (B), sejauh hookLen dari T */
	hole(): { x: number; y: number } {
		const n = this.segments;
		const f = this.layout.hookLen / (this.layout.hookLen + this.layout.cardH - this.layout.slot);
		return { x: this.x[n] + (this.x[n + 1] - this.x[n]) * f, y: this.y[n] + (this.y[n + 1] - this.y[n]) * f };
	}

	/** Mengembalikan koordinat lokal di kartu jika (x, y) mengenai kartu, selain itu null. */
	hit(x: number, y: number, margin = 10): { gx: number; gy: number } | null {
		const t = this.hole();
		const a = this.angle();
		const c = Math.cos(a);
		const s = Math.sin(a);
		const dx = x - t.x;
		const dy = y - t.y;
		const gx = dx * c + dy * s;
		const gy = -dx * s + dy * c;
		const { cardW, cardH, slot, strapW, hookLen } = this.layout;
		const onCard = Math.abs(gx) <= cardW / 2 + margin && gy <= slot + margin && gy >= -(cardH - slot) - margin;
		const onHook = Math.abs(gx) <= strapW * 0.55 + margin && gy > slot && gy <= hookLen + margin;
		return onCard || onHook ? { gx, gy } : null;
	}

	startDrag(gx: number, gy: number, x: number, y: number): void {
		this.grab = { gx, gy, tx: x, ty: y };
		this.calm = 0;
	}

	moveDrag(x: number, y: number): void {
		if (!this.grab) return;
		// jaga target tetap di dalam area agar kartu tidak "terlempar" keluar layar
		const { width, height } = this.layout;
		this.grab.tx = Math.min(Math.max(x, 0), width);
		this.grab.ty = Math.min(Math.max(y, 24), height);
	}

	endDrag(): void {
		this.grab = null;
		this.calm = 0;
	}

	/** dorongan kecil agar kartu bergoyang (mis. saat pertama muncul) */
	nudge(vx: number): void {
		const n = this.segments;
		this.px[n + 1] -= vx;
		this.calm = 0;
	}

	toggleFlip(): void {
		this.flipTarget = this.flipTarget === 0 ? Math.PI : 0;
		this.calm = 0;
	}

	/** Satu langkah simulasi tetap (1/60 detik). */
	step(): void {
		const n = this.segments;
		const count = n + 2;

		for (let i = 1; i < count; i++) {
			const vx = (this.x[i] - this.px[i]) * this.damping;
			const vy = (this.y[i] - this.py[i]) * this.damping;
			this.px[i] = this.x[i];
			this.py[i] = this.y[i];
			this.x[i] += vx;
			this.y[i] += vy - this.gravity;
		}

		if (this.grab) this.applyDrag(this.grab);

		for (let it = 0; it < 12; it++) {
			for (const [a, b, len] of this.links) {
				const dx = this.x[b] - this.x[a];
				const dy = this.y[b] - this.y[a];
				const dist = Math.hypot(dx, dy) || 1e-6;
				const diff = (dist - len) / dist;
				const wa = this.inv[a];
				const wb = this.inv[b];
				const w = wa + wb;
				if (w === 0) continue;
				this.x[a] += (dx * diff * wa) / w;
				this.y[a] += (dy * diff * wa) / w;
				this.x[b] -= (dx * diff * wb) / w;
				this.y[b] -= (dy * diff * wb) / w;
			}
			// jangkar tidak pernah bergerak
			this.x[0] = this.layout.anchorX;
			this.y[0] = this.layout.anchorY;
		}

		// putaran kartu pada sumbu vertikal: ikut arah ayunan lalu kembali ke tengah seperti pegas
		const vxB = this.x[n + 1] - this.px[n + 1];
		this.twistV = this.twistV * 0.93 - this.twist * 0.045 + vxB * 0.011;
		this.twist = Math.max(-0.9, Math.min(0.9, this.twist + this.twistV));

		this.flip += (this.flipTarget - this.flip) * 0.12;
		if (Math.abs(this.flipTarget - this.flip) < 0.002) this.flip = this.flipTarget;

		this.calm = this.energy() < 0.03 && !this.grab && this.flip === this.flipTarget ? this.calm + 1 : 0;
	}

	private applyDrag(g: Grab): void {
		const n = this.segments;
		const a = this.angle();
		const c = Math.cos(a);
		const s = Math.sin(a);
		const T = n;
		const B = n + 1;
		const h = this.hole();
		const wx = h.x + g.gx * c - g.gy * s;
		const wy = h.y + g.gx * s + g.gy * c;
		let dx = g.tx - wx;
		let dy = g.ty - wy;
		const m = Math.hypot(dx, dy);
		const maxStep = 70;
		if (m > maxStep) {
			dx = (dx / m) * maxStep;
			dy = (dy / m) * maxStep;
		}
		const d = this.layout.hookLen + this.layout.cardH - this.layout.slot;
		// posisi titik genggam di sepanjang sumbu T -> B (0 = di T, 1 = di B)
		const t = Math.min(1, Math.max(0, (this.layout.hookLen - g.gy) / d));
		const k = 0.55;
		this.x[T] += dx * (1 - t) * k;
		this.y[T] += dy * (1 - t) * k;
		this.x[B] += dx * t * k;
		this.y[B] += dy * t * k;
		// redam kecepatan agar tidak berosilasi liar saat ditarik
		for (const i of [T, B]) {
			this.px[i] = this.x[i] - (this.x[i] - this.px[i]) * 0.5;
			this.py[i] = this.y[i] - (this.y[i] - this.py[i]) * 0.5;
		}
	}

	/** jumlah pergerakan semua titik pada langkah terakhir (px) */
	energy(): number {
		let e = 0;
		for (let i = 1; i < this.x.length; i++) e += Math.abs(this.x[i] - this.px[i]) + Math.abs(this.y[i] - this.py[i]);
		return e;
	}

	/** true jika sudah diam cukup lama sehingga loop animasi boleh berhenti */
	get asleep(): boolean {
		return this.calm > 90 && Math.abs(this.twist) < 0.004;
	}
}
