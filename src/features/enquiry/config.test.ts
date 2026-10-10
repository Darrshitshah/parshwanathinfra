import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { buildEnquiryConfig } from "./config";

describe("buildEnquiryConfig", () => {
  const config = buildEnquiryConfig();

  it("offers Shiv Shiva as the only project", () => {
    expect(config.projects).toEqual([{ slug: "shiv-shiva", name: "Shiv Shiva Township" }]);
    expect(config.defaultProject).toBe("shiv-shiva");
  });

  it("passes the site office through", () => {
    expect(config.office.address).toBe(site.contact.office.address);
    expect(config.office.mapUrl).toBe(site.contact.office.mapUrl);
  });

  it("exposes no phone number or WhatsApp number while they are TBD", () => {
    expect(config.phones).toEqual([]);
    expect(config.whatsapp).toBeNull();
  });

  it("is plain JSON, so it can cross from the server to the client", () => {
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });
});
