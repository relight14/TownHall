import { useState, useCallback, useRef, useEffect } from 'react';
import { X, FileText, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Heading4, Type, Upload, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import HardBreak from '@tiptap/extension-hard-break';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Youtube from '@tiptap/extension-youtube';
import { Iframe } from './IframeExtension';
import { TwitterEmbed } from './SocialEmbedExtension';
import { useUpload } from '@/hooks/use-upload';
import { useVideoStore } from '@/context/VideoStoreContext';

function cleanPastedHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const allowedStyles = ['text-align', 'text-decoration'];
  const socialEmbedClasses = ['twitter-tweet', 'instagram-media', 'fb-post', 'tiktok-embed'];
  
  doc.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const currentClass = el.getAttribute('class') || '';
    const computedStyle = htmlEl.style;
    const preservedStyles: string[] = [];
    
    const isSocialEmbed = socialEmbedClasses.some(cls => currentClass.includes(cls));
    
    allowedStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        preservedStyles.push(`${prop}: ${value}`);
      }
    });
    
    el.removeAttribute('style');
    
    if (isSocialEmbed) {
      // Keep classes for social media embeds
    } else {
      el.removeAttribute('class');
    }
    
    if (preservedStyles.length > 0) {
      htmlEl.setAttribute('style', preservedStyles.join('; '));
    }
  });
  
  doc.querySelectorAll('span').forEach((span) => {
    const hasUnderline = span.style.textDecoration?.includes('underline');
    const hasImportantStyle = span.getAttribute('style');
    
    if (!hasUnderline && !hasImportantStyle) {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    }
  });
  
  doc.querySelectorAll('div').forEach((div) => {
    const hasMedia = div.querySelector('img, iframe, video, blockquote.twitter-tweet, blockquote.instagram-media');
    if (!hasMedia) {
      const p = document.createElement('p');
      const style = div.getAttribute('style');
      if (style) p.setAttribute('style', style);
      p.innerHTML = div.innerHTML;
      div.parentNode?.replaceChild(p, div);
    }
  });
  
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }
  
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    if (parent && parent.nodeName === 'BODY') {
      const p = document.createElement('p');
      p.textContent = textNode.textContent;
      parent.replaceChild(p, textNode);
    }
  });
  
  return doc.body.innerHTML;
}

interface ArticleFormProps {
  article?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

function MenuBar({ editor }: { editor: any }) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  
  if (!editor) return null;

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCurrentColor(color);
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-300 bg-slate-100 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 4 }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Heading 4"
      >
        <Heading4 className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('bold') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('italic') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('underline') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={addLink}
        className={`p-2 rounded hover:bg-slate-200 transition-colors ${editor.isActive('link') ? 'bg-slate-300 text-blue-600' : 'text-slate-600'}`}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded hover:bg-slate-200 transition-colors text-slate-600"
        title="Add Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
      
      <div className="relative">
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="p-2 rounded hover:bg-slate-200 transition-colors text-slate-600 flex flex-col items-center justify-center"
          title="Text Color"
        >
          <Type className="w-4 h-4" />
          <div 
            className="w-4 h-1 mt-0.5 rounded-sm" 
            style={{ backgroundColor: currentColor }}
          />
        </button>
        <input
          ref={colorInputRef}
          type="color"
          value={currentColor}
          onChange={handleColorChange}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
      </div>
    </div>
  );
}

export function ArticleForm({ article, onClose, onSubmit }: ArticleFormProps) {
  const { adminToken } = useVideoStore();
  const [title, setTitle] = useState(article?.title || '');
  const [subheader, setSubheader] = useState(article?.subheader || '');
  const [thumbnail, setThumbnail] = useState(article?.thumbnail || '');
  const [category, setCategory] = useState(article?.category || 'elections');
  const [price, setPrice] = useState(article?.price !== undefined ? (article.price / 100).toFixed(2) : '0.99');
  const [featured, setFeatured] = useState(Boolean(article?.featured));
  const [publishedAt, setPublishedAt] = useState(
    article?.publishedAt 
      ? new Date(article.publishedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [useFile, setUseFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { uploadFile, isUploading } = useUpload({
    getAdminToken: () => adminToken,
    onSuccess: (response) => {
      setThumbnail(response.objectPath);
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });
  
  const isEditing = !!article;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        hardBreak: false,
      }),
      HardBreak.configure({
        keepMarks: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
      TextStyle,
      Color,
      Youtube.configure({
        addPasteHandler: true,
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'w-full max-w-2xl mx-auto rounded-lg',
        },
      }),
      Iframe,
      TwitterEmbed,
    ],
    content: article?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 [&>p]:mb-4 [&>p:last-child]:mb-0',
      },
      transformPastedHTML(html) {
        return cleanPastedHtml(html);
      },
    },
  });

  // Update all form fields when article prop changes (e.g., when full content loads after admin auth)
  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSubheader(article.subheader || '');
      setThumbnail(article.thumbnail || '');
      setCategory(article.category || 'elections');
      setPrice(article.price !== undefined ? (article.price / 100).toFixed(2) : '0.99');
      setFeatured(Boolean(article.featured));
      setPublishedAt(
        article.publishedAt 
          ? new Date(article.publishedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    }
  }, [article?.id, article?.content]);

  // Update editor content when article content changes
  useEffect(() => {
    if (editor && article?.content) {
      const currentContent = editor.getHTML();
      if (currentContent !== article.content && article.content.trim().length > 0) {
        editor.commands.setContent(article.content);
      }
    }
  }, [editor, article?.content]);

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadError(null);
      await uploadFile(file);
    }
  };

  const handleMarkdownUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const markdownText = reader.result as string;
        const htmlContent = await marked.parse(markdownText);
        editor?.commands.setContent(htmlContent);
      };
      reader.readAsText(file);
    }
  };

  const generateSummary = (htmlText: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const cleaned = plainText.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ').trim();
    return summary.length > 350 ? summary.substring(0, 347) + '...' : (summary || cleaned.substring(0, 350));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const content = editor?.getHTML() || '';
    try {
      await onSubmit({
        title,
        subheader,
        content,
        summary: generateSummary(content),
        thumbnail: thumbnail || null,
        category,
        price: Math.round(parseFloat(price) * 100) || 99,
        featured: featured ? 1 : 0,
        publishedAt: new Date(publishedAt),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-white font-semibold">{isEditing ? 'Edit Article' : 'New Article'}</h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Article Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            placeholder="Enter article title"
            required
            data-testid="input-article-title"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Subheader</label>
          <input
            type="text"
            value={subheader}
            onChange={(e) => setSubheader(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            placeholder="Article subtitle or tagline"
            required
            data-testid="input-article-subheader"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              data-testid="select-article-category"
            >
              <option value="elections">Elections</option>
              <option value="policy">Policy</option>
              <option value="candidate-rankings">Candidate Rankings</option>
              <option value="speech-analysis">Speech Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="0.99"
              data-testid="input-article-price"
            />
            <p className="text-xs text-slate-500 mt-1">Enter price in dollars (e.g., 0.99, 1.50, 2.00)</p>
          </div>
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Published Date</label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              data-testid="input-article-published-date"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Thumbnail Image</label>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setUseFile(false)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                !useFile 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setUseFile(true)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                useFile 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Upload File
            </button>
          </div>
          {!useFile ? (
            <input
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="https://... or public/images/..."
            />
          ) : (
            <div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  disabled={isUploading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer file:font-medium disabled:opacity-50"
                />
                {isUploading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-red-400 text-sm mt-2">{uploadError}</p>
              )}
              {thumbnail && !isUploading && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-700" />
                  <span className="text-green-400 text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    Image uploaded
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-slate-300 text-sm font-medium">Article Content</label>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer transition-colors">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Upload .md file</span>
              <input
                type="file"
                accept=".md,text/markdown"
                onChange={handleMarkdownUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="bg-white rounded-lg overflow-hidden border border-slate-300">
            <MenuBar editor={editor} />
            <EditorContent 
              editor={editor} 
              className="min-h-[400px]"
              data-testid="input-article-content"
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Paste formatted content directly, or upload a .md file. Images and links will be preserved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
              data-testid="checkbox-article-featured"
            />
            <span className="text-slate-300 text-sm">Featured article (appears prominently on homepage)</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-colors border border-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 rounded-lg transition-all font-medium shadow-lg shadow-red-600/20 disabled:opacity-50"
            data-testid="button-save-article"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </form>
    </div>
  );
}
