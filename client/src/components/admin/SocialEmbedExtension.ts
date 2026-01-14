import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const TWITTER_URL_REGEX = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

export const SocialEmbed = Node.create({
  name: 'socialEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
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
          const link = element.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
          const url = link?.getAttribute('href') || '';
          return {
            url,
            platform: 'twitter',
          };
        },
      },
      {
        tag: 'div.social-embed-wrapper',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            url: element.getAttribute('data-url') || '',
            platform: element.getAttribute('data-platform') || 'twitter',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { url, platform } = HTMLAttributes;
    return ['div', mergeAttributes({
      class: 'social-embed-wrapper',
      'data-platform': platform,
      'data-url': url,
    }), ['div', { class: 'social-embed-content' }]];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'social-embed-wrapper my-4 flex justify-center';
      dom.setAttribute('data-platform', node.attrs.platform);
      dom.setAttribute('data-url', node.attrs.url);
      
      const content = document.createElement('div');
      content.className = 'social-embed-content';
      
      if (node.attrs.platform === 'twitter' && node.attrs.url) {
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'twitter-tweet';
        const link = document.createElement('a');
        link.href = node.attrs.url;
        blockquote.appendChild(link);
        content.appendChild(blockquote);
        
        dom.appendChild(content);
        
        const loadTwitterWidget = () => {
          if ((window as any).twttr?.widgets) {
            (window as any).twttr.widgets.load(dom);
          } else {
            if (!document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
              const script = document.createElement('script');
              script.src = 'https://platform.twitter.com/widgets.js';
              script.async = true;
              script.onload = () => {
                (window as any).twttr?.widgets?.load(dom);
              };
              document.body.appendChild(script);
            } else {
              setTimeout(loadTwitterWidget, 100);
            }
          }
        };
        
        setTimeout(loadTwitterWidget, 50);
      } else {
        content.textContent = `Embed: ${node.attrs.url}`;
        dom.appendChild(content);
      }

      return {
        dom,
        contentDOM: null,
      };
    };
  },

  addProseMirrorPlugins() {
    const nodeType = this.type;
    
    return [
      new Plugin({
        key: new PluginKey('socialEmbedPaste'),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain') || '';
            const match = text.match(TWITTER_URL_REGEX);
            
            if (match) {
              const url = match[0];
              const { tr } = view.state;
              const node = nodeType.create({ url, platform: 'twitter' });
              
              const { from, to } = view.state.selection;
              tr.replaceRangeWith(from, to, node);
              view.dispatch(tr);
              
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },
});

export default SocialEmbed;
