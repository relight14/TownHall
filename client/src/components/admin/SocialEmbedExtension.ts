import { NodeViewProps, NodeViewWrapper, nodePasteRule, ReactNodeViewRenderer } from '@tiptap/react';
import { mergeAttributes, Node } from '@tiptap/core';
import { Tweet } from 'react-tweet';
import React, { useEffect, useState } from 'react';

type Platform = 'twitter' | 'substack' | 'threads' | 'bluesky' | 'instagram' | 'generic';

function detectPlatform(url: string): Platform {
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  if (/substack\.com/.test(url)) return 'substack';
  if (/threads\.net/.test(url)) return 'threads';
  if (/bsky\.app/.test(url)) return 'bluesky';
  if (/(www\.)?instagram\.com/.test(url)) return 'instagram';
  return 'generic';
}

const TwitterComponent = ({ url }: { url: string }) => {
  const tweetIdRegex = /\/status\/(\d+)/;
  const match = url.match(tweetIdRegex);
  const id = match?.[1];
  
  if (!id) return React.createElement('div', { className: 'p-4 bg-gray-100 rounded' }, 'Invalid tweet URL');
  
  return React.createElement(Tweet, { id });
};

const SubstackIcon = () => React.createElement(
  'svg',
  { width: '20', height: '20', viewBox: '0 0 24 24', fill: '#FF6719' },
  React.createElement('path', { d: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z' })
);

const ThreadsIcon = () => React.createElement(
  'svg',
  { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'currentColor' },
  React.createElement('path', { d: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.022.88-.73 2.132-1.13 3.628-1.154 1.041-.017 1.996.086 2.862.31-.034-.79-.178-1.417-.43-1.873-.352-.637-.94-.963-1.747-.97h-.042c-.627 0-1.427.2-1.96.6-.392.294-.612.66-.674 1.117l-2.043-.275c.127-.952.576-1.778 1.298-2.39.893-.756 2.088-1.155 3.456-1.155h.052c1.58.016 2.794.59 3.608 1.707.715.982 1.058 2.328 1.022 4.005.455.27.865.605 1.218 1.003.752.847 1.166 1.937 1.233 3.241.082 1.597-.322 3.017-1.203 4.224-1.03 1.413-2.582 2.313-4.613 2.676-.56.1-1.14.149-1.727.152zm-1.7-7.636c-.036 0-.072 0-.109.002-.93.024-1.633.266-2.033.7-.322.35-.471.775-.443 1.262.037.678.36 1.222.933 1.574.593.364 1.38.534 2.212.478 1.053-.057 1.862-.443 2.405-1.147.409-.53.698-1.236.86-2.1-.692-.186-1.452-.286-2.273-.286-.517 0-1.04.035-1.552.116v-.599z' })
);

const BlueskyIcon = () => React.createElement(
  'svg',
  { width: '20', height: '20', viewBox: '0 0 24 24', fill: '#0085FF' },
  React.createElement('path', { d: 'M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z' })
);

const InstagramIcon = () => React.createElement(
  'svg',
  { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'url(#instagram-gradient)' },
  React.createElement('defs', null,
    React.createElement('linearGradient', { id: 'instagram-gradient', x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
      React.createElement('stop', { offset: '0%', stopColor: '#FFDC80' }),
      React.createElement('stop', { offset: '50%', stopColor: '#F56040' }),
      React.createElement('stop', { offset: '100%', stopColor: '#833AB4' })
    )
  ),
  React.createElement('path', { d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' })
);

const GenericEmbedComponent = ({ url, platform }: { url: string; platform: Platform }) => {
  const platformConfig: Record<Platform, { label: string; bg: string; border: string; text: string; icon: React.ReactNode | null }> = {
    twitter: { label: 'Twitter', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: null },
    substack: { label: 'Substack', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600', icon: React.createElement(SubstackIcon) },
    threads: { label: 'Threads', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', icon: React.createElement(ThreadsIcon) },
    bluesky: { label: 'Bluesky', bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-600', icon: React.createElement(BlueskyIcon) },
    instagram: { label: 'Instagram', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-600', icon: React.createElement(InstagramIcon) },
    generic: { label: 'Link', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: null },
  };

  const config = platformConfig[platform];

  return React.createElement(
    'div',
    { 
      className: `p-4 rounded-xl border-2 ${config.bg} ${config.border} my-4 max-w-md mx-auto shadow-sm`,
    },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2 mb-3' },
      config.icon,
      React.createElement('span', { className: `text-sm font-semibold ${config.text}` }, config.label),
    ),
    React.createElement(
      'a',
      { 
        href: url, 
        target: '_blank', 
        rel: 'noopener noreferrer',
        className: `block ${config.text} hover:underline break-all text-sm mb-3`,
      },
      url
    ),
    React.createElement(
      'a',
      { 
        href: url, 
        target: '_blank', 
        rel: 'noopener noreferrer',
        className: `inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.border} border ${config.text} hover:opacity-80 transition-opacity`,
      },
      `View on ${config.label} →`
    )
  );
};

const SocialEmbedComponent = ({ node }: NodeViewProps) => {
  const url = node.attrs.url;
  const platform = detectPlatform(url);

  return React.createElement(
    NodeViewWrapper,
    { className: 'social-embed my-4 flex justify-center' },
    platform === 'twitter'
      ? React.createElement(TwitterComponent, { url })
      : React.createElement(GenericEmbedComponent, { url, platform })
  );
};

const SOCIAL_URL_REGEX = /^https:\/\/(twitter\.com|x\.com|substack\.com|threads\.net|bsky\.app|(www\.)?instagram\.com)\/[^\s]+$/g;

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
