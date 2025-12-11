import type { MetadataRoute } from 'next'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/types_db'

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://trendingwriters.com/').replace(/\/$/, '')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/trends`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const articleRoutes = await getArticleRoutes()
  const categoryRoutes = await getCategoryRoutes()

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes]
}

async function getArticleRoutes(): Promise<MetadataRoute.Sitemap> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables for sitemap generation')
    return []
  }

  try {
    const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('articles')
      .select('slug, published_at, created_at')
      .not('slug', 'is', null)

    if (error || !data) {
      console.error('Failed to fetch articles for sitemap:', error)
      return []
    }

    return data
      .filter((article) => article.slug)
      .map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: new Date(article.published_at ?? article.created_at ?? new Date().toISOString()),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))
  } catch (error) {
    console.error('Failed to fetch articles for sitemap:', error)
    return []
  }
}

async function getCategoryRoutes(): Promise<MetadataRoute.Sitemap> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  try {
    const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (error || !data) {
      console.error('Failed to fetch categories for sitemap:', error)
      return []
    }

    return data
      .filter((category) => category.slug)
      .map((category) => ({
        url: `${baseUrl}/trends/${category.slug}`,
        lastModified: new Date(category.updated_at ?? new Date().toISOString()),
        changeFrequency: 'daily',
        priority: 0.7,
      }))
  } catch (error) {
    console.error('Failed to fetch categories for sitemap:', error)
    return []
  }
}
