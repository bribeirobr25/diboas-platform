'use client';

import React, { useState } from 'react';
import { Button } from '@diboas/ui';
import { getLogoAsset } from '@/lib/assets';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={getLogoAsset('icon')}
              alt="diBoaS"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-neutral-900">diBoaS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium flex items-center space-x-1"
                >
                  <span>{item.label}</span>
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                
                {/* Mega menu dropdown */}
                {item.label === 'Features' && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-neutral-900">Financial Domains</h3>
                          <div className="grid grid-cols-1 gap-3">
                            <Link href="#banking" className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 h-auto justify-start transition-colors">
                              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-1">
                                <div className="w-4 h-4 bg-primary-500 rounded" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">Banking</p>
                                <p className="text-sm text-neutral-600">Traditional banking services</p>
                              </div>
                            </Link>
                            <Link href="#investing" className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary-purple-50 h-auto justify-start transition-colors">
                              <div className="w-8 h-8 bg-secondary-purple-100 rounded-lg flex items-center justify-center mt-1">
                                <div className="w-4 h-4 bg-secondary-purple-500 rounded" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">Investing</p>
                                <p className="text-sm text-neutral-600">Crypto & portfolio management</p>
                              </div>
                            </Link>
                            <Link href="#defi" className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary-coral-50 h-auto justify-start transition-colors">
                              <div className="w-8 h-8 bg-secondary-coral-100 rounded-lg flex items-center justify-center mt-1">
                                <div className="w-4 h-4 bg-secondary-coral-500 rounded" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">DeFi</p>
                                <p className="text-sm text-neutral-600">Decentralized finance protocols</p>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button variant="primary" size="sm">
              Sign up
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-neutral-200 bg-white">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-neutral-200">
              <Button variant="ghost" size="sm" className="w-full">
                Sign in
              </Button>
              <Button variant="primary" size="sm" className="w-full">
                Sign up
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}