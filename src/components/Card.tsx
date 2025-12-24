import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  title?: ReactNode;
  footer?: ReactNode;
  className?: string;
}>;

export default function Card({ title, footer, className = "", children }: CardProps) {
  return (
    <div className={["rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900", className].join(" ")}>\n      {title ? <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 font-medium">{title}</div> : null}
      <div className="p-4">{children}</div>
      {footer ? <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400">{footer}</div> : null}
    </div>
  );
}




