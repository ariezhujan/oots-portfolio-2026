// Semua konten website ada di file ini. Ganti nilai bertanda TODO dengan data asli.

export type Photo = {
	src: string;
	thumb: string;
	alt: string;
	/** ukuran foto asli (px); kosong = 1600x1063 (landscape). Diisi untuk foto potret agar tampil utuh. */
	w?: number;
	h?: number;
};

export type Project = {
	title: string;
	description: string;
	stack: string; // dipisah koma
	year: number; // TODO: isi tahun pengerjaan asli
	href: string; // URL live demo; '' = tombol disembunyikan
	repo?: string; // URL source code; kosong = tombol disembunyikan
	image?: string; // taruh file di static/images/, contoh '/images/jetski.webp'
	download?: string; // file yang bisa diunduh, contoh '/games/crazy-jetski-rider.html'
	featured?: boolean;
	gallery?: Photo[]; // memunculkan tombol 'Lihat Foto Lainnya'
};

export type SkillGroup = { name: string; items: string[] };

export type Achievement = {
	title: string;
	competition: string;
	category: string;
	level?: string;
	year: number;
	description: string;
	certificate?: string;
};

export const profile = {
	name: 'Aldo Ananda Fahujan',
	photo: '/images/aldo-card.webp',
	major: 'TJKT',
	school: 'SMK Negeri 8 Semarang',
	location: 'Semarang, Indonesia'
};

export const projects: Project[] = [
	{
		title: 'HoloChess',
		description:
			'Pengembangan permainan catur berbasis web dengan berbagai pilihan tema visual dan fitur interaktif. Proyek ini menjadi eksplorasi saya dalam pengembangan website, interaksi pengguna, dan desain antarmuka.',
		stack: 'HTML, CSS, JavaScript',
		year: 2026, // TODO
		href: '/games/holochess.html',
		download: '/games/holochess.html',
		image: '/images/holochess.webp',
		featured: true
	},
	{
		title: 'Crazy Jetski Rider',
		description:
			'Permainan jetski 3D di browser dengan mode mabar (multiplayer) P2P lewat hotspot, dibangun dengan Three.js. File gimnya bisa dicoba langsung atau diunduh.',
		stack: 'HTML, CSS, JavaScript, Three.js',
		year: 2026, // TODO
		href: '/games/crazy-jetski-rider.html',
		download: '/games/crazy-jetski-rider.html',
		image: '/images/jetski.webp'
	},
	{
		title: 'Kebun Penjaga',
		description:
			'Permainan Tower Defense berbasis web dengan konsep menjaga kebun dari serangan hama. Pemain dapat menempatkan berbagai jenis penjaga untuk mempertahankan area permainan.',
		stack: 'HTML, CSS, JavaScript',
		year: 2026, // TODO
		href: '/games/kebun-penjaga.html',
		download: '/games/kebun-penjaga.html',
		image: '/images/kebun-penjaga.webp'
	},
	{
		title: 'Cisco Network Simulation',
		description:
			'Eksplorasi jaringan komputer menggunakan Cisco Packet Tracer, meliputi perancangan topologi, konfigurasi IP Address, router, serta pengenalan DNS.',
		stack: 'Cisco Packet Tracer, Computer Networking',
		year: 2026, // TODO
		href: '',
		image: '/images/cisco-simulation.webp'
	},
	{
		title: 'Photography Portfolio',
		description:
			'Kumpulan karya dan eksperimen fotografi menggunakan Nikon D5000. Mengeksplorasi komposisi, pencahayaan, perspektif, dan cara menyampaikan cerita melalui gambar.',
		stack: 'Nikon D5000, Photography',
		year: 2026, // TODO
		href: '',
		image: '/images/photography.webp',
		gallery: [
			{ src: '/images/galeri/hortensia-hijau.webp', thumb: '/images/galeri/hortensia-hijau-thumb.webp', alt: 'Hortensia hijau muda di antara daun merah dan hijau' },
			{ src: '/images/galeri/hortensia-kering.webp', thumb: '/images/galeri/hortensia-kering-thumb.webp', alt: 'Hortensia yang mengering dengan latar kabur' },
			{ src: '/images/galeri/kucing.webp', thumb: '/images/galeri/kucing-thumb.webp', alt: 'Kucing belang tiga menjulurkan lidah' },
			{ src: '/images/galeri/kamboja.webp', thumb: '/images/galeri/kamboja-thumb.webp', alt: 'Bunga kamboja putih berpusat kuning dalam genggaman tangan' },
			{ src: '/images/galeri/bunga.webp', thumb: '/images/galeri/bunga-thumb.webp', alt: 'Rangkaian bunga warna-warni di antara bebatuan dan keramik biru' },
			{
				src: '/images/galeri/siluet-bendera.webp',
				thumb: '/images/galeri/siluet-bendera-thumb.webp',
				alt: 'Siluet seseorang memegang tiang bendera di antara bukit, hitam putih dengan tekstur film',
				w: 900,
				h: 1600
			},
			{
				src: '/images/galeri/malam-hari.webp',
				thumb: '/images/galeri/malam-hari-thumb.webp',
				alt: 'Potret berkacamata di pinggir jalan pada malam hari dengan lampu lalu lintas kabur di latar',
				w: 1200,
				h: 900
			}
		]
	}
];

export const skillGroups: SkillGroup[] = [
	{ name: 'Web Development', items: ['HTML & CSS', 'JavaScript', 'TypeScript', 'SvelteKit', 'Tailwind CSS'] },
	{
		name: 'Jaringan Komputer',
		items: ['Dasar Jaringan LAN', 'IP Addressing', 'Subnetting', 'Routing', 'DNS', 'Cisco Packet Tracer']
	},
	{ name: 'Development Tools', items: ['Git', 'GitHub', 'Visual Studio Code'] },
	{ name: 'Kreativitas', items: ['Fotografi', 'Desain Digital', 'Musik Tradisional'] }
];

export const achievements: Achievement[] = [
	{
		title: 'Juara 3',
		competition: 'Electro Fest 2026',
		category: 'E-Sport Mobile Legends',
		level: 'Diselenggarakan oleh USM', // TODO: ganti dengan nama lengkap penyelenggara jika ingin lebih rinci
		year: 2026,
		description:
			'Meraih Juara 3 pada Electro Fest 2026 yang diselenggarakan oleh USM, kategori E-Sport Mobile Legends. Pengalaman ini melatih kerja sama tim, strategi, dan mental bertanding di bawah tekanan.',
		certificate: '/images/electro-fest-certificate.webp'
	},
	{
		title: 'Juara Harapan 1',
		competition: 'FLS3N 2026',
		category: 'Kreativitas Musik Tradisi',
		level: 'Tingkat Kota Semarang', // sesuai tulisan di piagam; hapus jika kurang tepat
		year: 2026,
		description:
			'Meraih penghargaan Juara Harapan 1 pada ajang FLS3N 2026 kategori Kreativitas Musik Tradisi. Pengalaman ini menjadi kesempatan untuk mengeksplorasi kreativitas, kolaborasi, serta kekayaan seni dan budaya tradisional.',
		certificate: '/images/fls3n-certificate.webp'
	}
];

export const instagram = { handle: 'xyhujan.umbrella', href: 'https://www.instagram.com/xyhujan.umbrella/' };

export const socials: { label: string; href: string }[] = [{ label: 'Instagram', href: instagram.href }];
