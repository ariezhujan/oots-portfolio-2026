<script lang="ts">
	import { onMount } from 'svelte';

	// Layar muat: hitungan persen singkat sebelum halaman tampil. Hanya sekali per sesi,
	// dilewati jika pengguna memilih animasi dikurangi (lihat app.html dan layout.css).
	let percent = $state(0);
	let out = $state(false);
	let gone = $state(false);

	onMount(() => {
		const root = document.documentElement;
		if (root.classList.contains('no-loader')) {
			gone = true;
			return;
		}
		let raf = 0;
		let loaded = document.readyState === 'complete';
		const onLoad = () => (loaded = true);
		window.addEventListener('load', onLoad);

		let value = 0;
		const tick = () => {
			const target = loaded ? 100 : 88;
			value += (target - value) * 0.07 + 0.35;
			percent = Math.min(100, Math.round(value));
			if (percent >= 100) {
				try {
					sessionStorage.setItem('loaded', '1');
				} catch {
					/* penyimpanan diblokir: layar muat muncul lagi di kunjungan berikutnya */
				}
				out = true;
				setTimeout(() => (gone = true), 600);
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('load', onLoad);
		};
	});
</script>

{#if !gone}
	<div class="loader" data-out={out} role="status" aria-live="polite" aria-label="Memuat halaman">
		<div class="w-48 text-center">
			<p class="font-display text-7xl font-semibold tabular-nums">{percent}<span class="text-3xl text-accent">%</span></p>
			<div class="mt-4 h-0.5 w-full bg-line" aria-hidden="true">
				<div class="h-full bg-accent-solid" style="width: {percent}%"></div>
			</div>
			<p class="mt-3 font-mono text-xs text-muted">Memuat aset...</p>
		</div>
	</div>
{/if}
