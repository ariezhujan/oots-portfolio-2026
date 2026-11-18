<script lang="ts">
	import { onMount } from 'svelte';
	import { profile } from '$lib/data';

	const links = [
		{ id: 'home', label: 'Beranda' },
		{ id: 'about', label: 'Tentang' },
		{ id: 'portfolio', label: 'Portofolio' },
		{ id: 'contact', label: 'Kontak' }
	];

	let active = $state('home');
	let open = $state(false);
	let dark = $state(true);

	onMount(() => {
		dark = document.documentElement.classList.contains('dark');
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) active = e.target.id;
			},
			{ rootMargin: '-45% 0px -50% 0px' }
		);
		for (const l of links) {
			const el = document.getElementById(l.id);
			if (el) io.observe(el);
		}
		return () => io.disconnect();
	});

	function toggleTheme() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		try {
			localStorage.setItem('theme', dark ? 'dark' : 'light');
		} catch {
			/* storage blocked: theme still changes for this visit */
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<header class="pointer-events-none fixed inset-x-0 top-3 z-50 px-3">
	<nav
		class="glass pointer-events-auto mx-auto flex h-12 max-w-4xl items-center justify-between gap-2 rounded-full pr-1.5 pl-5"
		aria-label="Utama"
	>
		<a href="#home" class="min-w-0 truncate font-display text-sm font-semibold tracking-tight sm:text-base">{profile.name}</a>

		<ul class="hidden items-center gap-1 md:flex">
			{#each links as l (l.id)}
				<li>
					<a
						href="#{l.id}"
						aria-current={active === l.id ? 'true' : undefined}
						class="block rounded-full px-3.5 py-1.5 text-sm transition-colors {active === l.id
							? 'bg-accent-solid text-accent-ink'
							: 'text-muted hover:text-fg'}">{l.label}</a
					>
				</li>
			{/each}
		</ul>

		<div class="flex shrink-0 items-center gap-1">
			<button
				type="button"
				onclick={toggleTheme}
				class="h-9 rounded-full border border-line px-3 font-mono text-xs transition-colors hover:border-accent"
				aria-label="Ganti ke tema {dark ? 'terang' : 'gelap'}">{dark ? 'Terang' : 'Gelap'}</button
			>
			<button
				type="button"
				class="h-9 rounded-full border border-line px-3 text-sm md:hidden"
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => (open = !open)}>{open ? 'Tutup' : 'Menu'}</button
			>
		</div>
	</nav>

	{#if open}
		<ul id="mobile-nav" class="glass pointer-events-auto mx-auto mt-2 max-w-4xl rounded-3xl p-2 md:hidden">
			{#each links as l (l.id)}
				<li>
					<a
						href="#{l.id}"
						onclick={() => (open = false)}
						aria-current={active === l.id ? 'true' : undefined}
						class="block rounded-2xl px-4 py-3 {active === l.id ? 'bg-accent-solid text-accent-ink' : 'text-muted'}">{l.label}</a
					>
				</li>
			{/each}
		</ul>
	{/if}
</header>
