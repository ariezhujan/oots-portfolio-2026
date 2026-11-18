<script lang="ts">
	let { name, school, photo }: { name: string; school: string; photo: string } = $props();
</script>

<section id="about" class="py-20 md:py-24 lg:py-28">
	<div class="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[22rem_1fr] lg:gap-16">
		<div class="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
			<img
				src={photo}
				alt="Foto {name}"
				width="900"
				height="1178"
				loading="lazy"
				class="aspect-[4/5] w-full rounded-3xl border border-line-strong object-cover object-top"
			/>
			<dl class="glass mt-4 h-fit divide-y divide-line rounded-2xl font-mono text-sm">
				<div class="px-4 py-3"><dt class="text-muted">Sekolah</dt><dd>{school}</dd></div>
				<div class="px-4 py-3"><dt class="text-muted">Jurusan</dt><dd>TJKT</dd></div>
				<div class="px-4 py-3"><dt class="text-muted">Minat</dt><dd>Teknologi, jaringan, fotografi, musik tradisional</dd></div>
			</dl>
		</div>

		<div class="lg:pt-6">
			<p class="font-mono text-xs text-muted">MENGENAL LEBIH DEKAT</p>
			<h2 class="mt-3 font-display text-3xl font-semibold tracking-tight break-words md:text-5xl">
				Rasa Ingin Tahu Adalah Awal dari Segalanya.
			</h2>
			<div class="mt-8 max-w-prose space-y-5 text-lg leading-relaxed">
				<p>
					Saya {name}, siswa {school} yang mengambil jurusan Teknik Jaringan Komputer dan Telekomunikasi
					(TJKT).
				</p>
				<p>
					Ketertarikan saya terhadap teknologi berawal dari rasa ingin tahu tentang bagaimana komputer, jaringan,
					dan berbagai sistem digital bekerja. Seiring waktu, ketertarikan tersebut berkembang ke bidang
					pengembangan website, pembuatan aplikasi, dan eksplorasi teknologi kreatif.
				</p>
				<p>
					Saya senang belajar melalui eksperimen dan praktik langsung. Mulai dari melakukan simulasi jaringan
					komputer, mengembangkan website interaktif, hingga membuat berbagai proyek digital.
				</p>
				<p>
					Di luar dunia teknologi, saya juga memiliki ketertarikan pada fotografi dan musik tradisional. Keduanya
					menjadi ruang bagi saya untuk mengeksplorasi kreativitas dan melihat sesuatu dari perspektif yang
					berbeda.
				</p>
				<p class="text-muted">
					Bagi saya, belajar bukan hanya tentang memahami bagaimana sesuatu bekerja, tetapi juga tentang keberanian
					untuk mencoba dan menciptakan sesuatu.
				</p>
			</div>
		</div>
	</div>
</section>
