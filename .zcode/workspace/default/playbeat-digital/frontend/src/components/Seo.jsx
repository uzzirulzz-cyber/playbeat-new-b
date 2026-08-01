import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

export const Seo = ({ title, description, image, type = 'website', jsonLd }) => {
  useEffect(() => {
    if (title) document.title = title.includes('PlayBeat') ? title : `${title} — PlayBeat Digital`;
  }, [title]);

  return (
    <Helmet>
      {title && <title>{title.includes('PlayBeat') ? title : `${title} — PlayBeat Digital`}</title>}
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      {title && <meta property="og:title" content={title} />}
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};
