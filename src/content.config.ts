import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		icon: z.string().optional(),
		pricingNotes: z.string().optional(),
		image: z.string().optional(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		location: z.string().optional(),
		problem: z.string().optional(),
		tags: z.array(z.string()).optional(),
		beforeImage: z.string().optional(),
		afterImage: z.string().optional(),
	}),
});

const testimonials = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
	schema: z.object({
		name: z.string(),
		town: z.string().optional(),
		quote: z.string(),
		rating: z.number().min(1).max(5).optional(),
	}),
});

const faqs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
	schema: z.object({
		question: z.string(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		date: z.coerce.date(),
	}),
});

export const collections = {
	services,
	projects,
	testimonials,
	faqs,
	blog,
};
