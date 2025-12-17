import { useState, useMemo, useRef } from 'react';
import { X, FileText } from 'lucide-react';
import { marked } from 'marked';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const Delta = Quill.import('delta');

interface ArticleFormProps {
  article?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'script',
  'color', 'background',
  'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'align',
  'link', 'image', 'video'
];

export function ArticleForm({ article, onClose, onSubmit }: ArticleFormProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [title, setTitle] = useState(article?.title || '');
  const [author, setAuthor] = useState(article?.author || '');
  const [content, setContent] = useState(article?.content || '');
  const [thumbnail, setThumbnail] = useState(article?.thumbnail || '');
  const [category, setCategory] = useState(article?.category || 'elections');
  const [price, setPrice] = useState(article?.price !== undefined ? String(article.price) : '99');
  const [featured, setFeatured] = useState(Boolean(article?.featured));
  const [useFile, setUseFile] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!article;

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
      matchers: [
        ['ol', (node: HTMLElement, delta: any) => {
          const newOps: any[] = [];
          delta.ops.forEach((op: any) => {
            if (typeof op.insert === 'string' && op.insert.includes('\n')) {
              const parts = op.insert.split('\n');
              parts.forEach((part: string, idx: number) => {
                if (part) {
                  newOps.push({ insert: part, attributes: op.attributes });
                }
                if (idx < parts.length - 1) {
                  newOps.push({ insert: '\n', attributes: { ...op.attributes, list: 'ordered' } });
                }
              });
            } else {
              newOps.push(op);
            }
          });
          if (newOps.length > 0) {
            const lastOp = newOps[newOps.length - 1];
            if (typeof lastOp.insert === 'string' && !lastOp.insert.endsWith('\n')) {
              newOps.push({ insert: '\n', attributes: { list: 'ordered' } });
            }
          }
          return new Delta(newOps);
        }],
        ['ul', (node: HTMLElement, delta: any) => {
          const newOps: any[] = [];
          delta.ops.forEach((op: any) => {
            if (typeof op.insert === 'string' && op.insert.includes('\n')) {
              const parts = op.insert.split('\n');
              parts.forEach((part: string, idx: number) => {
                if (part) {
                  newOps.push({ insert: part, attributes: op.attributes });
                }
                if (idx < parts.length - 1) {
                  newOps.push({ insert: '\n', attributes: { ...op.attributes, list: 'bullet' } });
                }
              });
            } else {
              newOps.push(op);
            }
          });
          if (newOps.length > 0) {
            const lastOp = newOps[newOps.length - 1];
            if (typeof lastOp.insert === 'string' && !lastOp.insert.endsWith('\n')) {
              newOps.push({ insert: '\n', attributes: { list: 'bullet' } });
            }
          }
          return new Delta(newOps);
        }]
      ]
    }
  }), []);

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkdownUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const markdownText = reader.result as string;
        const htmlContent = await marked.parse(markdownText);
        setContent(htmlContent);
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
    try {
      await onSubmit({
        title,
        author,
        content: content,
        summary: generateSummary(content),
        thumbnail: thumbnail || null,
        category,
        price: parseInt(price) || 99,
        featured: featured ? 1 : 0,
        publishedAt: new Date(),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-slate-300 mb-2 text-sm font-medium">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="Author name"
              required
              data-testid="input-article-author"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-slate-300 mb-2 text-sm font-medium">Price (in cents)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="99"
              data-testid="input-article-price"
            />
            <p className="text-xs text-slate-500 mt-1">Price in cents (e.g., 99 = $0.99, 199 = $1.99)</p>
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
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="https://..."
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer file:font-medium"
              />
              {thumbnail && (
                <div className="mt-3">
                  <img src={thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-700" />
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
          <div className="bg-white rounded-lg overflow-hidden">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              style={{ height: '400px' }}
              modules={quillModules}
              formats={quillFormats}
              data-testid="input-article-content"
            />
          </div>
          <p className="text-slate-500 text-xs mt-14">
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
