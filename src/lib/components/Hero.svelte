<script lang="ts">
	import LanyardCard from './LanyardCard.svelte';
	import type { CardInfo } from '$lib/lanyard/cardArt';

	let {
		name,
		photo,
		school,
		location,
		major,
		handle
	}: { name: string; photo: string; school: string; location: string; major: string; handle: string } = $props();

	// Reactive input (materi Hari 1): sapaan berubah langsung saat mengetik.
	let visitor = $state('');
	const greeting = $derived(visitor.trim() ? `Halo ${visitor.trim()}, saya Aldo.` : 'Halo, saya Aldo.');

	const info = $derived<CardInfo>({
		name,
		major,
		school,
		location,
		handle,
		tagline: ['Membangun Ide,', 'Melalui Teknologi', 'dan Kreativitas.']
	});
</script>

<section id="home" class="blueprint">
	<div class="mx-auto grid max-w-6xl px-5 lg:min-h-[max(100svh,40rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
		<div class="pt-4 pb-14 lg:flex lg:flex-col lg:justify-center lg:py-32">
			<p class="rise font-mono text-xs text-muted">PELAJAR · TECH ENTHUSIAST · CREATIVE EXPLORER</p>
			<h1
				class="rise mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight break-words sm:text-5xl xl:text-6xl"
				style="--d: 0.05s"
			>
				<span class="text-accent">Membangun Ide,</span><br />Melalui Teknologi dan Kreativitas.
			</h1>
			<div class="rise mt-6 max-w-xl space-y-4 text-base text-muted sm:text-lg" style="--d: 0.12s">
				<p>
					Halo, saya {name}. Seorang siswa Teknik Jaringan Komputer dan Telekomunikasi yang memiliki
					ketertarikan pada pengembangan web, jaringan komputer, dan teknologi digital.
				</p>
				<p>Saya senang mengeksplorasi hal baru, bereksperimen, serta mengubah ide menjadi karya dan proyek nyata.</p>
			</div>
			<div class="rise mt-8 flex flex-wrap gap-3" style="--d: 0.2s">
				<a href="#portfolio" class="btn btn-primary">Jelajahi Proyek</a>
				<a href="#contact" class="btn btn-ghost">Hubungi Saya</a>
			</div>

			<div class="rise glass mt-8 max-w-md rounded-2xl p-4" style="--d: 0.28s">
				<label for="visitor-name" class="font-mono text-sm text-muted">Coba ketik namamu</label>
				<input
					id="visitor-name"
					type="text"
					bind:value={visitor}
					placeholder="Namamu..."
					autocomplete="off"
					class="mt-2 w-full rounded-xl border border-line-strong bg-bg/60 px-3 py-2.5 outline-none focus-visible:border-accent"
				/>
				<p class="mt-3 font-display text-xl break-words" aria-live="polite">{greeting}</p>
			</div>
		</div>

		<!-- Di layar kecil kartu tampil lebih dulu (tali keluar dari tepi atas layar), di desktop di kolom kanan. -->
		<div class="relative order-first h-[500px] md:h-[620px] lg:order-none lg:h-auto">
			<LanyardCard {photo} {info} />
		</div>
	</div>
</section>
