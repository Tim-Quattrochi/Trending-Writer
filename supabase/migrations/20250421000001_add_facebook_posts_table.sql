-- Create table for tracking Facebook posts
CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  facebook_post_id TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  post_url TEXT,
  engagement_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS facebook_posts_article_id_idx ON public.facebook_posts(article_id);
CREATE INDEX IF NOT EXISTS facebook_posts_facebook_post_id_idx ON public.facebook_posts(facebook_post_id);

-- Create RLS policies
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can insert/update/delete
CREATE POLICY "Enable all operations for authenticated users only" 
ON public.facebook_posts 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.facebook_posts IS 'Table for tracking Facebook posts of articles';
COMMENT ON COLUMN public.facebook_posts.article_id IS 'Reference to the article that was posted';
COMMENT ON COLUMN public.facebook_posts.facebook_post_id IS 'Facebook post ID returned from the API';
COMMENT ON COLUMN public.facebook_posts.post_url IS 'URL to the Facebook post (optional)';
COMMENT ON COLUMN public.facebook_posts.engagement_stats IS 'JSON object with engagement statistics (optional)';