// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	site: 'https://quanelectrical.com',
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
		}),
		mdx(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
