import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil, Star } from 'lucide-react';
import type { BankResponseDto } from '@/api/model';
import { cn } from '@/lib/utils';

const getAccountIdentifier = (account: Pick<BankResponseDto, 'number' | 'iban'>) =>
  account.number || account.iban || '-';

interface BankAccountCardProps {
  account: BankResponseDto;
  onEdit: (account: BankResponseDto) => void;
  onSetDefault: (account: BankResponseDto) => void;
}

export const BankAccountCard = ({ account, onEdit, onSetDefault }: BankAccountCardProps) => (
  <Card
    className={cn(
      'transition-shadow hover:shadow-md',
      account.default && 'border-primary/40 shadow-sm ring-1 ring-primary/20',
    )}
  >
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{account.name}</CardTitle>
          {account.default && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Default account
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 rounded-full',
            account.default
              ? 'text-warning hover:text-warning'
              : 'text-muted-foreground hover:text-warning',
          )}
          onClick={() => onSetDefault(account)}
          aria-label={
            account.default ? 'Default account' : `Set ${account.name} as default account`
          }
          title={account.default ? 'Default account' : 'Set as default account'}
        >
          <Star className={cn('h-4 w-4', account.default && 'fill-current')} />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0 pb-3">
      <div className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">
            {account.number ? 'Číslo účtu' : 'IBAN'}
          </p>
          <p className="text-base font-medium text-foreground">
            {getAccountIdentifier(account)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Měna</p>
          <p className="text-sm font-medium text-foreground">{account.currency}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter className="justify-end gap-2 pt-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => onEdit(account)}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    </CardFooter>
  </Card>
);
