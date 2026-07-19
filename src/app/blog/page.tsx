'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { blogsApi } from '@/lib/api';
import type { BlogSummary, PagedResult, ApiResponse } from '@/types';
import { PageHero, SearchBar, Spinner, EmptyState, Pagination } from '@/components/ui';
import { Calendar, ArrowRight, MessageCircle } from 'lucide-react';

interface BlogCardProps {
  blog: BlogSummary;
}

function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link 
      href={`/blog/${blog.id}`} 
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
    >
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {blog.coverImageUrl ? (
          <Image
            src={blog.coverImageUrl}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
          >
            <span className="font-display text-4xl font-bold opacity-20" style={{ color: '#25D366' }}>
              MC
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {blog.publishedAt 
              ? new Date(blog.publishedAt).toLocaleDateString('en-NG', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                }) 
              : 'Unpublished'
            }
          </span>
        </div>
        <h3 className="font-display font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors text-lg">
          {blog.title}
        </h3>
        {blog.summary && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">
            {blog.summary}
          </p>
        )}
        <span className="inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2" style={{ color: '#25D366' }}>
          Read more 
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogSummary[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const pageSize = 12;

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

  // Fetch blog posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogsApi.getAll(page, pageSize) as ApiResponse<PagedResult<BlogSummary>>;
      if (res.success && res.data) {
        setPosts(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Filter posts based on search
  const filteredPosts = search
    ? posts.filter((post) => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.summary?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const totalPages = Math.ceil(totalCount / pageSize);
  
  // WhatsApp link with pre-filled message
  const whatsappMessage = encodeURIComponent(
    `Hello MiniquesCare! I have a health question and would like to speak with a pharmacist.`
  );
  const whatsappLink = phoneNumber ? `https://wa.me/${phoneNumber}?text=${whatsappMessage}` : '#';

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      <PageHero
        title="Health Blog"
        subtitle="Expert insights on medications, wellness tips, and healthcare news from the MiniquesCare team."
        image="https://res.cloudinary.com/danksdxj8/image/upload/v1774452271/biologist-woman-examining-biological-slide-medical-expertise-using-microscope_xo2jc3.jpg"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="max-w-md w-full sm:w-auto flex-1">
            <SearchBar 
              value={search} 
              onChange={handleSearch} 
              placeholder="Search articles by title or summary..." 
            />
          </div>
          
          {/* Chat with Pharmacist Button */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm ${
              phoneNumber 
                ? 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]' 
                : 'opacity-50 cursor-not-allowed pointer-events-none'
            }`}
            style={{ background: '#25D366' }}
            onClick={(e) => !phoneNumber && e.preventDefault()}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Pharmacist</span>
          </a>
        </div>

        {/* Results Count */}
        {!loading && filteredPosts.length > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            Showing {filteredPosts.length} of {totalCount} article{totalCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState 
            message={search ? "No articles match your search." : "No blog posts published yet."} 
          />
        ) : (
          <>
            {/* Blog Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} blog={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination 
                  page={page} 
                  totalPages={totalPages} 
                  onPage={setPage} 
                />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}