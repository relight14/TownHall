import { Node, mergeAttributes } from '@tiptap/core';

export const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '315',
      },
      frameborder: {
        default: '0',
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: () => this.options.allowFullscreen,
      },
      allow: {
        default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      },
      title: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
      {
        tag: 'div.iframe-wrapper iframe',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const iframe = node as HTMLIFrameElement;
          return {
            src: iframe.getAttribute('src'),
            width: iframe.getAttribute('width') || '100%',
            height: iframe.getAttribute('height') || '315',
            title: iframe.getAttribute('title') || '',
          };
        },
      },
      {
        tag: 'div.iframe-wrapper',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const wrapper = node as HTMLDivElement;
          const iframe = wrapper.querySelector('iframe');
          if (!iframe) return false;
          return {
            src: iframe.getAttribute('src'),
            width: iframe.getAttribute('width') || '100%',
            height: iframe.getAttribute('height') || '315',
            title: iframe.getAttribute('title') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      frameborder: '0',
      allowfullscreen: 'true',
    })];
  },
});

export default Iframe;
