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

  it("exposes both confirmed sales numbers and the WhatsApp number", () => {
    expect(config.phones).toEqual([
      { label: "Sales", number: "7874305000" },
      { label: "Sales", number: "7874306000" },
    ]);
    expect(config.whatsapp).toBe("7874305000");
  });

  it("is plain JSON, so it can cross from the server to the client", () => {
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });
});
