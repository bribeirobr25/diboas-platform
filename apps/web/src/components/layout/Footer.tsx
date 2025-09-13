'use client';

import React from 'react';
import { getLogoAsset, getMascotAsset } from '@/lib/assets';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';

export function Footer() {
  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Banking', href: '#banking' },
        { label: 'Investing', href: '#investing' },
        { label: 'DeFi', href: '#defi' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'API Documentation', href: '/docs' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Help Center', href: '/help' },
        { label: 'Community', href: '/community' },
        { label: 'Webinars', href: '/webinars' },
        { label: 'Status Page', href: '/status' },
        { label: 'Release Notes', href: '/releases' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press Kit', href: '/press' },
        { label: 'Partners', href: '/partners' },
        { label: 'Investors', href: '/investors' },
        { label: 'Contact', href: '/contact' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Security Policy', href: '/security' },
        { label: 'Compliance', href: '/compliance' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'GDPR', href: '/gdpr' },
      ]
    }
  ];

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/diboas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/diboas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      )
    },
    {
      name: 'GitHub',
      href: 'https://github.com/diboas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/diboas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M16.942 4.556a16.3 16.3 0 00-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 00-4.573 0 11.585 11.585 0 00-.535-1.097 16.274 16.274 0 00-4.129 1.3C.846 7.667.017 10.7.017 13.669c0 .011 0 .022.006.033a16.421 16.421 0 005.063 2.576c.408-.558.771-1.156 1.082-1.785a10.633 10.633 0 01-1.706-.83c.143-.106.283-.217.418-.33a11.664 11.664 0 0010.118 0c.137.113.277.224.418.33-.544.328-1.116.606-1.71.832a12.52 12.52 0 001.084 1.785 16.46 16.46 0 005.064-2.595.074.074 0 00.006-.016c.5-3.413-.838-6.37-3.549-9.01zM6.678 11.429c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.201 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm6.644 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.201 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z" />
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-6 gap-12">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Image
                src={getLogoAsset('icon')}
                alt="diBoaS"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-2xl font-bold">diBoaS</span>
            </Link>
            
            <p className="text-neutral-400 mb-8 leading-relaxed">
              The future of finance, unified in one platform. Banking, investing, and DeFi - 
              powered by AI-driven insights and secured by enterprise-grade technology.
            </p>
            
            {/* Mascots */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="text-center">
                <Image
                  src={getMascotAsset('acqua', 'simple')}
                  alt="Acqua - Banking"
                  width={40}
                  height={40}
                  className="mx-auto mb-1"
                />
                <p className="text-xs text-neutral-500">Acqua</p>
              </div>
              <div className="text-center">
                <Image
                  src={getMascotAsset('mystic', 'simple')}
                  alt="Mystic - Investing"
                  width={40}
                  height={40}
                  className="mx-auto mb-1"
                />
                <p className="text-xs text-neutral-500">Mystic</p>
              </div>
              <div className="text-center">
                <Image
                  src={getMascotAsset('coral', 'simple')}
                  alt="Coral - DeFi"
                  width={40}
                  height={40}
                  className="mx-auto mb-1"
                />
                <p className="text-xs text-neutral-500">Coral</p>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Newsletter */}
        <div className="py-8 border-t border-neutral-800">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-lg font-semibold text-white mb-2">
                Stay updated with diBoaS
              </h3>
              <p className="text-neutral-400 text-sm">
                Get the latest news, updates, and insights delivered to your inbox.
              </p>
            </div>
            
            <div className="flex max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-l-xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500"
              />
              <Button variant="primary" className="rounded-r-xl rounded-l-none">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="py-8 border-t border-neutral-800">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="text-neutral-400 text-sm mb-4 lg:mb-0">
              © 2025 diBoaS Platform. All rights reserved.
            </div>
            
            <div className="flex flex-wrap items-center space-x-6">
              <Link href="/privacy" className="text-neutral-400 hover:text-primary-400 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-neutral-400 hover:text-primary-400 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-neutral-400 hover:text-primary-400 transition-colors text-sm">
                Cookie Policy
              </Link>
              <div className="flex items-center space-x-2 text-sm text-neutral-400">
                <svg className="w-4 h-4 text-semantic-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}