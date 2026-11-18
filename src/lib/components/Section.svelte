<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		id,
		label,
		title,
		intro,
		children
	}: { id: string; label: string; title: string; intro?: string; children: Snippet } = $props();
</script>

<section {id} class="py-20 md:py-24 lg:py-28">
	<div class="mx-auto max-w-6xl px-5">
		<header class="mx-auto max-w-3xl text-center">
			<p class="font-mono text-xs text-muted">{label}</p>
			<h2 class="mt-3 font-display text-3xl font-semibold tracking-tight break-words md:text-5xl">{title}</h2>
			{#if intro}<p class="mt-4 text-muted md:text-lg">{intro}</p>{/if}
		</header>
		<div class="mt-10 md:mt-14">{@render children()}</div>
	</div>
</section>
