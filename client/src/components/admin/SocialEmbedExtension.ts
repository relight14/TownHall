import { NodeViewProps, NodeViewWrapper, nodePasteRule, ReactNodeViewRenderer } from '@tiptap/react';
import { mergeAttributes, Node } from '@tiptap/core';
import { Tweet } from 'react-tweet';
import React from 'react';

const TweetComponent = ({ node }: NodeViewProps) => {
  const url = node.attrs.url;
  const tweetIdRegex = /\/status\/(\d+)/g;
  const id = tweetIdRegex.exec(url)?.[1];

  return React.createElement(
    NodeViewWrapper,
    { className: 'twitter-embed my-4' },
    React.createElement(Tweet, { id: id || '' })
  );
};

export const TwitterEmbed = Node.create({
  name: 'twitter',

  group: 'block',

  atom: true,

  draggable: true,

  addPasteRules() {
    const twitterUrl = /^https:\/\/(twitter\.com|x\.com)\/.*\/status\/.*/g;

    return [
      nodePasteRule({
        find: twitterUrl,
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
    return ['div', mergeAttributes({ 'data-twitter-url': HTMLAttributes.url, class: 'twitter-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetComponent);
  },
});

export default TwitterEmbed;
