// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MAX_LABEL_LENGTH, resolveCursorState, sameState } from "./cursor-state";

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

function resolve(selector: string) {
  return resolveCursorState(document.querySelector(selector));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.documentElement.removeAttribute("data-cursor");
  document.documentElement.removeAttribute("data-pi-cursor");
});

describe("resolveCursorState", () => {
  it("is the small circle over plain content and when there is no target", () => {
    mount("<p id='p'>Some text</p>");
    expect(resolve("#p")).toEqual({ kind: "default" });
    expect(resolveCursorState(null)).toEqual({ kind: "default" });
  });

  it("grows over links, buttons and button-like roles", () => {
    mount(`
      <a id="a" href="/x">Link</a><button id="b">Go</button><div id="r" role="button">Btn</div>
      <summary id="s">Open</summary><label id="l" for="f">Label</label>
    `);
    for (const id of ["#a", "#b", "#r", "#s", "#l"]) expect(resolve(id)).toEqual({ kind: "grow" });
  });

  it("does not treat an anchor without href as a link", () => {
    mount("<a id='a'>Not a link</a>");
    expect(resolve("#a")).toEqual({ kind: "default" });
  });

  it("grows over an icon inside a button (nearest interactive ancestor)", () => {
    mount("<button><span><svg id='icon'></svg></span></button>");
    expect(resolve("#icon")).toEqual({ kind: "grow" });
  });

  it("becomes a labelled disc over data-cursor-label", () => {
    mount("<figure data-cursor-label='View'><img id='img' alt=''></figure>");
    expect(resolve("#img")).toEqual({ kind: "label", label: "View" });
  });

  it("supports Drag and Explore, trims, collapses whitespace and caps the length", () => {
    mount(`
      <div id="d" data-cursor-label="  Drag "></div>
      <div id="e" data-cursor-label="Explore   plan"></div>
      <div id="long" data-cursor-label="${"x".repeat(40)}"></div>
    `);
    expect(resolve("#d")).toEqual({ kind: "label", label: "Drag" });
    expect(resolve("#e")).toEqual({ kind: "label", label: "Explore plan" });
    const long = resolve("#long");
    expect(long.kind === "label" && long.label.length).toBe(MAX_LABEL_LENGTH);
  });

  it("ignores an empty label", () => {
    mount("<div id='x' data-cursor-label='   '></div>");
    expect(resolve("#x")).toEqual({ kind: "default" });
  });

  it("lets the nearest element decide: a link inside a labelled card grows, the card itself is labelled", () => {
    mount("<article id='card' data-cursor-label='View'><a id='link' href='/p'>Enquire</a><p id='text'>text</p></article>");
    expect(resolve("#link")).toEqual({ kind: "grow" });
    expect(resolve("#text")).toEqual({ kind: "label", label: "View" });
    expect(resolve("#card")).toEqual({ kind: "label", label: "View" });
  });

  it("keeps the native cursor over text fields, selects and contenteditable", () => {
    mount(`
      <input id="t" type="text"><input id="e" type="email"><textarea id="a"></textarea>
      <select id="s"><option>1</option></select><div id="c" contenteditable="true"></div>
    `);
    for (const id of ["#t", "#e", "#a", "#s", "#c"]) expect(resolve(id)).toEqual({ kind: "native" });
  });

  it("grows over checkboxes and submit buttons instead", () => {
    mount("<input id='cb' type='checkbox'><input id='sub' type='submit' value='Send'>");
    expect(resolve("#cb")).toEqual({ kind: "grow" });
    expect(resolve("#sub")).toEqual({ kind: "grow" });
  });

  it("honours explicit data-cursor values", () => {
    mount(`
      <div id="n" data-cursor="native"><span id="inner">x</span></div>
      <div id="g" data-cursor="grow"></div>
      <a id="d" href="/x" data-cursor="default">plain</a>
      <div id="any" data-cursor="whatever"></div>
    `);
    expect(resolve("#n")).toEqual({ kind: "native" });
    expect(resolve("#inner")).toEqual({ kind: "native" });
    expect(resolve("#g")).toEqual({ kind: "grow" });
    expect(resolve("#d")).toEqual({ kind: "default" });
    expect(resolve("#any")).toEqual({ kind: "grow" });
  });
});

describe("the root element", () => {
  it("never decides the state, even if <html> carries a data-cursor attribute", () => {
    document.documentElement.setAttribute("data-cursor", "on");
    mount("<p id='p'>Some text</p>");
    expect(resolve("#p")).toEqual({ kind: "default" });
  });

  it("the cursor's own on-flag is data-pi-cursor, which no rule reads", () => {
    document.documentElement.setAttribute("data-pi-cursor", "on");
    mount("<p id='p'>Some text</p>");
    expect(resolve("#p")).toEqual({ kind: "default" });
  });
});

describe("sameState", () => {
  it("compares kind and label", () => {
    expect(sameState({ kind: "grow" }, { kind: "grow" })).toBe(true);
    expect(sameState({ kind: "grow" }, { kind: "default" })).toBe(false);
    expect(sameState({ kind: "label", label: "View" }, { kind: "label", label: "View" })).toBe(true);
    expect(sameState({ kind: "label", label: "View" }, { kind: "label", label: "Drag" })).toBe(false);
  });
});
