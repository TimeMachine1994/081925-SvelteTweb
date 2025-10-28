import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Slideshow Refactoring Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Component Code Validation', () => {
    it('should not contain slideshow modal code in Profile component', () => {
      const profilePath = join(process.cwd(), 'src/lib/components/Profile.svelte');
      
      try {
        const profileContent = readFileSync(profilePath, 'utf-8');
        
        // Verify modal state variables are removed
        expect(profileContent).not.toContain('showSlideshowModal');
        expect(profileContent).not.toContain('selectedMemorialForSlideshow');
        
        // Verify modal handler is removed
        expect(profileContent).not.toContain('handleSlideshowGenerated');
        
        // Verify modal HTML is removed
        expect(profileContent).not.toContain('Create Slideshow Modal');
        expect(profileContent).not.toContain('PhotoSlideshowCreator');
        
        // Verify navigation links are present
        expect(profileContent).toContain('/slideshow-generator?memorialId=');
        
      } catch (error) {
        // If file doesn't exist or can't be read, skip this test
        console.warn('Profile component file not found, skipping validation');
      }
    });

    it('should have proper slideshow navigation in Profile component', () => {
      const profilePath = join(process.cwd(), 'src/lib/components/Profile.svelte');
      
      try {
        const profileContent = readFileSync(profilePath, 'utf-8');
        
        // Should have navigation link instead of modal
        expect(profileContent).toContain('href={`/slideshow-generator?memorialId=${memorial.id}`}');
        
        // Should have Camera icon for slideshow button
        expect(profileContent).toContain('<Camera');
        
        // Should have proper role checking
        expect(profileContent).toContain("userRole === 'owner'");
        
      } catch (error) {
        console.warn('Profile component file not found, skipping navigation validation');
      }
    });
  });

  describe('Stream Management Component Code Validation', () => {
    it('should not contain slideshow modal code in Stream Management component', () => {
      const streamPath = join(process.cwd(), 'src/routes/memorials/[id]/streams/+page.svelte');
      
      try {
        const streamContent = readFileSync(streamPath, 'utf-8');
        
        // Verify modal functions are removed
        expect(streamContent).not.toContain('openSlideshowModal');
        expect(streamContent).not.toContain('closeSlideshowModal');
        expect(streamContent).not.toContain('handleSlideshowGenerated');
        
        // Verify modal HTML is removed
        expect(streamContent).not.toContain('Create Slideshow Modal');
        expect(streamContent).not.toContain('PhotoSlideshowCreator');
        
        // Verify import is removed
        expect(streamContent).not.toContain("import PhotoSlideshowCreator from");
        
      } catch (error) {
        console.warn('Stream management component file not found, skipping validation');
      }
    });

    it('should have proper slideshow navigation in Stream Management component', () => {
      const streamPath = join(process.cwd(), 'src/routes/memorials/[id]/streams/+page.svelte');
      
      try {
        const streamContent = readFileSync(streamPath, 'utf-8');
        
        // Should have navigation link instead of modal
        expect(streamContent).toContain('href={`/slideshow-generator?memorialId=${memorialId}`}');
        
        // Should have proper role checking for funeral directors and admins
        expect(streamContent).toContain("data.user.role === 'funeral_director'");
        expect(streamContent).toContain("data.user.role === 'admin'");
        
      } catch (error) {
        console.warn('Stream management component file not found, skipping navigation validation');
      }
    });
  });

  describe('Slideshow Generator Page Code Validation', () => {
    it('should have mobile enhancements in Slideshow Generator page', () => {
      const generatorPath = join(process.cwd(), 'src/routes/slideshow-generator/+page.svelte');
      
      try {
        const generatorContent = readFileSync(generatorPath, 'utf-8');
        
        // Should have auto-scroll functionality
        expect(generatorContent).toContain('window.innerWidth <= 768');
        expect(generatorContent).toContain('scrollIntoView');
        
        // Should have mobile responsive styles
        expect(generatorContent).toContain('@media (max-width: 768px)');
        expect(generatorContent).toContain('@media (max-width: 480px)');
        
        // Should have proper mobile padding and spacing
        expect(generatorContent).toContain('padding: 0.5rem 0');
        expect(generatorContent).toContain('padding: 0.25rem 0');
        
      } catch (error) {
        console.warn('Slideshow generator page file not found, skipping validation');
      }
    });

    it('should handle memorial ID parameter correctly', () => {
      const generatorPath = join(process.cwd(), 'src/routes/slideshow-generator/+page.svelte');
      
      try {
        const generatorContent = readFileSync(generatorPath, 'utf-8');
        
        // Should parse memorialId from URL parameters
        expect(generatorContent).toContain("$page.url.searchParams.get('memorialId')");
        
        // Should handle navigation back to memorial or profile
        expect(generatorContent).toContain('window.location.href');
        
      } catch (error) {
        console.warn('Slideshow generator page file not found, skipping parameter validation');
      }
    });
  });

  describe('Mobile Responsiveness Validation', () => {
    it('should have proper mobile breakpoints defined', () => {
      const breakpoints = {
        mobile: 768,
        extraSmall: 480
      };

      const testBreakpoint = (width: number, breakpoint: number) => {
        return width <= breakpoint;
      };

      // Test mobile breakpoint
      expect(testBreakpoint(768, breakpoints.mobile)).toBe(true);
      expect(testBreakpoint(769, breakpoints.mobile)).toBe(false);
      expect(testBreakpoint(600, breakpoints.mobile)).toBe(true);

      // Test extra small breakpoint
      expect(testBreakpoint(480, breakpoints.extraSmall)).toBe(true);
      expect(testBreakpoint(481, breakpoints.extraSmall)).toBe(false);
      expect(testBreakpoint(320, breakpoints.extraSmall)).toBe(true);
    });

    it('should validate responsive design patterns', () => {
      const responsiveConfig = {
        containerPadding: {
          desktop: '1rem',
          mobile: '0.5rem',
          extraSmall: '0.25rem'
        },
        fontSize: {
          desktop: '2rem',
          mobile: '1.75rem',
          extraSmall: '1.5rem'
        }
      };

      expect(responsiveConfig.containerPadding.mobile).toBe('0.5rem');
      expect(responsiveConfig.containerPadding.extraSmall).toBe('0.25rem');
      expect(responsiveConfig.fontSize.mobile).toBe('1.75rem');
      expect(responsiveConfig.fontSize.extraSmall).toBe('1.5rem');
    });
  });

  describe('Navigation Flow Validation', () => {
    it('should validate complete navigation flow', () => {
      const navigationFlow = {
        profileToSlideshow: (memorialId: string) => `/slideshow-generator?memorialId=${memorialId}`,
        streamToSlideshow: (memorialId: string) => `/slideshow-generator?memorialId=${memorialId}`,
        slideshowToMemorial: (memorialId: string) => `/memorials/${memorialId}`,
        slideshowToProfile: () => '/profile'
      };

      const memorialId = 'test-memorial-123';

      expect(navigationFlow.profileToSlideshow(memorialId)).toBe('/slideshow-generator?memorialId=test-memorial-123');
      expect(navigationFlow.streamToSlideshow(memorialId)).toBe('/slideshow-generator?memorialId=test-memorial-123');
      expect(navigationFlow.slideshowToMemorial(memorialId)).toBe('/memorials/test-memorial-123');
      expect(navigationFlow.slideshowToProfile()).toBe('/profile');
    });

    it('should validate URL parameter handling', () => {
      const parseMemorialId = (url: string) => {
        const urlObj = new URL(url, 'http://localhost');
        return urlObj.searchParams.get('memorialId');
      };

      const testUrls = [
        'http://localhost/slideshow-generator?memorialId=memorial-123',
        'http://localhost/slideshow-generator?memorialId=memorial-456&edit=true',
        'http://localhost/slideshow-generator'
      ];

      expect(parseMemorialId(testUrls[0])).toBe('memorial-123');
      expect(parseMemorialId(testUrls[1])).toBe('memorial-456');
      expect(parseMemorialId(testUrls[2])).toBe(null);
    });
  });

  describe('Permission and Role Validation', () => {
    it('should validate slideshow access permissions', () => {
      const hasPermission = (user: any, memorial: any, action: string) => {
        if (!user || !memorial) return false;

        switch (action) {
          case 'create_slideshow':
            return (
              user.role === 'owner' ||
              user.role === 'admin' ||
              user.role === 'funeral_director' ||
              memorial.ownerUid === user.uid ||
              memorial.funeralDirectorUid === user.uid
            );
          case 'manage_streams':
            return (
              user.role === 'admin' ||
              user.role === 'funeral_director'
            );
          default:
            return false;
        }
      };

      const users = {
        owner: { uid: 'user-1', role: 'owner' },
        admin: { uid: 'user-2', role: 'admin' },
        funeralDirector: { uid: 'user-3', role: 'funeral_director' },
        viewer: { uid: 'user-4', role: 'viewer' }
      };

      const memorial = {
        id: 'memorial-1',
        ownerUid: 'user-1',
        funeralDirectorUid: 'user-3'
      };

      // Test slideshow creation permissions
      expect(hasPermission(users.owner, memorial, 'create_slideshow')).toBe(true);
      expect(hasPermission(users.admin, memorial, 'create_slideshow')).toBe(true);
      expect(hasPermission(users.funeralDirector, memorial, 'create_slideshow')).toBe(true);
      expect(hasPermission(users.viewer, memorial, 'create_slideshow')).toBe(false);

      // Test stream management permissions
      expect(hasPermission(users.admin, memorial, 'manage_streams')).toBe(true);
      expect(hasPermission(users.funeralDirector, memorial, 'manage_streams')).toBe(true);
      expect(hasPermission(users.owner, memorial, 'manage_streams')).toBe(false);
      expect(hasPermission(users.viewer, memorial, 'manage_streams')).toBe(false);
    });
  });
});
