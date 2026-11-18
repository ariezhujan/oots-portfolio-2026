// Menggambar sisi depan dan belakang kartu ID ke <canvas> 2D.
// Hasilnya dipakai sebagai tekstur Three.js. Semua teks berasal dari data.ts (tidak ada data baru).

import { SLOT_RATIO, SLOT_W_RATIO, SLOT_H_RATIO } from './physics';

export type CardInfo = {
	name: string;
	major: string;
	school: string;
	location: string;
	handle: string;
	tagline: string[];
};

export const CARD_W = 720;
export const CARD_H = 1125;

const DISPLAY = '"Geologica Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const C = {
	base: '#0b1534',
	edge: '#2b4fd0',
	grid: 'rgba(110, 168, 255, 0.07)',
	accent: '#7db2ff',
	fg: '#f3f6ff',
	soft: '#c9d6f5',
	dim: '#93a6d8'
};

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

/** Mengecilkan ukuran huruf sampai teks muat di lebar tertentu. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight: number, family: string) {
	let s = size;
	ctx.font = `${weight} ${s}px ${family}`;
	while (s > 12 && ctx.measureText(text).width > maxW) {
		s -= 2;
		ctx.font = `${weight} ${s}px ${family}`;
	}
	return s;
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	const canvas = document.createElement('canvas');
	canvas.width = CARD_W;
	canvas.height = CARD_H;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D tidak tersedia');
	return { canvas, ctx };
}

function paintBase(ctx: CanvasRenderingContext2D) {
	roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 48);
	ctx.fillStyle = C.base;
	ctx.fill();
	ctx.save();
	ctx.clip();
	// garis grid tipis: penanda identitas "digital workshop"
	ctx.strokeStyle = C.grid;
	ctx.lineWidth = 2;
	for (let x = 48; x < CARD_W; x += 48) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, CARD_H);
		ctx.stroke();
	}
	for (let y = 48; y < CARD_H; y += 48) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(CARD_W, y);
		ctx.stroke();
	}
	ctx.restore();
	roundRectPath(ctx, 3, 3, CARD_W - 6, CARD_H - 6, 46);
	ctx.strokeStyle = C.edge;
	ctx.lineWidth = 6;
	ctx.stroke();
}

function punchSlot(ctx: CanvasRenderingContext2D) {
	// ukuran lubang harus sama dengan lubang pada geometri 3D (SLOT_W_RATIO / SLOT_H_RATIO di physics.ts)
	const cy = CARD_H * SLOT_RATIO;
	const w = CARD_W * SLOT_W_RATIO;
	const h = CARD_H * SLOT_H_RATIO;
	roundRectPath(ctx, CARD_W / 2 - w / 2 - 7, cy - h / 2 - 7, w + 14, h + 14, h / 2 + 7);
	ctx.strokeStyle = 'rgba(125, 178, 255, 0.5)';
	ctx.lineWidth = 6;
	ctx.stroke();
	ctx.save();
	ctx.globalCompositeOperation = 'destination-out';
	roundRectPath(ctx, CARD_W / 2 - w / 2, cy - h / 2, w, h, h / 2);
	ctx.fill();
	ctx.restore();
}

export function drawFront(photo: HTMLImageElement | null, info: CardInfo): HTMLCanvasElement {
	const { canvas, ctx } = makeCanvas();
	ctx.textBaseline = 'alphabetic';
	paintBase(ctx);

	const pad = 48;
	const inner = CARD_W - pad * 2;

	ctx.fillStyle = C.accent;
	ctx.font = `400 26px ${MONO}`;
	ctx.fillText('OOTS 2026', pad, 124);

	ctx.fillStyle = C.fg;
	fitText(ctx, 'PORTFOLIO', inner, 92, 800, DISPLAY);
	ctx.fillText('PORTFOLIO', pad, 206);

	// foto
	const px = pad;
	const py = 238;
	const pw = inner;
	const ph = 556;
	ctx.save();
	roundRectPath(ctx, px, py, pw, ph, 26);
	ctx.clip();
	ctx.fillStyle = '#101c45';
	ctx.fillRect(px, py, pw, ph);
	if (photo && photo.width > 0) {
		const scale = Math.max(pw / photo.width, ph / photo.height);
		const dw = photo.width * scale;
		const dh = photo.height * scale;
		const focusY = 0.3; // wajah berada di bagian atas foto
		const oy = Math.min(0, Math.max(ph - dh, ph * 0.36 - dh * focusY));
		ctx.drawImage(photo, px + (pw - dw) / 2, py + oy, dw, dh);
	}
	ctx.restore();
	roundRectPath(ctx, px, py, pw, ph, 26);
	ctx.strokeStyle = 'rgba(125, 178, 255, 0.35)';
	ctx.lineWidth = 3;
	ctx.stroke();

	// identitas
	ctx.fillStyle = C.fg;
	fitText(ctx, info.name, inner, 54, 700, DISPLAY);
	ctx.fillText(info.name, pad, 868);

	ctx.fillStyle = C.accent;
	ctx.font = `400 28px ${MONO}`;
	ctx.fillText(info.major, pad, 916);
	const majorW = ctx.measureText(info.major).width;
	ctx.fillStyle = C.soft;
	fitText(ctx, info.school, inner - majorW - 24, 28, 400, MONO);
	ctx.fillText(info.school, pad + majorW + 24, 916);

	ctx.fillStyle = C.dim;
	ctx.font = `400 24px ${MONO}`;
	ctx.fillText(info.location, pad, 958);

	ctx.strokeStyle = 'rgba(125, 178, 255, 0.28)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(pad, 1002);
	ctx.lineTo(CARD_W - pad, 1002);
	ctx.stroke();

	ctx.fillStyle = C.fg;
	fitText(ctx, `@${info.handle}`, inner, 30, 400, MONO);
	ctx.fillText(`@${info.handle}`, pad, 1058);

	punchSlot(ctx);
	return canvas;
}

export function drawBack(info: CardInfo): HTMLCanvasElement {
	const { canvas, ctx } = makeCanvas();
	ctx.textBaseline = 'alphabetic';
	paintBase(ctx);
	const pad = 56;
	const inner = CARD_W - pad * 2;

	ctx.fillStyle = C.accent;
	ctx.font = `400 26px ${MONO}`;
	ctx.fillText('OOTS 2026', pad, 124);

	ctx.fillStyle = C.fg;
	let y = 430;
	for (const line of info.tagline) {
		const s = fitText(ctx, line, inner, 74, 700, DISPLAY);
		ctx.fillText(line, pad, y);
		y += s * 1.18;
	}

	ctx.fillStyle = C.soft;
	fitText(ctx, info.name, inner, 38, 600, DISPLAY);
	ctx.fillText(info.name, pad, 940);
	ctx.fillStyle = C.dim;
	ctx.font = `400 26px ${MONO}`;
	ctx.fillText(`${info.major} · ${info.school}`, pad, 984);
	ctx.fillStyle = C.fg;
	fitText(ctx, `@${info.handle}`, inner, 30, 400, MONO);
	ctx.fillText(`@${info.handle}`, pad, 1058);

	punchSlot(ctx);
	return canvas;
}

/** Pastikan font sudah termuat sebelum menggambar ke canvas, kalau gagal tetap pakai font cadangan. */
export async function ensureFonts(): Promise<void> {
	try {
		await Promise.all([
			document.fonts.load('800 60px "Geologica Variable"', 'PORTFOLIO Aldo Ananda Fahujan'),
			document.fonts.load('700 60px "Geologica Variable"', 'Membangun Ide, Melalui Teknologi dan Kreativitas.'),
			document.fonts.load('400 28px "IBM Plex Mono"', 'OOTS 2026 TJKT @xyhujan.umbrella Semarang, Indonesia')
		]);
	} catch {
		/* font cadangan dipakai */
	}
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.decoding = 'async';
		img.onload = () => resolve(img);
		img.onerror = () => resolve(null);
		img.src = src;
	});
}
