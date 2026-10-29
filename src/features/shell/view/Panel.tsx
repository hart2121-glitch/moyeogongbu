import type { ReactNode } from "react";
import { Cat } from "@phosphor-icons/react";

/**
 * 제목 줄이 있는 종이 질감 패널.
 * @example <Panel title="내 프로필">...</Panel>
 */
export default function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <span>
          <Cat size={20} />
          {title}
        </span>
        {action}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
