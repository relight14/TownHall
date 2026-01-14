import { NodeViewProps, NodeViewWrapper, nodePasteRule, ReactNodeViewRenderer } from '@tiptap/react';
import { mergeAttributes, Node } from '@tiptap/core';
import { Tweet } from 'react-tweet';
import React, { useEffect, useState } from 'react';

type Platform = 'twitter' | 'substack' | 'threads' | 'bluesky' | 'generic';

function detectPlatform(url: string): Platform {
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  if (/substack\.com/.test(url)) return 'substack';
  if (/threads\.net/.test(url)) return 'threads';
  if (/bsky\.app/.test(url)) return 'bluesky';
  return 'generic';
}

const TwitterComponent = ({ url }: { url: string }) => {
  const tweetIdRegex = /\/status\/(\d+)/;
  const match = url.match(tweetIdRegex);
  const id = match?.[1];
  
  if (!id) return React.createElement('div', { className: 'p-4 bg-gray-100 rounded' }, 'Invalid tweet URL');
  
  return React.createElement(Tweet, { id });
};

const SubstackEmbed = ({ url }: { url: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.querySelector('script[src="https://substack.com/embedjs/embed.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://substack.com/embedjs/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      if ((window as any).SubstackFeedWidget) {
        (window as any).SubstackFeedWidget.load();
      }
    }
  }, [url]);

  return React.createElement(
    'div',
    { ref: containerRef, className: 'substack-post-embed' },
    React.createElement('a', { 'data-post-link': true, href: url })
  );
};

const GenericEmbedComponent = ({ url, platform }: { url: string; platform: Platform }) => {
  const platformLabels: Record<Platform, string> = {
    twitter: 'Twitter',
    substack: 'Substack',
    threads: 'Threads',
    bluesky: 'Bluesky',
    generic: 'Link',
  };

  const platformColors: Record<Platform, string> = {
    twitter: 'bg-blue-50 border-blue-200',
    substack: 'bg-orange-50 border-orange-200',
    threads: 'bg-gray-50 border-gray-200',
    bluesky: 'bg-sky-50 border-sky-200',
    generic: 'bg-gray-50 border-gray-200',
  };

  return React.createElement(
    'div',
    { 
      className: `p-4 rounded-lg border-2 ${platformColors[platform]} my-4`,
    },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2 mb-2' },
      React.createElement('span', { className: 'text-xs font-medium text-gray-500 uppercase' }, platformLabels[platform]),
    ),
    React.createElement(
      'a',
      { 
        href: url, 
        target: '_blank', 
        rel: 'noopener noreferrer',
        className: 'text-blue-600 hover:underline break-all text-sm',
      },
      url
    )
  );
};

const SocialEmbedComponent = ({ node }: NodeViewProps) => {
  const url = node.attrs.url;
  const platform = detectPlatform(url);

  let content;
  if (platform === 'twitter') {
    content = React.createElement(TwitterComponent, { url });
  } else if (platform === 'substack') {
    content = React.createElement(SubstackEmbed, { url });
  } else {
    content = React.createElement(GenericEmbedComponent, { url, platform });
  }

  return React.createElement(
    NodeViewWrapper,
    { className: 'social-embed my-4 flex justify-center' },
    content
  );
};

const SOCIAL_URL_REGEX = /^https:\/\/(twitter\.com|x\.com|substack\.com|threads\.net|bsky\.app)\/[^\s]+$/g;

export const TwitterEmbed = Node.create({
  name: 'socialEmbed',

  group: 'block',

  atom: true,

  draggable: true,

  addPasteRules() {
    return [
      nodePasteRule({
        find: SOCIAL_URL_REGEX,
        type: this.type,
        getAttributes: (match) => {
          return { url: match.input };
        },
      }),
    ];
  },

  addAttributes() {
    return {
      url: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-social-url]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return { url: element.getAttribute('data-social-url') };
        },
      },
      {
        tag: 'div[data-twitter-url]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return { url: element.getAttribute('data-twitter-url') };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-social-url': HTMLAttributes.url, class: 'social-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SocialEmbedComponent);
  },
});

export default TwitterEmbed;
