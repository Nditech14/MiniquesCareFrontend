"use client";
import Navbar from "./Navbar";
import React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import { CartProvider } from "@/context/CartContext";
import SpotlightDeals from "@/components/SpotlightDeals";
import PharmacistButton from "@/components/Pharmacistbutton";

export default function HomePage({ children }: { children: React.ReactNode }) {
    const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    useEffect(() => {
        const fetchStoreInfo = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${API_URL}/api/v1/store-info`);
                const data = await response.json();

                if (data.success && data.data?.whatsapp) {
                    let number = data.data.whatsapp.replace(/[^0-9]/g, '');
                    setWhatsappNumber(number);
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
        <CartProvider>
            <Navbar phoneNumber={whatsappNumber ?? ""} />
            <main>{children}</main>
            {isHomePage && <SpotlightDeals phoneNumber={whatsappNumber ?? undefined} />}
            <Footer />
            <PharmacistButton />
            <WhatsAppButton phoneNumber={whatsappNumber ?? ""} loading={loading}/>
        </CartProvider>
    );
}