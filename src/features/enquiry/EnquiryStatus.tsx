"use client";

/**
 * What the enquiry form shows once it has an answer: the success state (a checkmark that draws itself) and the
 * honest "not switched on yet" state. Neither claims more than is true. Owner: pages-lead.
 */
import type { CSSProperties, Ref } from "react";
import { FilledButton, LineButton } from "@/components/ui/Button";
import { keepTogether } from "@/components/ui/nowrap";
import { TextLink } from "@/components/ui/TextLink";
import { en } from "@/content/i18n/en";
import { firstName, formatVisitDate, whatsappLink } from "./format";
import { formatPhone } from "./phone";
import type { EnquiryConfig } from "./types";

interface SuccessPanelProps {
  name: string;
  visitDate: string;
  projectName: string;
  interestLabel: string;
  whatsapp: string | null;
  onDone?: () => void;
  onAnother?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

function DrawnCheck() {
  return (
    <svg className="size-16 text-brick" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <circle
        className="draw-path"
        cx="32"
        cy="32"
        r="29"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={1.5}
        style={{ "--draw-duration": "900ms" } as CSSProperties}
      />
      <path
        className="draw-path"
        d="M19 33.5l9.5 9.5L46 24"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="square"
        style={{ "--draw-duration": "600ms", "--draw-delay": "700ms" } as CSSProperties}
      />
    </svg>
  );
}

export function SuccessPanel({
  name,
  visitDate,
  projectName,
  interestLabel,
  whatsapp,
  onDone,
  onAnother,
  headingRef,
}: SuccessPanelProps) {
  const visit = formatVisitDate(visitDate);
  return (
    <div role="status" className="grid gap-6" data-enquiry-state="success">
      <DrawnCheck />
      <div className="grid gap-2">
        <p className="t-mono text-ink-muted">{en.enquiry.successTitle}</p>
        <h3 ref={headingRef} tabIndex={-1} className="t-display-3 text-ink outline-none">
          {en.enquiry.successThanks}, {firstName(name)}.
        </h3>
      </div>
      <p className="t-lead text-ink">{en.enquiry.success}</p>
      <dl className="titleblock" style={{ "--tb-cols": 1 } as CSSProperties}>
        <div className="titleblock__cell">
          <dt className="titleblock__label">{en.enquiry.successVisit}</dt>
          <dd className="titleblock__value m-0">{visit || en.enquiry.successNoDate}</dd>
        </div>
        <div className="titleblock__cell">
          <dt className="titleblock__label">{en.enquiry.successProject}</dt>
          <dd className="titleblock__value m-0">{projectName}</dd>
        </div>
        <div className="titleblock__cell">
          <dt className="titleblock__label">{en.enquiry.successInterest}</dt>
          <dd className="titleblock__value m-0">{interestLabel}</dd>
        </div>
      </dl>
      {whatsapp ? <TextLink href={whatsappLink(whatsapp, en.whatsapp.prefill)}>{en.enquiry.whatsappNext}</TextLink> : null}
      <div className="flex flex-wrap gap-3">
        {onDone ? <FilledButton onClick={onDone} arrow={false}>{en.enquiry.doneClose}</FilledButton> : null}
        {onAnother ? <LineButton onClick={onAnother}>{en.enquiry.sendAnother}</LineButton> : null}
      </div>
    </div>
  );
}

interface NotConfiguredPanelProps {
  config: EnquiryConfig;
  onBack: () => void;
}

export function NotConfiguredPanel({ config, onBack }: NotConfiguredPanelProps) {
  const hasDirectContact = config.phones.length > 0 || config.whatsapp !== null;
  return (
    <div role="status" className="grid gap-5" data-enquiry-state="not-configured">
      <div className="grid gap-3 rounded-(--radius-card) bg-paper-sunk p-6">
        <p className="t-mono text-ink-muted">{en.enquiry.notConfiguredTitle}</p>
        <p className="t-lead text-ink">{hasDirectContact ? en.enquiry.notConfigured : en.enquiry.notConfiguredNoPhone}</p>
      </div>
      {hasDirectContact ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {config.phones.map((phone) => (
            <li key={phone.number}>
              <TextLink href={`tel:+91${phone.number}`}>
                {en.enquiry.notConfiguredCall} {phone.label}: {formatPhone(phone.number)}
              </TextLink>
            </li>
          ))}
          {config.whatsapp ? (
            <li>
              <TextLink href={whatsappLink(config.whatsapp, en.whatsapp.prefill)}>{en.whatsapp.label}</TextLink>
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="grid gap-1.5">
        <p className="t-mono-sm text-ink-muted">{en.enquiry.notConfiguredAddress}</p>
        <address className="t-small text-ink not-italic">{keepTogether(config.office.address)}</address>
        <TextLink href={config.office.mapUrl} className="t-small">
          {en.common.openInMaps}
        </TextLink>
      </div>
      <div>
        <LineButton onClick={onBack}>{en.enquiry.backToForm}</LineButton>
      </div>
    </div>
  );
}
