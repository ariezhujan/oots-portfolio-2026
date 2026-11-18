// Renderer Three.js untuk kartu lanyard. Fisika ada di physics.ts, di sini hanya menggambar dan mengurus input.
// Three.js diimpor secara dinamis supaya tidak memperlambat render pertama halaman.
//
// Tampilan 3D: kartu bertebal (extrude) dengan lubang sungguhan, permukaan glossy yang memantulkan cahaya,
// tali kain yang ikut terpuntir, serta perangkat keras logam (penjepit, mata rantai, cincin) yang saling menyambung.
import type { Texture, Material, BufferGeometry, Path } from 'three';
import { SEGMENTS, SLOT_W_RATIO, SLOT_H_RATIO, computeLayout, hardwareMetrics, LanyardSim, type Layout } from './physics';
import { drawBack, drawFront, ensureFonts, loadImage, type CardInfo } from './cardArt';

export type LanyardOptions = {
	canvas: HTMLCanvasElement;
	container: HTMLElement;
	photo: string;
	info: CardInfo;
	reducedMotion: boolean;
};

export type LanyardHandle = { destroy: () => void; flip: () => void };

const STEP = 1000 / 60;

// Pengaturan tampilan. Kalau kartu terlihat terlalu terang/gelap, ubah angka di sini.
const LOOK = {
	ambient: 0.55, // cahaya dasar
	key: 2.6, // lampu utama (kiri atas depan): sumber kilau saat kartu berputar
	faceGlow: 0.92, // seberapa terang gambar kartu tampil apa adanya (0 - 1)
	gloss: 1, // kilap lapisan bening di permukaan kartu
	strapGlow: 0.55
};

type T3 = typeof import('three');

function roundedRect(target: Path, x: number, y: number, w: number, h: number, r: number) {
	const rr = Math.min(r, w / 2, h / 2);
	target.moveTo(x + rr, y);
	target.lineTo(x + w - rr, y);
	target.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
	target.lineTo(x + w, y + h - rr);
	target.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
	target.lineTo(x + rr, y + h);
	target.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
	target.lineTo(x, y + rr);
	target.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
}

/** Tekstur tali kain: anyaman halus, jahitan tepi, dan tulisan berulang sepanjang tali. */
function strapTexture(THREE: T3, maxAniso: number) {
	const W = 128;
	const H = 512;
	const c = document.createElement('canvas');
	c.width = W;
	c.height = H;
	const g = c.getContext('2d');
	if (g) {
		g.fillStyle = '#1d3fbf';
		g.fillRect(0, 0, W, H);
		// anyaman kain
		g.fillStyle = 'rgba(255,255,255,0.05)';
		for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
		g.fillStyle = 'rgba(0,0,30,0.12)';
		for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 2, H);
		// tepi lebih gelap + jahitan
		g.fillStyle = '#12296f';
		g.fillRect(0, 0, 8, H);
		g.fillRect(W - 8, 0, 8, H);
		g.strokeStyle = 'rgba(190,215,255,0.8)';
		g.lineWidth = 2;
		g.setLineDash([10, 7]);
		for (const x of [15, W - 15]) {
			g.beginPath();
			g.moveTo(x, 0);
			g.lineTo(x, H);
			g.stroke();
		}
		g.setLineDash([]);
		// tulisan membujur
		g.save();
		g.translate(W / 2, H / 2);
		g.rotate(-Math.PI / 2);
		g.fillStyle = 'rgba(235,243,255,0.92)';
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.font = '700 38px "IBM Plex Mono", ui-monospace, monospace';
		g.fillText('OOTS 2026', -118, 0);
		g.fillText('PORTFOLIO', 118, 0);
		g.fillStyle = 'rgba(125,178,255,0.9)';
		g.fillRect(-18, -3, 36, 6);
		g.restore();
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = THREE.ClampToEdgeWrapping;
	t.wrapT = THREE.RepeatWrapping;
	t.anisotropy = Math.min(8, maxAniso);
	return t;
}

export async function createLanyard(opts: LanyardOptions): Promise<LanyardHandle> {
	const THREE = await import('three');
	await ensureFonts();
	const img = await loadImage(opts.photo);

	const renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 10, 6000);

	// --- pencahayaan + pantulan lingkungan (supaya logam dan kilap kartu terlihat nyata) ---
	scene.add(new THREE.AmbientLight(0xffffff, LOOK.ambient));
	const key = new THREE.DirectionalLight(0xffffff, LOOK.key);
	key.position.set(-400, 700, 1000);
	scene.add(key);
	const rim = new THREE.DirectionalLight(0x9db8ff, 0.8);
	rim.position.set(600, 200, -400);
	scene.add(rim);

	let envTex: Texture | null = null;
	let pmrem: InstanceType<T3['PMREMGenerator']> | null = null;
	try {
		const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
		pmrem = new THREE.PMREMGenerator(renderer);
		const room = new (RoomEnvironment as unknown as new () => import('three').Scene)();
		envTex = pmrem.fromScene(room, 0.04).texture;
	} catch (err) {
		console.warn('Pantulan lingkungan tidak tersedia, memakai pencahayaan biasa.', err);
	}

	const maxAniso = renderer.capabilities.getMaxAnisotropy();
	const frontTex = new THREE.CanvasTexture(drawFront(img, opts.info));
	const backTex = new THREE.CanvasTexture(drawBack(opts.info));
	for (const t of [frontTex, backTex]) {
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = Math.min(8, maxAniso);
	}
	const strapTex = strapTexture(THREE, maxAniso);

	// --- material ---
	// Permukaan kartu: warna asli gambar dijaga (tidak berkabut), kilau hanya muncul dari lampu dan pantulan tipis
	const faceMat = (map: Texture) =>
		new THREE.MeshPhysicalMaterial({
			map,
			color: 0x3c3c3c,
			emissive: 0xffffff,
			emissiveMap: map,
			emissiveIntensity: LOOK.faceGlow,
			roughness: 0.22,
			metalness: 0,
			clearcoat: LOOK.gloss,
			clearcoatRoughness: 0.04,
			specularIntensity: 1,
			envMap: envTex,
			envMapIntensity: 0.18,
			transparent: true,
			alphaTest: 0.02
		});
	const frontMat = faceMat(frontTex);
	const backMat = faceMat(backTex);
	// Sisi tebal kartu: seperti akrilik bening kebiruan
	const bodyMat = new THREE.MeshPhysicalMaterial({
		color: 0x7fb0ff,
		roughness: 0.05,
		metalness: 0,
		clearcoat: 1,
		clearcoatRoughness: 0.03,
		transparent: true,
		opacity: 0.6,
		envMap: envTex,
		envMapIntensity: 1.4
	});
	// Logam krom: gelap-terang berlapis (bukan putih rata) berkat bentuk melengkung dan kekasaran rendah
	const metalMat = new THREE.MeshStandardMaterial({
		color: 0xb9c3dc,
		metalness: envTex ? 1 : 0.4,
		roughness: 0.14,
		envMap: envTex,
		envMapIntensity: 0.9
	});
	const strapMat = new THREE.MeshStandardMaterial({
		map: strapTex,
		emissive: 0xffffff,
		emissiveMap: strapTex,
		emissiveIntensity: LOOK.strapGlow,
		roughness: 0.9,
		metalness: 0,
		side: THREE.DoubleSide
	});

	// --- kartu: bodi bertebal + dua lembar permukaan bergambar ---
	const cardGroup = new THREE.Group();
	cardGroup.rotation.order = 'ZYX'; // putar pada sumbu kartu sendiri, lalu miringkan mengikuti tali
	const front = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), frontMat);
	const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backMat);
	back.rotation.y = Math.PI;
	const body = new THREE.Mesh(new THREE.BufferGeometry(), bodyMat);
	const hardware = new THREE.Group();
	cardGroup.add(body, back, front, hardware);
	scene.add(cardGroup);

	const own: BufferGeometry[] = []; // geometri yang dibuat ulang tiap layout, dibuang saat berganti
	function track<G extends BufferGeometry>(g: G): G {
		own.push(g);
		return g;
	}
	function clearOwn() {
		for (const g of own.splice(0)) g.dispose();
		hardware.clear();
	}

	function buildCard(l: Layout) {
		const thick = Math.max(3.5, l.cardW * 0.017);
		const shape = new THREE.Shape();
		roundedRect(shape, -l.cardW / 2, l.slot - l.cardH, l.cardW, l.cardH, (48 / 720) * l.cardW);
		const sw = l.cardW * SLOT_W_RATIO;
		const sh = l.cardH * SLOT_H_RATIO;
		const hole = new THREE.Path();
		roundedRect(hole, -sw / 2, -sh / 2, sw, sh, sh / 2);
		shape.holes.push(hole);
		const geo = track(new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 18 }));
		geo.translate(0, 0, -thick / 2);
		body.geometry.dispose();
		body.geometry = geo;
		const off = thick / 2 + 0.35;
		front.scale.set(l.cardW, l.cardH, 1);
		back.scale.set(l.cardW, l.cardH, 1);
		front.position.set(0, -(l.cardH / 2 - l.slot), off);
		back.position.set(0, -(l.cardH / 2 - l.slot), -off);
	}

	function buildHardware(l: Layout) {
		const m = hardwareMetrics(l.cardW, l.cardH);
		const mesh = (g: BufferGeometry) => {
			const o = new THREE.Mesh(track(g), metalMat);
			hardware.add(o);
			return o;
		};
		// cincin yang menembus lubang kartu (bidang y-z), titik terendahnya tepat di tengah lubang
		const ring = mesh(new THREE.TorusGeometry(m.ringR, m.wire, 14, 48));
		ring.rotation.y = Math.PI / 2;
		ring.position.set(0, m.ringR, 0);

		// mata rantai: kawat bundar berbentuk oval (bidang x-y), batang bawahnya melewati cincin
		const wl = m.bar * 0.62;
		const lr = m.linkW / 2 - wl;
		const y0 = wl;
		const y1 = m.linkH - wl;
		const pts: InstanceType<T3['Vector3']>[] = [];
		const N = 20;
		for (let i = 0; i <= N; i++) {
			const t = Math.PI + (i / N) * Math.PI; // setengah lingkaran bawah
			pts.push(new THREE.Vector3(Math.cos(t) * lr, y0 + lr + Math.sin(t) * lr, 0));
		}
		for (let i = 0; i <= N; i++) {
			const t = (i / N) * Math.PI; // setengah lingkaran atas
			pts.push(new THREE.Vector3(Math.cos(t) * lr, y1 - lr + Math.sin(t) * lr, 0));
		}
		const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
		const link = mesh(new THREE.TubeGeometry(curve, 96, wl, 14, true));
		link.position.set(0, m.linkBottom, 0);

		// penjepit logam berujung membulat, tempat ujung tali masuk
		const crimpW = l.strapW * 0.96;
		const crimpD = Math.max(6, l.strapW * 0.22);
		const cs = new THREE.Shape();
		roundedRect(cs, -crimpW / 2, -m.crimpH / 2, crimpW, m.crimpH, m.crimpH * 0.42);
		const bev = Math.min(crimpD * 0.4, m.crimpH * 0.22);
		const crimpGeo = new THREE.ExtrudeGeometry(cs, {
			depth: crimpD - bev * 2,
			bevelEnabled: true,
			bevelThickness: bev,
			bevelSize: bev,
			bevelSegments: 5,
			curveSegments: 14
		});
		crimpGeo.translate(0, 0, -(crimpD - bev * 2) / 2);
		const crimp = mesh(crimpGeo);
		crimp.position.set(0, m.crimpCenter, 0);
	}

	// --- tali: pita dengan lebar yang bisa terpuntir ---
	const STRAP_POINTS = SEGMENTS + 1;
	const strapGeo = new THREE.BufferGeometry();
	const strapPos = new Float32Array(STRAP_POINTS * 2 * 3);
	const strapUv = new Float32Array(STRAP_POINTS * 2 * 2);
	const strapIdx: number[] = [];
	for (let i = 0; i < STRAP_POINTS - 1; i++) {
		const a = i * 2;
		strapIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
	}
	strapGeo.setAttribute('position', new THREE.BufferAttribute(strapPos, 3));
	strapGeo.setAttribute('uv', new THREE.BufferAttribute(strapUv, 2));
	strapGeo.setIndex(strapIdx);
	const strap = new THREE.Mesh(strapGeo, strapMat);
	strap.frustumCulled = false;
	scene.add(strap);

	let layout: Layout = computeLayout(1, 1);
	let sim = new LanyardSim(layout);
	let raf = 0;
	let running = false;
	let visible = true;
	let last = 0;
	let acc = 0;
	let first = true;
	let lastW = 0;
	let lastH = 0;

	function applyLayout() {
		const w = Math.max(1, Math.round(opts.container.clientWidth));
		const h = Math.max(1, Math.round(opts.container.clientHeight));
		// ResizeObserver juga terpanggil saat pertama kali dipasang: abaikan jika ukuran tidak berubah
		if (w === lastW && h === lastH) return;
		lastW = w;
		lastH = h;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.position.set(w / 2, h / 2, h / 2 / Math.tan((camera.fov * Math.PI) / 360));
		camera.far = camera.position.z * 3;
		camera.updateProjectionMatrix();
		layout = computeLayout(w, h);
		sim = new LanyardSim(layout, { swing: first && !opts.reducedMotion, damping: opts.reducedMotion ? 0.93 : undefined });
		first = false;
		clearOwn();
		buildCard(layout);
		buildHardware(layout);
		// koordinat tekstur sepanjang tali (v negatif agar tulisan tegak): satu ulangan = 5x lebar tali
		const seg = (layout.visibleRope + (layout.anchorY - layout.height)) / SEGMENTS;
		const tile = layout.strapW * 5;
		for (let i = 0; i < STRAP_POINTS; i++) {
			const v = -(i * seg) / tile;
			strapUv.set([0, v, 1, v], i * 4);
		}
		strapGeo.attributes.uv.needsUpdate = true;
		wake();
	}

	function updateMeshes() {
		const n = sim.segments;
		const half = layout.strapW / 2;
		const rot = sim.twist + sim.flip;
		for (let i = 0; i < STRAP_POINTS; i++) {
			const a = Math.min(i, n);
			const b = Math.min(i + 1, n);
			let tx = sim.x[b] - sim.x[a];
			let ty = sim.y[b] - sim.y[a];
			if (i === n) {
				tx = sim.x[n] - sim.x[n - 1];
				ty = sim.y[n] - sim.y[n - 1];
			}
			const len = Math.hypot(tx, ty) || 1;
			const nx = -ty / len;
			const ny = tx / len;
			// puntiran bertambah mendekati kartu: di ujung tali sama dengan putaran kartu
			const th = rot * Math.pow(i / n, 2.2);
			const cw = Math.cos(th) * half;
			const sw = Math.sin(th) * half;
			const x = sim.x[i];
			const y = sim.y[i];
			strapPos.set([x - nx * cw, y - ny * cw, -sw, x + nx * cw, y + ny * cw, sw], i * 6);
		}
		strapGeo.attributes.position.needsUpdate = true;
		strapGeo.computeVertexNormals();
		const hole = sim.hole();
		cardGroup.position.set(hole.x, hole.y, 0);
		cardGroup.rotation.z = sim.angle();
		cardGroup.rotation.y = rot;
	}

	function frame(now: number) {
		raf = 0;
		if (!running) return;
		acc += Math.min(now - last, 100);
		last = now;
		while (acc >= STEP) {
			sim.step();
			acc -= STEP;
		}
		updateMeshes();
		renderer.render(scene, camera);
		if (sim.asleep && !sim.dragging) {
			running = false;
			return;
		}
		raf = requestAnimationFrame(frame);
	}

	function wake() {
		if (!visible) {
			// tetap gambar satu kali agar kartu terlihat saat kembali ke layar
			updateMeshes();
			renderer.render(scene, camera);
			return;
		}
		if (running) return;
		running = true;
		last = performance.now();
		acc = 0;
		raf = requestAnimationFrame(frame);
	}

	// --- input pointer ---
	const canvas = opts.canvas;
	const toWorld = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: layout.height - (e.clientY - r.top) };
	};
	let activePointer = -1;
	let downAt = { t: 0, x: 0, y: 0 };

	function onDown(e: PointerEvent) {
		if (activePointer !== -1) return;
		const p = toWorld(e);
		const h = sim.hit(p.x, p.y, e.pointerType === 'touch' ? 18 : 6);
		if (!h) return;
		activePointer = e.pointerId;
		canvas.setPointerCapture(e.pointerId);
		downAt = { t: performance.now(), x: p.x, y: p.y };
		sim.startDrag(h.gx, h.gy, p.x, p.y);
		canvas.style.cursor = 'grabbing';
		wake();
	}
	function onMove(e: PointerEvent) {
		const p = toWorld(e);
		if (e.pointerId === activePointer) {
			sim.moveDrag(p.x, p.y);
		} else if (activePointer === -1 && e.pointerType === 'mouse') {
			canvas.style.cursor = sim.hit(p.x, p.y, 4) ? 'grab' : 'default';
		}
	}
	function onUp(e: PointerEvent) {
		if (e.pointerId !== activePointer) return;
		activePointer = -1;
		sim.endDrag();
		if (e.type === 'pointerup') {
			const p = toWorld(e);
			const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y);
			if (moved < 8 && performance.now() - downAt.t < 350) sim.toggleFlip();
		}
		canvas.style.cursor = 'default';
		wake();
	}
	canvas.addEventListener('pointerdown', onDown);
	canvas.addEventListener('pointermove', onMove);
	canvas.addEventListener('pointerup', onUp);
	canvas.addEventListener('pointercancel', onUp);

	const ro = new ResizeObserver(() => applyLayout());
	ro.observe(opts.container);
	const io = new IntersectionObserver((entries) => {
		visible = entries.some((e) => e.isIntersecting);
		if (visible) wake();
	});
	io.observe(opts.container);

	applyLayout();

	return {
		flip() {
			sim.toggleFlip();
			wake();
		},
		destroy() {
			running = false;
			cancelAnimationFrame(raf);
			ro.disconnect();
			io.disconnect();
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerup', onUp);
			canvas.removeEventListener('pointercancel', onUp);
			clearOwn();
			body.geometry.dispose();
			front.geometry.dispose();
			back.geometry.dispose();
			strapGeo.dispose();
			for (const m of [frontMat, backMat, bodyMat, metalMat, strapMat]) (m as Material).dispose();
			for (const t of [frontTex, backTex, strapTex]) t.dispose();
			envTex?.dispose();
			pmrem?.dispose();
			renderer.dispose();
		}
	};
}
