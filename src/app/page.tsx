"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

/* ─── Hero ─────────────────────────────────────────────────────────────── */
function Hero({ phoneNumber, about }: { phoneNumber?: string; about?: string }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Green blob accent */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full opacity-5"
        style={{
          background: 'radial-gradient(ellipse at top right, #25D366 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-14 items-start">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 border" style={{ borderColor: '#25D366', color: '#128C7E', background: '#f0fdf4' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#25D366' }} />
            Your Trusted Healthcare Partner
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Health &amp; Wellness{' '}
            <span style={{ color: '#25D366' }}>Simplified</span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
            {about ||
              'Skip the multiple stops. Pick up your medications, speak with a licensed pharmacist, run a lab test, and shop for everyday essentials — all under one roof, with free BP checks every day. Genuine products, fast turnaround, and a team that actually knows your name.'}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/pharmacy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              Shop Pharmacy <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/${phoneNumber ?? ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat with Us
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-gray-100">
            {[
              { num: '5,000+', label: 'Drugs in stock' },
              { num: '50+', label: 'Lab tests' },
              { num: 'Free', label: 'BP checks' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold font-display" style={{ color: '#25D366' }}>{s.num}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image grid */}
        <div className="hidden lg:grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="relative h-56 rounded-2xl overflow-hidden">
              <Image
                src="https://res.cloudinary.com/danksdxj8/image/upload/v1774451997/african-american-pharmacist-providing-personalized-pharmacist-service-medication-guidance_v4wvab.jpg"
                alt="Pharmacy consultation"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-36 rounded-2xl overflow-hidden">
              <Image
                src="https://res.cloudinary.com/danksdxj8/image/upload/v1774452275/closeup-biologist-chemist-holding-medical-test-tube-with-blood-developing-virus-treatment-biochemistry-experiment-scientist-doctor-working-healthcare-treatment-clinical-laboratory_orm7sc.jpg"
                alt="Lab test"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="space-y-4 mt-8">
            <div className="relative h-36 rounded-2xl overflow-hidden">
              <Image
                src="https://res.cloudinary.com/danksdxj8/image/upload/v1774451423/nappy-dcBO4nt4MRE-unsplash_cay7km.jpg"
                alt="Blood pressure check"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-56 rounded-2xl overflow-hidden">
              <Image
                src="https://res.cloudinary.com/danksdxj8/image/upload/v1774449575/WhatsApp_Image_2026-03-23_at_06.53.08_oigtgd.jpg"
                alt="Supermarket items"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [about, setAbout] = useState<string | undefined>();

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';
    fetch(`${API_URL}/api/v1/store-info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.whatsapp) {
          setPhoneNumber(data.data.whatsapp.replace(/[^0-9]/g, ''));
        }
        if (data.success && data.data?.about) {
          setAbout(data.data.about);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <Hero phoneNumber={phoneNumber} about={about} />
    </>
  );
}