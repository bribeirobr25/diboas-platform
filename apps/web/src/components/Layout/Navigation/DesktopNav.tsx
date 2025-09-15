'use client';

// Desktop UI only

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { NavigationConfig } from '@/types/navigation';
import { Container, FlexBetween, SparklesIcon, ChevronRightIcon } from '@/components/UI';

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
    <nav className="navigation-bar" onMouseLeave={closeMenu}>
      <Container>
        <FlexBetween className="navigation-content">
          {/* Logo */}
          <Link href="/" className="brand-logo">
            <Image
              src="/assets/logos/logo-icon.avif"
              alt="diBoaS"
              width={76}
              height={76}
              style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
            />
          </Link>

          {/* Main Menu */}
          <div className="menu-items">
            {config.mainMenu.map((item) => (
              <button
                key={item.id}
                className="menu-link group"
                onMouseEnter={() => {
                  openMenu(item.id);
                  trackNavigationInteraction(item.id, 'hover');
                }}
              >
                {item.icon && <SparklesIcon />}
                <span className="font-bold text-sm">{item.label}</span>
                <ChevronRightIcon size="xs" className="rotate-90 transition-transform group-hover:rotate-[270deg]" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="menu-items">
            <Link
              href={config.actions.secondary.href}
              className="menu-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('business-login', 'click')}
            >
              {config.actions.secondary.label}
            </Link>
            <Link
              href={config.actions.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('get-started', 'click')}
              className="inline-block"
            >
              <Button
                variant="gradient"
                size="sm"
                className="desktop-get-started-button"
              >
                {config.actions.primary.label}
              </Button>
            </Link>
          </div>
        </FlexBetween>
      </Container>

      {/* Mega Menu */}
      {activeMenu && activeMenuItem && (
        <div
          className="absolute left-0 w-full overflow-hidden"
          style={{
            top: '80px',
          }}
        >
          <div className="dropdown-menu" style={{ height: '60vh' }}>
            <Container className="dropdown-content h-full" style={{ marginLeft: '150px' }}>
              <div className="dropdown-section grid-cols-12 gap-8 h-full">
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
                  <h3 className="dropdown-title">
                    {activeMenuItem.label}
                  </h3>
                  <p className="dropdown-item-description">
                    {activeMenuItem.description}
                  </p>
                </div>

                {/* Right: Sub-menu items in columns */}
                <div className="col-span-8">
                  <div className="dropdown-items grid-cols-2 gap-x-5 gap-y-3">
                    {activeMenuItem.subItems?.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className="dropdown-item group"
                        onClick={() => trackNavigationInteraction(subItem.id, 'click')}
                      >
                        <div>
                          <h4 className="dropdown-item-title">
                            {subItem.label}
                          </h4>
                          {subItem.description && (
                            <p className="dropdown-item-description mt-1">
                              {subItem.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      )}
    </nav>
  );
}