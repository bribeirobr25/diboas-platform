'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { NavigationConfig } from '@/types/navigation';
import { useEffect } from 'react';
import { NavigationToggle, ChevronRightIcon, ChevronLeftIcon } from '@/components/ui';

interface MobileNavProps {
  isOpen: boolean;
  activeMenu: string | null;
  activeSubmenu: string | null;
  toggleMenu: () => void;
  openMenu: (menuId: string) => void;
  openSubmenu: (submenuId: string) => void;
  closeMenu: () => void;
  goBack: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  config: NavigationConfig;
  isMobile: boolean;
}

export default function MobileNav({ 
  isOpen,
  activeMenu,
  activeSubmenu,
  toggleMenu,
  openMenu,
  openSubmenu,
  closeMenu,
  goBack,
  trackNavigationInteraction,
  config,
  isMobile 
}: MobileNavProps) {
  const activeMenuItem = config.mainMenu.find(item => item.id === activeSubmenu);

  // Scroll to top when submenu opens
  useEffect(() => {
    if (activeSubmenu) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Reset both window scroll and submenu container scroll
        window.scrollTo({ top: 0, behavior: 'instant' });
        const submenuContainer = document.querySelector('[data-submenu-scroll]');
        if (submenuContainer) {
          submenuContainer.scrollTop = 0;
        }
      }, 50);
    }
  }, [activeSubmenu]);

  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="px-4 py-2 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <Image 
              src="/assets/logos/logo-icon.avif"
              alt="diBoaS"
              width={56}
              height={56}
              style={{ width: 'auto', height: '56px' }}
            />
          </Link>

          <Link 
            href={config.actions.primary.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNavigationInteraction('get-started-mobile', 'click')}
            className="inline-block"
          >
            <Button
              variant="gradient"
              size="xs"
            >
              {config.actions.primary.label}
            </Button>
          </Link>

          <button
            onClick={toggleMenu}
            className="p-2"
            aria-label="Toggle menu"
          >
            <NavigationToggle isOpen={isOpen} />
          </button>
        </div>
      </nav>

      {/* Fixed Business Login Button - Only show when not in submenu */}
      {isOpen && !activeSubmenu && (
        <Link
          href={config.actions.secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNavigationInteraction('business-login-mobile', 'click')}
          className="fixed bottom-0 left-0 right-0 z-50 block"
        >
          <Button
            variant="gradient"
            size="lg"
            className="w-full rounded-none text-center py-4"
          >
            {config.actions.secondary.label}
          </Button>
        </Link>
      )}

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-white transition-transform ${activeSubmenu ? 'z-50' : 'z-40'}`}
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className={`h-full overflow-y-auto ${!activeSubmenu ? 'pt-16 pb-20' : ''}`}>
          {!activeSubmenu ? (
            /* Main Mobile Menu */
            <div className="px-4 py-6">
              {/* Highlights */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-teal-600 tracking-wider mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {config.mobileHighlights.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      className="bg-gray-50 rounded-xl p-4 text-center flex items-center justify-center min-h-[83px]"
                      onClick={() => {
                        trackNavigationInteraction(item.id, 'click');
                        toggleMenu();
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Sections */}
              {config.mobileSections.map((section) => (
                <div key={section.title} className="mb-8">
                  <h3 className="text-base font-semibold text-teal-600 tracking-wider mb-4">
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const menuItem = config.mainMenu.find(m => m.id === item.id);
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => {
                              openSubmenu(item.id);
                              trackNavigationInteraction(item.id, 'open');
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-2xl font-bold text-gray-900">
                              {item.label}
                            </span>
                            <ChevronRightIcon className="text-gray-400" />
                          </button>
                          {config.mainMenu.find(m => m.id === item.id)?.description && (
                            <p className="text-base text-gray-600 px-4 pb-2">
                              {config.mainMenu.find(m => m.id === item.id)?.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Additional Menu Items */}
              <div className="border-t pt-6 space-y-2">
                {['security', 'about'].map(id => {
                  const item = config.mainMenu.find(m => m.id === id);
                  if (!item) return null;
                  
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          openSubmenu(item.id);
                          trackNavigationInteraction(item.id, 'open');
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg font-bold text-gray-900">
                          {item.label}
                        </span>
                        <ChevronRightIcon className="text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Submenu View */
            <div 
              className="h-full flex flex-col bg-white overflow-y-auto animate-slide-from-right" 
              data-submenu-scroll
            >
              {/* Sticky Header with Back and Close buttons */}
              <div className="sticky top-0 flex items-center justify-between px-4 py-4 border-b bg-teal-50 z-50">
                <button
                  onClick={goBack}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeftIcon />
                  <span className="font-medium">Back</span>
                </button>
                <button
                  onClick={toggleMenu}
                  className="p-2"
                  aria-label="Close menu"
                >
                  <NavigationToggle isOpen={true} />
                </button>
              </div>

              {/* Sticky Banner */}
              {activeMenuItem && (
                <div className="sticky bg-teal-50 w-full z-30" style={{ top: '65px', height: '56vh' }}>
                  <div className="h-full flex flex-col">
                    {activeMenuItem.banner && (
                      <div className="px-4 pt-4">
                        <div className="relative w-full max-w-md mx-auto aspect-[3/2] overflow-hidden rounded-2xl">
                          <Image 
                            src={activeMenuItem.banner}
                            alt={activeMenuItem.label}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 384px, 384px"
                            priority
                          />
                        </div>
                      </div>
                    )}
                    <div className="px-6 pt-4 pb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activeMenuItem.label}
                      </h2>
                      {activeMenuItem.description && (
                        <p className="text-gray-600">
                          {activeMenuItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Scrollable Submenu Items */}
              <div className="px-4 py-6 space-y-2 bg-white relative z-10">
                {activeMenuItem?.subItems?.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    className="block p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      trackNavigationInteraction(subItem.id, 'click');
                      toggleMenu();
                    }}
                  >
                    <h4 className="font-bold text-gray-900">{subItem.label}</h4>
                    {subItem.description && (
                      <p className="text-sm text-gray-600 mt-1">{subItem.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}