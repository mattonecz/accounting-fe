import { useTranslation } from 'react-i18next';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

  return (
    <>
      <DropdownMenuLabel>{t('settings.menu.language')}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={i18n.language}
        onValueChange={(v) => i18n.changeLanguage(v)}
      >
        <DropdownMenuRadioItem value="cs">Čeština</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
};
