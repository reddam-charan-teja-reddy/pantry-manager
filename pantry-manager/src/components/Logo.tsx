import { LogoIcon } from './LogoIcon';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoIcon className="h-7 w-7 text-primary" />
      <span className="text-2xl font-bold tracking-tight text-foreground">
        PantryWise
      </span>
    </div>
  );
}
