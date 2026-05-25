import { NewsCard } from '@/components/news/NewsCard';
import type { Category, NewsArticle } from '@/types/api';

interface NewsGridProps {
  articles: NewsArticle[];
  /** Default category — used when articles come from a mixed feed and
   *  individual articles don't carry a category of their own. */
  fallbackCategory: Category;
  /** Optional per-article category, keyed by URL. */
  categoryByUrl?: Map<string, Category>;
}

export function NewsGrid({ articles, fallbackCategory, categoryByUrl }: NewsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <NewsCard
          key={article.url}
          article={article}
          category={categoryByUrl?.get(article.url) ?? fallbackCategory}
        />
      ))}
    </div>
  );
}
