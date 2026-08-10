import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

export interface LanguageItem {
  id?: string;
  _id?: string;
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
  isActive: boolean;
}

interface LanguageState {
  code: string;
  name: string;
  flag: string;
  availableLanguages: LanguageItem[];
  isLoading: boolean;
  loadLanguages: () => Promise<void>;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      code: 'en',
      name: 'English',
      flag: '🇬🇧',
      availableLanguages: [
        { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true, isActive: true }
      ],
      isLoading: false,

      loadLanguages: async () => {
        set({ isLoading: true });
        try {
          const res = await apiClient.get('/languages');
          if (res.data?.success && Array.isArray(res.data.data)) {
            const languages: LanguageItem[] = res.data.data;
            set({ availableLanguages: languages });

            // If the currently selected language is not in the list of active ones, reset to default
            const currentCode = get().code;
            const stillExists = languages.find((l) => l.code === currentCode);
            if (!stillExists && languages.length > 0) {
              const defaultLang = languages.find((l) => l.isDefault) || languages[0];
              set({
                code: defaultLang.code,
                name: defaultLang.name,
                flag: defaultLang.flag
              });
            } else if (stillExists) {
              // Update name/flag if they changed
              set({
                name: stillExists.name,
                flag: stillExists.flag
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load active languages, using fallback:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      setLanguage: (code: string) => {
        const found = get().availableLanguages.find((l) => l.code === code);
        if (found) {
          set({
            code: found.code,
            name: found.name,
            flag: found.flag
          });
        }
      }
    }),
    {
      name: 'swiftcart-language',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        code: state.code,
        name: state.name,
        flag: state.flag,
        availableLanguages: state.availableLanguages
      })
    }
  )
);
