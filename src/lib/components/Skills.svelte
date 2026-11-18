<script lang="ts">
	import type { SkillGroup } from '$lib/data';
	let { groups }: { groups: SkillGroup[] } = $props();
</script>

<div class="grid gap-5 md:grid-cols-2">
	{#each groups as group (group.name)}
		<section class="glass rounded-2xl p-5 md:p-6" aria-label={group.name}>
			<h3 class="font-display text-xl font-semibold">{group.name}</h3>
			<ul class="mt-4 flex flex-wrap gap-2 font-mono text-sm">
				{#each group.items as item (item)}
					<li class="rounded-lg border border-line bg-bg/50 px-3 py-1.5">{item}</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
