'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { blogsApi } from '@/lib/api';
import type { Blog, ApiResponse } from '@/types';
import { Spinner } from '@/components/ui';
import { ArrowLeft, Calendar, User, MessageCircle } from 'lucide-react';

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();

  // Fetch store info for WhatsApp number
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';
        const response = await fetch(`${API_URL}/api/v1/store-info`);
        const data = await response.json();
        
        if (data.success && data.data?.whatsapp) {
          const cleanedNumber = data.data.whatsapp.replace(/[^0-9]/g, '');
          setPhoneNumber(cleanedNumber);
        }
      } catch (error) {
        console.error('Failed to fetch store info:', error);
      }
    };

    fetchStoreInfo();
  }, []);

  // Fetch blog post
  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const res = await blogsApi.getById(Number(id)) as ApiResponse<Blog>;
        if (res.success && res.data) {
          setBlog(res.data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Failed to fetch blog post:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  // WhatsApp link with pre-filled message based on blog content
  const whatsappMessage = encodeURIComponent(
    `Hello MiniquesCare! I just read your blog post "${blog?.title || 'health article'}" and have a question. Could a pharmacist please help me?`
  );
  const whatsappLink = phoneNumber ? `https://wa.me/${phoneNumber}?text=${whatsappMessage}` : '#';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Blog post not found.</p>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = blog.images?.[0]?.url;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Back to Blog
      </Link>

      {coverImage && (
        <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
          <Image 
            src={coverImage} 
            alt={blog.title} 
            fill 
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
        {blog.authorName && (
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" /> {blog.authorName}
          </span>
        )}
        {blog.publishedAt && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(blog.publishedAt).toLocaleDateString('en-NG', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        )}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
      {blog.summary && (
        <p className="text-lg text-gray-500 border-l-4 pl-4 mb-8 italic" style={{ borderColor: '#25D366' }}>
          {blog.summary}
        </p>
      )}

      <div
        className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-green-600"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* More images */}
      {blog.images && blog.images.length > 1 && (
        <div className="mt-10 grid grid-cols-2 gap-4">
          {blog.images.slice(1).map((img, i) => (
            <div key={i} className="relative h-48 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <Image 
                src={img.url} 
                alt={`${blog.title} - image ${i + 2}`} 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-4">Have questions about your health?</p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all ${
            phoneNumber 
              ? 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]' 
              : 'opacity-50 cursor-not-allowed pointer-events-none'
          }`}
          style={{ background: '#25D366' }}
          onClick={(e) => !phoneNumber && e.preventDefault()}
        >
          <MessageCircle className="w-5 h-5" />
          Chat with our Pharmacist
        </a>
        <p className="text-xs text-gray-400 mt-3">
          Get expert advice from our licensed pharmacists
        </p>
      </div>
    </article>
  );
}