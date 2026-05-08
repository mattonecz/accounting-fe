import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  years: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const MonthSelector = ({
  selectedMonth,
  selectedYear,
  years,
  onMonthChange,
  onYearChange,
  onPrevious,
  onNext,
}: MonthSelectorProps) => {
  const { t } = useTranslation();
  const months = Array.from({ length: 12 }, (_, i) => t(`taxReport.months.${i}`));

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold min-w-[180px] text-center">
          {months[selectedMonth]} {selectedYear}
        </div>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={selectedMonth.toString()}
        onValueChange={(value) => onMonthChange(Number(value))}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, index) => (
            <SelectItem key={index} value={index.toString()}>
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger className="w-[100px]">
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
