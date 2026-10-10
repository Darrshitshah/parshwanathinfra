"use client";

/** "Go to plot": type a plot number, 1 to 165, and the plan flies there and opens its card. Keyboard friendly. */
import { useState, type FormEvent } from "react";
import { plan } from "@/content/plan";
import { planStrings } from "./strings";

export function PlotJump({ onGoToPlot }: { onGoToPlot: (number: number) => boolean }) {
  const t = planStrings.tools;
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const number = Number(value);
    const ok = Number.isInteger(number) && onGoToPlot(number);
    setInvalid(!ok);
    if (ok) setValue("");
  };

  return (
    <form className="lp-goto" onSubmit={submit} data-no-pan="">
      <label className="sr-only" htmlFor="lp-goto-input">
        {t.goToPlotLabel}
      </label>
      <input
        id="lp-goto-input"
        type="number"
        inputMode="numeric"
        min={1}
        max={plan.plots.length}
        placeholder={t.goToPlot}
        value={value}
        aria-invalid={invalid}
        aria-describedby={invalid ? "lp-goto-error" : undefined}
        onChange={(event) => {
          setValue(event.target.value);
          setInvalid(false);
        }}
      />
      <button type="submit" className="lp-tool">
        {t.go}
      </button>
      {invalid ? (
        <span id="lp-goto-error" role="alert" className="lp-goto__error">
          {planStrings.noPlot}
        </span>
      ) : null}
    </form>
  );
}
