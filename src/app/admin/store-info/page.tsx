'use client';

import { useEffect, useState } from 'react';
import { storeApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { StoreInfo, ApiResponse } from '@/types';
import { Field, Input, Textarea } from '@/components/admin';
import { Save, Store } from 'lucide-react';

const emptyForm = {
  name: '', tagline: '', address: '', phone: '', whatsapp: '', email: '',
  openingHours: '', googleMapsUrl: '', googleMapsEmbed: '', facebookUrl: '',
  instagramUrl: '', twitterUrl: '', about: '',
};

export default function AdminStoreInfoPage() {
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = () => getToken() ?? '';

  useEffect(() => {
    storeApi.get().then((res) => { const r = res as ApiResponse<StoreInfo>;
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          name: d.name ?? '',
          tagline: d.tagline ?? '',
          address: d.address ?? '',
          phone: d.phone ?? '',
          whatsapp: d.whatsapp ?? '',
          email: d.email ?? '',
          openingHours: d.openingHours ?? '',
          googleMapsUrl: d.googleMapsUrl ?? '',
          googleMapsEmbed: d.googleMapsEmbed ?? '',
          facebookUrl: d.facebookUrl ?? '',
          instagramUrl: d.instagramUrl ?? '',
          twitterUrl: d.twitterUrl ?? '',
          about: d.about ?? '',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await storeApi.upsert(form, token());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Information</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Update your contact details, hours, and social media links</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: '#25D366' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4" style={{ color: '#25D366' }} />
            Basic Info
          </h2>
          <Field label="Store Name" required><Input {...f('name')} placeholder="MiniquesCare Pharmacy" /></Field>
          <Field label="Tagline"><Input {...f('tagline')} placeholder="Your trusted healthcare partner" /></Field>
          <Field label="About"><Textarea {...f('about')} placeholder="Brief description of your store..." rows={4} /></Field>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Details</h2>
          <Field label="Address"><Input {...f('address')} placeholder="123 Health Avenue, Lagos" /></Field>
          <Field label="Phone"><Input {...f('phone')} placeholder="+234 900 000 0000" /></Field>
          <Field label="WhatsApp Number" hint="International format, e.g. 2349000000000"><Input {...f('whatsapp')} placeholder="2349000000000" /></Field>
          <Field label="Email"><Input type="email" {...f('email')} placeholder="hello@miniquescare.com" /></Field>
          <Field label="Opening Hours"><Input {...f('openingHours')} placeholder="Mon–Sat: 8am–8pm, Sun: 10am–4pm" /></Field>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Google Maps</h2>
          <Field label="Google Maps URL"><Input {...f('googleMapsUrl')} placeholder="https://goo.gl/maps/..." /></Field>
          <Field label="Google Maps Embed Code" hint="Paste the <iframe> embed code from Google Maps">
            <Textarea {...f('googleMapsEmbed')} placeholder='<iframe src="..." ...></iframe>' rows={4} />
          </Field>
        </div>

        {/* Social */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Social Media</h2>
          <Field label="Facebook URL"><Input {...f('facebookUrl')} placeholder="https://facebook.com/miniquescare" /></Field>
          <Field label="Instagram URL"><Input {...f('instagramUrl')} placeholder="https://instagram.com/miniquescare" /></Field>
          <Field label="Twitter/X URL"><Input {...f('twitterUrl')} placeholder="https://twitter.com/miniquescare" /></Field>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ background: '#25D366' }}>
          Store info saved successfully!
        </div>
      )}
    </div>
  );
}
