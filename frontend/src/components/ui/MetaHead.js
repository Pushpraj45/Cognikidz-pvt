import React from 'react';
import { Helmet } from 'react-helmet';

const MetaHead = ({
  title = 'CogniKidz - Early Detection Tools for Children',
  description = "Early detection tools for ADHD, autism & dyslexia with personalized guidance for your child's developmental journey.",
  keywords = 'child development, ADHD, autism, dyslexia, early detection',
  canonicalUrl,
  ogImage = '/og-image.jpg',
  children,
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Essential viewport settings for responsive design */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
      />

      {/* Open Graph / Social Media Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card data */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Responsive display for Apple devices */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {children}
    </Helmet>
  );
};

export default MetaHead;
