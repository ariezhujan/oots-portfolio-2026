<script lang="ts">
	import Section from './Section.svelte';
	import ProjectCard from './ProjectCard.svelte';
	import Skills from './Skills.svelte';
	import Achievements from './Achievements.svelte';
	import type { Project, SkillGroup, Achievement } from '$lib/data';

	let {
		projects,
		skillGroups,
		achievements
	}: { projects: Project[]; skillGroups: SkillGroup[]; achievements: Achievement[] } = $props();

	// Teks judul tiap tab sama persis dengan teks section sebelumnya.
	const tabs = [
		{
			id: 'projects',
			name: 'Proyek',
			label: 'KARYA DAN EKSPERIMEN',
			title: 'Ide yang Berhasil Saya Wujudkan.',
			intro: 'Kumpulan proyek, eksperimen, dan eksplorasi teknologi yang menjadi bagian dari perjalanan belajar saya.'
		},
		{
			id: 'skills',
			name: 'Keahlian',
			label: 'APA YANG SAYA PELAJARI',
			title: 'Keahlian & Eksplorasi.',
			intro: 'Berbagai bidang, teknologi, dan perangkat yang terus saya pelajari dan kembangkan.'
		},
		{
			id: 'achievements',
			name: 'Prestasi',
			label: 'PERJALANAN DAN PENCAPAIAN',
			title: 'Setiap Pengalaman Adalah Bagian dari Proses.',
			intro: 'Beberapa pencapaian dan pengalaman yang menjadi bagian dari perjalanan saya dalam belajar, berkarya, dan mengembangkan diri.'
		}
	] as const;

	type TabId = (typeof tabs)[number]['id'];
	let current = $state<TabId>('projects');
	const active = $derived(tabs.find((t) => t.id === current) ?? tabs[0]);

	function onKey(e: KeyboardEvent, index: number) {
		let next = index;
		if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		else return;
		e.preventDefault();
		current = tabs[next].id;
		document.getElementById(`tab-${tabs[next].id}`)?.focus();
	}
</script>

<Section id="portfolio" label={active.label} title={active.title} intro={active.intro}>
	<div class="glass mx-auto mb-10 flex w-full max-w-md rounded-full p-1" role="tablist" aria-label="Isi portofolio">
		{#each tabs as t, i (t.id)}
			<button
				type="button"
				role="tab"
				id="tab-{t.id}"
				aria-selected={current === t.id}
				aria-controls="panel-{t.id}"
				tabindex={current === t.id ? 0 : -1}
				onclick={() => (current = t.id)}
				onkeydown={(e) => onKey(e, i)}
				class="flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors {current === t.id
					? 'bg-accent-solid text-accent-ink'
					: 'text-muted hover:text-fg'}">{t.name}</button
			>
		{/each}
	</div>

	{#key current}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div role="tabpanel" id="panel-{current}" aria-labelledby="tab-{current}" tabindex="0" class="panel-in outline-offset-8">
			{#if current === 'projects'}
				<div class="grid gap-5 md:grid-cols-2">
					{#each projects as project (project.title)}
						<ProjectCard {project} />
					{:else}
						<p class="rounded-2xl border border-dashed border-line p-6 text-muted md:col-span-2">Belum ada proyek yang ditambahkan.</p>
					{/each}
				</div>
			{:else if current === 'skills'}
				<Skills groups={skillGroups} />
			{:else}
				<Achievements items={achievements} />
			{/if}
		</div>
	{/key}
</Section>
