'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { blogsApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Blog, ApiResponse, PagedResult } from '@/types';
import {
  AdminHeader, AdminSearch, AdminTable, Modal, Field,
  Input, Textarea, StatusBadge, DeleteConfirm, ImageUploadZone,
} from '@/components/admin';
import { Eye, EyeOff, ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';

// This matches the full blog response with all images
interface BlogDetail {
  id: number;
  authorId: number;
  authorName?: string;
  title: string;
  summary?: string;
  content: string;
  images: Array<{
    url: string;
    publicId: string;
    isPrimary: boolean;
  }>;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// This matches the summary response (for listing)
interface BlogSummary {
  id: number;
  title: string;
  summary?: string;
  coverImageUrl?: string;
  imageCount: number; 
  status: string;
  publishedAt?: string;
}

const emptyForm = { title: '', summary: '', content: '' };

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<BlogSummary | null>(null);
  const [imgBlog, setImgBlog] = useState<BlogDetail | null>(null);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  const isMounted = useRef<boolean>(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!isMounted.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      const token = getToken() ?? '';
      // Get the summary list (which includes coverImageUrl)
      const res = (await blogsApi.getAll(page, pageSize, undefined, token)) as ApiResponse<PagedResult<BlogSummary>>;
      if (isMounted.current && res.success && res.data) { 
        setBlogs(res.data.items); 
        setTotalCount(res.data.total); 
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally { 
      if (isMounted.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  const fetchBlogDetail = useCallback(async (blogId: number): Promise<BlogDetail> => {
    // Get the full blog details with all images
    const res = await blogsApi.getById(blogId);
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch blog details');
  }, []);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(async (index: number) => {
    const blog = blogs[index];
    setEditId(blog.id);
    
    try {
      // Fetch full blog details to get the content
      const detail = await fetchBlogDetail(blog.id);
      setForm({ 
        title: detail.title, 
        summary: detail.summary ?? '', 
        content: detail.content ?? '' 
      });
    } catch (error) {
      console.error('Failed to load blog details:', error);
      // Fallback to summary data if detail fetch fails
      setForm({ 
        title: blog.title, 
        summary: blog.summary ?? '', 
        content: '' 
      });
    }
    setModalOpen(true);
  }, [blogs, fetchBlogDetail]);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!form.content.trim()) {
      alert('Content is required');
      return;
    }

    setSaving(true);
    try {
      const token = getToken() ?? '';
      if (editId) {
        await blogsApi.update(editId, { title: form.title, summary: form.summary, content: form.content }, token);
      } else {
        await blogsApi.create({ title: form.title, summary: form.summary, content: form.content }, token);
      }
      setModalOpen(false);
      setForm({ ...emptyForm });
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      console.error('Failed to save blog:', error);
      alert('Failed to save blog post. Please try again.');
    } finally { 
      setSaving(false);
    }
  }, [editId, form, fetchData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const token = getToken() ?? '';
      await blogsApi.delete(deleteTarget.id, token);
      setDeleteTarget(null);
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      console.error('Failed to delete blog:', error);
      alert('Failed to delete blog post. Please try again.');
    } finally { 
      setSaving(false);
    }
  }, [deleteTarget, fetchData]);

  const togglePublish = useCallback(async (blog: BlogSummary) => {
    try {
      const token = getToken() ?? '';
      if (blog.status === 'Published') {
        await blogsApi.unpublish(blog.id, token);
      } else {
        await blogsApi.publish(blog.id, token);
      }
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update publish status. Please try again.');
    }
  }, [fetchData]);

  const openImageManager = useCallback(async (blog: BlogSummary) => {
    try {
      // Fetch full blog details to get all images
      const detail = await fetchBlogDetail(blog.id);
      setImgBlog(detail);
      setImgFiles([]);
    } catch (error) {
      console.error('Failed to load blog images:', error);
      alert('Failed to load images. Please try again.');
    }
  }, [fetchBlogDetail]);

  const handleUploadImages = useCallback(async () => {
    if (!imgBlog || imgFiles.length === 0) return;
    
    setUploadingImages(true);
    try {
      const token = getToken() ?? '';
      const fd = new FormData();
      imgFiles.forEach((f) => fd.append('files', f));
      await blogsApi.uploadImages(imgBlog.id, fd, token);
      
      // Refresh the image list
      const updatedBlog = await fetchBlogDetail(imgBlog.id);
      setImgBlog(updatedBlog);
      setImgFiles([]);
      
      // Refresh the main blog list to update cover image
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Failed to upload images. Please try again.');
    } finally { 
      setUploadingImages(false);
    }
  }, [imgBlog, imgFiles, fetchBlogDetail, fetchData]);

  const handleDeleteImage = useCallback(async (blog: BlogDetail, publicId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const token = getToken() ?? '';
      await blogsApi.deleteImage(blog.id, publicId, token);
      
      // Refresh the image list
      const updatedBlog = await fetchBlogDetail(blog.id);
      setImgBlog(updatedBlog);
      
      // Refresh the main blog list to update cover image
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image. Please try again.');
    }
  }, [fetchBlogDetail, fetchData]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const filtered = blogs.filter((b) => 
    b.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(totalCount / pageSize);
  const showPagination = totalPages > 1 && !loading;

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Blog Posts" 
        subtitle={`${totalCount} article${totalCount !== 1 ? 's' : ''}`} 
        onAdd={openCreate} 
        addLabel="New Post" 
      />
      <AdminSearch 
        value={search} 
        onChange={handleSearchChange} 
        placeholder="Search posts by title..." 
      />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading posts...</div>
      ) : (
        <>
          <AdminTable
            columns={['Title', 'Status', 'Published', 'Images', 'Actions']}
            rows={filtered.map((b) => [
              <span key="t" className="font-medium text-gray-900 line-clamp-2 max-w-md">
                {b.title}
              </span>,
              <StatusBadge key="s" status={b.status} />,
              b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('en-NG') : 'Draft',
              <button 
                key="img" 
                onClick={() => openImageManager(b)} 
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {b.imageCount} {b.imageCount === 1 ? 'img' : 'imgs'}
              </button>,
              <div key="actions" className="flex gap-1">
                <button
                  onClick={() => togglePublish(b)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                  title={b.status === 'Published' ? 'Unpublish' : 'Publish'}
                >
                  {b.status === 'Published' ? 
                    <EyeOff className="w-4 h-4" /> : 
                    <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            ])}
            onEdit={(i) => openEdit(i)}
            onDelete={(i) => setDeleteTarget(blogs[i])}
          />

          {showPagination && (
            <div className="flex gap-2 justify-center mt-6">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)} 
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)} 
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        open={modalOpen} 
        title={editId ? 'Edit Post' : 'New Blog Post'} 
        onClose={() => {
          setModalOpen(false);
          setForm({ ...emptyForm });
        }} 
        onSubmit={handleSave} 
        loading={saving}
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              placeholder="Enter post title..."
              className="text-lg font-medium"
            />
          </Field>
          
      <Field 
          label="Summary" 
          hint="Shown in blog listing previews"
        >
          <Textarea 
            value={form.summary} 
            onChange={(e) => setForm({ ...form, summary: e.target.value })} 
            placeholder="Write a brief summary of your post..."
            rows={3}
            className="resize-y"
          />
        </Field>
          
          <Field label="Content (HTML)" required>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b text-xs text-gray-500">
                Write your blog content using HTML
              </div>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                placeholder="<p>Your blog content here...</p>"
                rows={15}
                className="font-mono text-sm resize-y"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Tip: Use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt; for formatting
            </p>
          </Field>
        </div>
      </Modal>

      {/* Image Manager Modal */}
      <Modal 
        open={!!imgBlog} 
        title={`Manage Images — ${imgBlog?.title}`} 
        onClose={() => {
          setImgBlog(null);
          setImgFiles([]);
        }} 
        onSubmit={handleUploadImages} 
        submitLabel="Upload Images"
        loading={uploadingImages}
      >
        <div className="space-y-4">
          {/* Existing Images */}
          {imgBlog?.images && imgBlog.images.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Existing Images ({imgBlog.images.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imgBlog.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <Image 
                        src={img.url} 
                        alt={`Blog image ${i + 1}`} 
                        fill 
                        className="object-cover"
                      />
                      {img.isPrimary && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteImage(imgBlog, img.publicId)} 
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No images uploaded yet</p>
            </div>
          )}
          
          {/* Upload New Images */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Upload New Images</h4>
            <ImageUploadZone onChange={setImgFiles} />
            {imgFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {imgFiles.length} file(s) selected, ready to upload
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imgFiles.map((file, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>PNG, JPG, WEBP formats supported (max 10MB each)</li>
              <li>The first image uploaded will be set as the cover image</li>
              <li>Images will be displayed in your blog post in the order uploaded</li>
            </ul>
          </div>
        </div>
      </Modal>

      <DeleteConfirm 
        open={!!deleteTarget} 
        label={deleteTarget?.title ?? ''} 
        onConfirm={handleDelete} 
        onClose={() => setDeleteTarget(null)} 
        loading={saving} 
      />
    </div>
  );
}