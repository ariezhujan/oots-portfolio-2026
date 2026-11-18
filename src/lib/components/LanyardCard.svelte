<script lang="ts">
	import { onMount } from 'svelte';
	import type { LanyardHandle } from '$lib/lanyard/scene';
	import type { CardInfo } from '$lib/lanyard/cardArt';

	let { photo, info }: { photo: string; info: CardInfo } = $props();

	let container = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let status = $state<'loading' | 'ready' | 'fallback'>('loading');
	let handle: LanyardHandle | undefined;

	onMount(() => {
		let cancelled = false;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		(async () => {
			try {
				if (!container || !canvas) throw new Error('Elemen canvas belum siap');
				// Three.js dimuat terpisah agar halaman tampil lebih dulu.
				const { createLanyard } = await import('$lib/lanyard/scene');
				const h = await createLanyard({ canvas, container, photo, info, reducedMotion: reduced });
				if (cancelled) {
					h.destroy();
					return;
				}
				handle = h;
				status = 'ready';
			} catch (err) {
				console.warn('Kartu 3D tidak dapat ditampilkan, memakai kartu statis.', err);
				if (!cancelled) status = 'fallback';
			}
		})();
		return () => {
			cancelled = true;
			handle?.destroy();
		};
	});
</script>

<div bind:this={container} class="absolute inset-0">
	<canvas
		bind:this={canvas}
		role="img"
		aria-label="Kartu identitas {info.name}. Tarik untuk mengayunkan, ketuk untuk membalik."
		class="h-full w-full touch-pan-y transition-opacity duration-700 {status === 'ready' ? 'opacity-100' : 'opacity-0'} {status ===
		'fallback'
			? 'hidden'
			: ''}"
	></canvas>

	{#if status === 'ready'}
		<button
			type="button"
			onclick={() => handle?.flip()}
			class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-line px-3 py-1 font-mono text-xs whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-fg"
		>
			Tarik kartunya, ketuk untuk membalik
		</button>
	{/if}

	{#if status === 'fallback'}
		<figure class="glass mx-auto mt-24 w-[min(17rem,72%)] rounded-3xl p-3 lg:mt-32">
			<img src={photo} alt="Foto {info.name}" width="900" height="1178" class="aspect-[4/5] w-full rounded-2xl object-cover object-top" />
			<figcaption class="px-1 pt-3 pb-1">
				<p class="font-display text-lg font-semibold">{info.name}</p>
				<p class="font-mono text-xs text-muted">{info.major} · {info.school}</p>
			</figcaption>
		</figure>
	{/if}
</div>
