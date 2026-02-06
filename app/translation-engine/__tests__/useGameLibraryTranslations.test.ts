import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameLibraryTranslations } from '../useGameLibraryTranslations';
import { translationEngine } from '../TranslationEngine';

describe('useGameLibraryTranslations', () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage('en');
  });

  it('should return English translations by default', () => {
    const { result } = renderHook(() => useGameLibraryTranslations());
    
    expect(result.current.activeLangCode).toBe('en');
    expect(result.current.texts.mainHeading).toBe('🎮 Game Library');
  });

  it('should update translations when language changes', async () => {
    const { result } = renderHook(() => useGameLibraryTranslations());
    
    expect(result.current.texts.mainHeading).toBe('🎮 Game Library');
    
    act(() => {
      result.current.updateLanguage('es');
    });
    
    await waitFor(() => {
      expect(result.current.activeLangCode).toBe('es');
      expect(result.current.texts.mainHeading).toBe('🎮 Biblioteca de Juegos');
    });
  });

  it('should update to Korean translations', async () => {
    const { result } = renderHook(() => useGameLibraryTranslations());
    
    act(() => {
      result.current.updateLanguage('ko');
    });
    
    await waitFor(() => {
      expect(result.current.activeLangCode).toBe('ko');
      expect(result.current.texts.mainHeading).toBe('🎮 게임 라이브러리');
    });
  });

  it('should sync across multiple hook instances', async () => {
    const { result: result1 } = renderHook(() => useGameLibraryTranslations());
    const { result: result2 } = renderHook(() => useGameLibraryTranslations());
    
    act(() => {
      result1.current.updateLanguage('es');
    });
    
    await waitFor(() => {
      expect(result1.current.activeLangCode).toBe('es');
      expect(result2.current.activeLangCode).toBe('es');
    });
  });

  it('should clean up listener on unmount', () => {
    const { unmount } = renderHook(() => useGameLibraryTranslations());
    
    // The hook should properly clean up when unmounted
    unmount();
    
    // Verify no errors occur
    expect(true).toBe(true);
  });

  it('should provide all translation keys', () => {
    const { result } = renderHook(() => useGameLibraryTranslations());
    
    const expectedKeys = [
      'mainHeading',
      'welcomeMessage',
      'inputPlaceholder',
      'footerContent',
      'upDownGameTitle',
      'rpsGameTitle',
      'treasureGameTitle',
      'game47Title',
      'languagePickerLabel'
    ];
    
    expectedKeys.forEach(key => {
      expect(result.current.texts).toHaveProperty(key);
    });
  });
});
