ALTER TABLE articles
DROP CONSTRAINT articles_trend_id_fkey,
ADD CONSTRAINT articles_trend_id_fkey FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE CASCADE;
