<script lang="ts">
	import type { PageProps } from './$types';
	import { profile, projects, skillGroups, achievements, socials, instagram } from '$lib/data';
	import Loader from '$lib/components/Loader.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import About from '$lib/components/About.svelte';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import Section from '$lib/components/Section.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { form }: PageProps = $props();
</script>

<Loader />
<Navbar />
<main>
	<Hero
		name={profile.name}
		photo={profile.photo}
		school={profile.school}
		location={profile.location}
		major={profile.major}
		handle={instagram.handle}
	/>
	<About name={profile.name} school={profile.school} photo={profile.photo} />
	<Portfolio {projects} {skillGroups} {achievements} />

	<Section
		id="contact"
		label="MARI TERHUBUNG"
		title="Punya Ide atau Ingin Berdiskusi?"
		intro="Jika kamu memiliki pertanyaan, ide proyek, atau sekadar ingin berdiskusi seputar teknologi dan kreativitas, jangan ragu untuk menghubungi saya. Saya terbuka untuk belajar, bertukar pikiran, dan mengeksplorasi berbagai kemungkinan baru."
	>
		<div class="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
			<ContactForm {form} />
			<aside class="glass rounded-2xl p-5 md:p-8">
				<p class="text-muted">
					Atau kirim pesan lewat Instagram:
					<a href={instagram.href} target="_blank" rel="noopener noreferrer" class="text-fg underline decoration-accent underline-offset-4 hover:text-accent">@{instagram.handle}</a>
				</p>
			</aside>
		</div>
	</Section>
</main>
<Footer name={profile.name} location={profile.location} {socials} />
