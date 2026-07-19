"use client";
import Link from 'next/link';
import { Cross, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [storeData, setStoreData] = useState({
    name: "",
    tagline: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    openingHours: "",
    googleMapsUrl: "",
    googleMapsEmbed: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    about: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';
        const apiResponse = await fetch(`${API_URL}/api/v1/store-info`);
        const response = await apiResponse.json();

        if (response.success) {
          setStoreData({
            name: response.data?.name,
            tagline: response.data?.tagline,
            address: response.data?.address,
            phone: response.data?.phone,
            whatsapp: response.data?.whatsapp,
            email: response.data?.email,
            openingHours: response.data?.openingHours,
            googleMapsUrl: response.data?.googleMapsUrl,
            googleMapsEmbed: response.data?.googleMapEmbed,
            facebookUrl: response.data?.facebookUrl ?? "",
            instagramUrl: response.data?.instagramUrl ?? "",
            twitterUrl: response.data?.twittweUrl ?? "",
            about: response.data?.about ?? "Minique's Care Pharmacy and Stores (M-Care) is your trusted one-stop shop for quality medicines, accurate laboratory diagnostics, and everyday grocery essentials. We are committed to making healthcare accessible, affordable, and convenient for every family.",
          });
        } else {
          console.log('❌ No WhatsApp number found in API');
        }
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="w-full px-6 sm:px-10 lg:px-16 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 lg:justify-between">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#25D366' }}
              >
                <Cross className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Miniques<span style={{ color: '#25D366' }}>Care</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {storeData.about}
            </p>
            <div className="flex gap-3 mt-5">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${storeData.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-opacity hover:opacity-80"
                style={{ background: '#25D366' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/pharmacy', label: 'Pharmacy' },
                { href: '/laboratory', label: 'Laboratory' },
                { href: '/supermarket', label: 'Supermarket' },
                { href: '/blog', label: 'Health Blog' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-white transition-colors"
                    style={{ color: 'inherit' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Drug Dispensing</li>
              <li>Free Blood Pressure Check</li>
              <li>Diagnostic Lab Tests</li>
              <li>Prescription Filling</li>
              <li>Health Consultation</li>
              <li>Grocery & Essentials</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#25D366' }} />
                <a href={storeData.googleMapsUrl} target='_blank' rel="noopener noreferrer">{storeData.address?.length> 0 ?storeData.address:  "123 Health Avenue, Lagos, Nigeria"}</a>
              </li>
              <li className="flex gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#25D366' }} />
                <a href={`tel:${storeData.whatsapp}`} className="hover:text-white transition-colors">
                  {storeData.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#25D366' }} />
                <a
                  href={`mailto:${storeData.email}`}
                  className="hover:text-white transition-colors"
                >
                  {storeData.email}
                </a>
              </li>
              <li className="flex gap-2">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#25D366' }} />
                <span>{storeData.openingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MiniquesCare. All rights reserved.</p>
          <Link
            href="/admin"
            className="hover:text-gray-300 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}