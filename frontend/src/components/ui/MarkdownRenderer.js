import React from 'react';

const MarkdownRenderer = ({ content, className = '' }) => {
  console.log('MarkdownRenderer called with content:', content);

  if (!content) return null;

  // Enhanced markdown parser with better formatting and color coding
  const parseMarkdown = text => {
    // Convert headers with better styling
    text = text.replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-bold text-blue-800 dark:text-blue-300 mt-4 mb-2 border-l-4 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 py-1">$1</h3>'
    );
    text = text.replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-bold text-purple-800 dark:text-purple-300 mt-6 mb-3 border-l-4 border-purple-500 pl-3 bg-purple-50 dark:bg-purple-900/20 py-2">$1</h2>'
    );
    text = text.replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold text-green-800 dark:text-green-300 mt-6 mb-4 border-l-4 border-green-500 pl-3 bg-green-50 dark:bg-green-900/20 py-2">$1</h1>'
    );

    // Convert bold text with color highlights
    text = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-1 rounded">$1</strong>'
    );

    // Convert italic text
    text = text.replace(
      /\*(.*?)\*/g,
      '<em class="italic text-gray-800 dark:text-gray-200 font-medium">$1</em>'
    );

    // Convert bullet points with color coding
    text = text.replace(
      /^- (.*$)/gim,
      '<li class="ml-4 mb-2 text-gray-700 dark:text-gray-300 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span>$1</span></li>'
    );

    // Highlight domain names and assessment-related terms with specific colors
    const domainColorMap = {
      Attention: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20',
      Hyperactivity: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20',
      Executive: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/20',
      Memory: 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20',
      Processing: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20',
      Sensory: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/20',
      Language: 'text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/20',
      Social: 'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/20',
      Motor: 'text-lime-700 dark:text-lime-300 bg-lime-100 dark:bg-lime-900/20',
      Cognitive: 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/20',
      Emotional: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/20',
      Behavioral: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/20',
      Communication: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20',
      ADHD: 'text-red-800 dark:text-red-200 bg-red-200 dark:bg-red-800/30',
      ASD: 'text-blue-800 dark:text-blue-200 bg-blue-200 dark:bg-blue-800/30',
      Autism: 'text-blue-800 dark:text-blue-200 bg-blue-200 dark:bg-blue-800/30',
      Dyslexia: 'text-green-800 dark:text-green-200 bg-green-200 dark:bg-green-800/30',
    };

    // Enhanced domain detection for compound terms like "AttentionHyperactivityExecutivefunctio"
    const compoundDomainRegex = /([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)/g;
    text = text.replace(compoundDomainRegex, (match, domain1, domain2, domain3) => {
      const color1 =
        domainColorMap[domain1] ||
        'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/20';
      const color2 =
        domainColorMap[domain2] ||
        'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/20';
      const color3 =
        domainColorMap[domain3] ||
        'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/20';
      return `<span class="font-semibold ${color1} px-1 rounded mr-1">${domain1}</span><span class="font-semibold ${color2} px-1 rounded mr-1">${domain2}</span><span class="font-semibold ${color3} px-1 rounded">${domain3}</span>`;
    });

    // Apply individual domain highlighting
    Object.entries(domainColorMap).forEach(([term, colorClass]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      text = text.replace(
        regex,
        `<span class="font-semibold ${colorClass} px-1 rounded">${term}</span>`
      );
    });

    // Convert line breaks to paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    const formattedParagraphs = paragraphs.map(paragraph => {
      // If paragraph contains list items, wrap in ul
      if (paragraph.includes('<li')) {
        const listItems = paragraph.split('\n').filter(line => line.trim() !== '');
        return `<ul class="list-none space-y-1 mb-4 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">${listItems.join('')}</ul>`;
      }
      // If paragraph is a header, don't wrap in p tag
      if (paragraph.includes('<h1') || paragraph.includes('<h2') || paragraph.includes('<h3')) {
        return paragraph;
      }
      // Regular paragraph with enhanced styling
      return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">${paragraph}</p>`;
    });

    return formattedParagraphs.join('');
  };

  const formattedContent = parseMarkdown(content);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

export default MarkdownRenderer;
