import { Node, mergeAttributes } from '@tiptap/core';

export const SocialEmbed = Node.create({
  name: 'socialEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rawHtml: {
        default: '',
      },
      platform: {
        default: 'twitter',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote.twitter-tweet',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            rawHtml: element.outerHTML,
            platform: 'twitter',
          };
        },
      },
      {
        tag: 'blockquote.instagram-media',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            rawHtml: element.outerHTML,
            platform: 'instagram',
          };
        },
      },
      {
        tag: 'blockquote.tiktok-embed',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            rawHtml: element.outerHTML,
            platform: 'tiktok',
          };
        },
      },
      {
        tag: 'div.social-embed-wrapper',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            rawHtml: element.getAttribute('data-raw-html') || element.innerHTML,
            platform: element.getAttribute('data-platform') || 'twitter',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { rawHtml, platform } = HTMLAttributes;
    return ['div', mergeAttributes({
      class: 'social-embed-wrapper',
      'data-platform': platform,
      'data-raw-html': rawHtml,
    }), ['div', { class: 'social-embed-content' }]];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'social-embed-wrapper my-4 flex justify-center';
      dom.setAttribute('data-platform', node.attrs.platform);
      
      const content = document.createElement('div');
      content.className = 'social-embed-content';
      content.innerHTML = node.attrs.rawHtml;
      dom.appendChild(content);

      setTimeout(() => {
        if (node.attrs.platform === 'twitter' && (window as any).twttr) {
          (window as any).twttr.widgets.load(dom);
        }
        if (node.attrs.platform === 'instagram' && (window as any).instgrm) {
          (window as any).instgrm.Embeds.process(dom);
        }
      }, 100);

      return {
        dom,
        contentDOM: null,
      };
    };
  },
});

export default SocialEmbed;
