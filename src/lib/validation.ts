export type ContactInput = { name: string; email: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Dipakai di browser DAN di server agar aturannya selalu sama.
export function validateContact(v: ContactInput): ContactErrors {
	const errors: ContactErrors = {};
	if (!v.name) errors.name = 'Masukkan nama kamu.';
	else if (v.name.length > 80) errors.name = 'Maksimal 80 karakter.';

	if (!v.email) errors.email = 'Masukkan alamat email kamu.';
	else if (v.email.length > 254 || !EMAIL.test(v.email))
		errors.email = 'Format email belum valid, contoh: nama@email.com.';

	if (!v.message) errors.message = 'Tuliskan pesan kamu.';
	else if (v.message.length < 10) errors.message = 'Tulis minimal 10 karakter.';
	else if (v.message.length > 2000) errors.message = 'Maksimal 2000 karakter.';
	return errors;
}
