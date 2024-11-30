import { Button } from '@/components/ui/button';

interface LanguageSelectorProps {
  onLanguageChange: (lang: 'en' | 'es') => void;
  currentLanguage: 'en' | 'es';
}

export const LanguageSelector = ({ onLanguageChange, currentLanguage }: LanguageSelectorProps) => {
  return (
    <div className="flex space-x-1">
      <Button
        size="sm"
        variant={currentLanguage === 'en' ? 'default' : 'outline'}
        className="h-6 px-2 text-xs"
        onClick={() => onLanguageChange('en')}
      >
        EN
      </Button>
      <Button
        size="sm"
        variant={currentLanguage === 'es' ? 'default' : 'outline'}
        className="h-6 px-2 text-xs"
        onClick={() => onLanguageChange('es')}
      >
        ES
      </Button>
    </div>
  );
};