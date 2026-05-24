import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  years: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export const MonthSelector = ({
  selectedMonth,
  selectedYear,
  years,
  onMonthChange,
  onYearChange,
}: MonthSelectorProps) => {
  const { t } = useTranslation();
  const months = Array.from({ length: 12 }, (_, i) => t(`taxReport.months.${i}`));
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedMonth.toString()}
        onValueChange={(value) => onMonthChange(Number(value))}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, index) => (
            <SelectItem key={index} value={index.toString()}>
              {capitalize(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
