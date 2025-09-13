'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NavigationConfig } from '@/types/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';

interface DesktopNavProps {
  activeMenu: string | null;
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  config: NavigationConfig;
  isMobile: boolean;
}

export default function DesktopNav({ 
  activeMenu, 
  openMenu, 
  closeMenu, 
  trackNavigationInteraction,
  config,
  isMobile 
}: DesktopNavProps) {
  if (isMobile) return null;

  const activeMenuItem = config.mainMenu.find(item => item.id === activeMenu);

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50" onMouseLeave={closeMenu}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/assets/logos/logo-icon.avif"
              alt="diBoaS"
              width={76}
              height={76}
              style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
            />
          </Link>

          {/* Main Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {config.mainMenu.map((item) => (
              <button
                key={item.id}
                className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors py-2 relative group"
                onMouseEnter={() => {
                  openMenu(item.id);
                  trackNavigationInteraction(item.id, 'hover');
                }}
              >
                {item.icon && <Sparkles className="w-4 h-4" />}
                <span className="font-bold text-sm">{item.label}</span>
                <ChevronRight className="w-3 h-3 rotate-90 transition-transform group-hover:rotate-[270deg]" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-8">
            <Link 
              href={config.actions.secondary.href}
              className="text-gray-600 hover:text-teal-600 font-medium text-xs transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('business-login', 'click')}
            >
              {config.actions.secondary.label}
            </Link>
            <Link 
              href={config.actions.primary.href}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2 rounded-xl font-semibold text-xs hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('get-started', 'click')}
            >
              {config.actions.primary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      {activeMenu && activeMenuItem && (
        <div 
          className="absolute left-0 w-full overflow-hidden"
          style={{ 
            top: '80px',
          }}
        >
          <div 
            className="w-full bg-white shadow-2xl border-t animate-slide-down-fade"
            style={{ height: '60vh' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full" style={{ marginLeft: '150px' }}>
            <div className="grid grid-cols-12 gap-8 h-full">
              {/* Left: Banner */}
              <div className="col-span-4">
                <div className="relative h-48 mb-4 rounded-2xl overflow-hidden">
                  <Image 
                    src={activeMenuItem.banner || ''}
                    alt={activeMenuItem.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeMenuItem.label}
                </h3>
                <p className="text-gray-600">
                  {activeMenuItem.description}
                </p>
              </div>

              {/* Right: Sub-menu items in columns */}
              <div className="col-span-8">
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  {activeMenuItem.subItems?.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className="group block p-4 rounded-xl transition-colors"
                      onClick={() => trackNavigationInteraction(subItem.id, 'click')}
                    >
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 group-hover:text-teal-600 transition-colors">
                          {subItem.label}
                        </h4>
                        {subItem.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {subItem.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </nav>
  );
}