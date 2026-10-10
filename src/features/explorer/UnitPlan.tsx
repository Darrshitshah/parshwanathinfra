"use client";

/**
 * A unit's CAD plan, drawn like ink: the walls, openings and projections draw one after another (DrawSVG through the
 * motion layer), then the room labels come in. On reduced motion, Tier C and without JavaScript animation the plan
 * is simply there. The rooms are listed in mono with the sizes the layout plan gives.
 */
import { useEffect, useRef, useState } from "react";
import { Tbd } from "@/components/ui/Tbd";
import type { UnitType } from "@/content/schema";
import { useMotionGate, useMotionEffect } from "@/motion/hooks";
import { explorerStrings } from "./strings";

const cache = new Map<string, string>();
const PLAN_PATH = /^\/plan\/units\/[a-z0-9-]+\.svg$/;

/** Fetch a unit plan SVG once. Only our own /plan/units files are accepted. */
export async function loadUnitSvg(path: string, signal?: AbortSignal): Promise<string> {
  if (!PLAN_PATH.test(path)) throw new Error("Not a unit plan path");
  const known = cache.get(path);
  if (known) return known;
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error(`Plan not found (${response.status})`);
  const text = await response.text();
  if (!text.trimStart().startsWith("<svg")) throw new Error("Not an SVG");
  cache.set(path, text);
  return text;
}

export function UnitPlan({ unit, replay }: { unit: UnitType; replay: number }) {
  const [markup, setMarkup] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gate = useMotionGate();
  const path = unit.planSvg === "TBD" ? null : unit.planSvg;

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    loadUnitSvg(path, controller.signal).then(
      (text) => {
        setMarkup(text);
        setFailed(false);
      },
      (error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
      },
    );
    return () => controller.abort();
  }, [path]);

  useMotionEffect(wrapRef, gate.enabled && markup !== null, `${unit.id}|${replay}`, ({ gsap, inkDraw }, wrap) => {
    const svg = wrap.querySelector("svg");
    if (!svg) return;
    const shapes = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
    const labels = Array.from(svg.querySelectorAll<SVGTextElement>(".u-labels text"));
    const rows = Array.from(wrap.parentElement?.querySelectorAll<HTMLElement>("[data-room-row]") ?? []);
    const timeline = gsap.timeline();
    timeline.add(inkDraw(svg, { duration: 1.4, stagger: 0.18 }), 0);
    timeline.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1, ease: "none" }, 1.1);
    timeline.fromTo(rows, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.14, ease: "power2.out" }, 0.4);
    return () => {
      timeline.kill();
      gsap.set([...shapes, ...labels, ...rows], { clearProps: "all" });
    };
  });

  return (
    <div className="ex-plan">
      <h4 className="ex-plan__title">{unit.label}</h4>
      <div ref={wrapRef} className="ex-plan__drawing">
        {markup ? <div dangerouslySetInnerHTML={{ __html: markup }} /> : <p className="ex-muted">{failed ? "This plan could not be loaded." : path ? "" : "Floor plan: TBD"}</p>}
      </div>
      <dl className="ex-plan__facts">
        <div>
          <dt>{explorerStrings.type}</dt>
          <dd>{unit.bhk === "TBD" ? <Tbd /> : unit.bhk.replace("BHK", " BHK")}</dd>
        </div>
        <div>
          <dt>{explorerStrings.area}</dt>
          <dd>{unit.areaSqft === "TBD" ? <Tbd /> : `${unit.areaSqft} sq ft`}</dd>
        </div>
      </dl>
      <h5 className="ex-plan__rooms-title">{explorerStrings.rooms}</h5>
      <ul className="ex-rooms">
        {unit.rooms.map((room) => (
          <li key={room.name} data-room-row="">
            <span>{room.name}</span>
            <span className="ex-rooms__size">{`${room.width} x ${room.length}`}</span>
          </li>
        ))}
      </ul>
      <p className="ex-muted">{explorerStrings.sizesNote}</p>
    </div>
  );
}
