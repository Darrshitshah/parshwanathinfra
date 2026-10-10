// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/content/i18n/en";
import { EnquiryForm, type EnquiryFormProps } from "./EnquiryForm";
import { addDaysIso, todayInIndia } from "./schema";
import { submitEnquiry, type SubmitResult } from "./submit";
import type { EnquiryConfig } from "./types";

vi.mock("./submit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./submit")>();
  return { ...actual, submitEnquiry: vi.fn() };
});

const submit = vi.mocked(submitEnquiry);

const config: EnquiryConfig = {
  projects: [{ slug: "shiv-shiva", name: "Shiv Shiva Township" }],
  defaultProject: "shiv-shiva",
  office: {
    name: "Parshwanath Infra site office",
    address: "Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road",
    mapUrl: "https://maps.app.goo.gl/example",
  },
  phones: [],
  whatsapp: null,
};

const VISIT_DATE = addDaysIso(todayInIndia(), 5);

function renderForm(props: Partial<EnquiryFormProps> = {}) {
  const user = userEvent.setup();
  const view = render(<EnquiryForm config={config} scope="test" openedAt={Date.now() - 20_000} {...props} />);
  return { user, ...view };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(en.enquiry.fields.name), "Asha Patel");
  await user.type(screen.getByLabelText(en.enquiry.fields.phone), "+91 98765 43210");
  await user.click(screen.getByLabelText(en.enquiry.fields.consent));
}

function reply(result: SubmitResult) {
  submit.mockResolvedValueOnce(result);
}

beforeEach(() => {
  submit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("EnquiryForm: fields", () => {
  it("offers every field from the enquiry spec, with the honeypot out of reach", () => {
    const { container } = renderForm();
    expect(screen.getByLabelText(en.enquiry.fields.name)).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(en.enquiry.fields.phone)).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText(en.enquiry.fields.email)).toHaveAttribute("type", "email");
    expect(screen.getByText("Shiv Shiva Township")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "Not sure yet" })).toBeChecked();
    expect(screen.getByLabelText(en.enquiry.fields.budget)).toHaveValue("not-sure");
    expect(screen.getByLabelText(en.enquiry.fields.visitDate)).toHaveAttribute("type", "date");
    expect(screen.getByLabelText(new RegExp(en.enquiry.fields.message))).toBeInTheDocument();
    expect(screen.getByLabelText(en.enquiry.fields.consent)).not.toBeChecked();
    expect(screen.getByRole("button", { name: en.enquiry.submit })).toBeEnabled();

    const trap = container.querySelector('input[name="url_confirm"]');
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("limits the visit date to today and the next year once mounted", async () => {
    renderForm();
    const input = screen.getByLabelText(en.enquiry.fields.visitDate);
    await waitFor(() => expect(input).toHaveAttribute("min", todayInIndia()));
    expect(input).toHaveAttribute("max", addDaysIso(todayInIndia(), 366));
  });

  it("pre-fills the plot and the interest it was opened with", async () => {
    const { user } = renderForm({ prefill: { plot: 42, interest: "2bhk-rowhouse" } });
    expect(screen.getByText(`${en.enquiry.aboutPlot} 42`)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2 BHK row house" })).toBeChecked();

    reply({ kind: "success" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0]?.[0]).toMatchObject({ plot: 42, interest: "2bhk-rowhouse", project: "shiv-shiva" });
  });

  it("restores a saved draft and reports every change", async () => {
    const onDraftChange = vi.fn();
    const { user } = renderForm({ initialDraft: { name: "Draft Name", budget: "30-45" }, onDraftChange });
    expect(screen.getByLabelText(en.enquiry.fields.name)).toHaveValue("Draft Name");
    expect(screen.getByLabelText(en.enquiry.fields.budget)).toHaveValue("30-45");
    await user.type(screen.getByLabelText(en.enquiry.fields.email), "a");
    expect(onDraftChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: "Draft Name", email: "a" }));
  });
});

describe("EnquiryForm: validation", () => {
  it("names each missing required field on an empty submit and moves focus to the first", async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));

    expect(screen.getByText(en.enquiry.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(en.enquiry.errors.phoneRequired)).toBeInTheDocument();
    expect(screen.getByText(en.enquiry.errors.consentRequired)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(en.enquiry.fixFields);
    expect(submit).not.toHaveBeenCalled();

    const name = screen.getByLabelText(en.enquiry.fields.name);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(en.enquiry.errors.nameRequired);
    await waitFor(() => expect(name).toHaveFocus());
  });

  it("explains a mobile number that is not an Indian mobile, and confirms a good one", async () => {
    const { user } = renderForm();
    const phone = screen.getByLabelText(en.enquiry.fields.phone);
    await user.type(phone, "12345");
    await user.tab();
    expect(screen.getByText(en.enquiry.errors.phoneInvalid)).toBeInTheDocument();

    await user.clear(phone);
    await user.type(phone, "098765 43210");
    expect(screen.queryByText(en.enquiry.errors.phoneInvalid)).not.toBeInTheDocument();
    expect(screen.getByText(`${en.enquiry.fields.phoneConfirm} +91 98765 43210`)).toBeInTheDocument();
  });

  it("flags an email address that does not look right, but leaves a blank one alone", async () => {
    const { user } = renderForm();
    const email = screen.getByLabelText(en.enquiry.fields.email);
    await user.type(email, "not-an-email");
    await user.tab();
    expect(screen.getByText(en.enquiry.errors.emailInvalid)).toBeInTheDocument();
    await user.clear(email);
    await user.tab();
    expect(screen.queryByText(en.enquiry.errors.emailInvalid)).not.toBeInTheDocument();
  });

  it("rejects a visit date in the past", async () => {
    const { user } = renderForm();
    await fillValid(user);
    fireEvent.change(screen.getByLabelText(en.enquiry.fields.visitDate), { target: { value: "2020-01-01" } });
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    expect(screen.getByText(en.enquiry.errors.visitDatePast)).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("re-checks a field as you fix it", async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    await user.type(screen.getByLabelText(en.enquiry.fields.name), "Asha Patel");
    expect(screen.queryByText(en.enquiry.errors.nameRequired)).not.toBeInTheDocument();
    expect(screen.getByText(en.enquiry.errors.phoneRequired)).toBeInTheDocument();
  });
});

describe("EnquiryForm: sending", () => {
  it("shows success only after the server says so, echoing the visit date", async () => {
    const onSuccess = vi.fn();
    const { user } = renderForm({ onSuccess });
    reply({ kind: "success" });
    await fillValid(user);
    fireEvent.change(screen.getByLabelText(en.enquiry.fields.visitDate), { target: { value: VISIT_DATE } });
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));

    expect(await screen.findByRole("heading", { name: `${en.enquiry.successThanks}, Asha.` })).toBeInTheDocument();
    expect(screen.getByText(en.enquiry.success)).toBeInTheDocument();
    const visit = screen.getByText(en.enquiry.successVisit).closest(".titleblock__cell");
    expect(visit).toHaveTextContent(/\d{1,2} \w+ \d{4}/);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Thank you/ })).toHaveFocus());

    const payload = submit.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      name: "Asha Patel",
      phone: "+91 98765 43210",
      consent: true,
      website: "",
      visitDate: VISIT_DATE,
      interest: "not-sure",
      budget: "not-sure",
    });
    expect(typeof payload?.openedAt).toBe("number");
  });

  it("asks for a date by phone when none was chosen", async () => {
    const { user } = renderForm();
    reply({ kind: "success" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    expect(await screen.findByText(en.enquiry.successNoDate)).toBeInTheDocument();
  });

  it("says online enquiries are not switched on, shows only the office address, and keeps what was typed", async () => {
    const { user } = renderForm();
    reply({ kind: "not-configured" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));

    expect(await screen.findByText(en.enquiry.notConfiguredTitle)).toBeInTheDocument();
    expect(screen.getByText(en.enquiry.notConfiguredNoPhone)).toBeInTheDocument();
    expect(screen.queryByText(en.enquiry.success)).not.toBeInTheDocument();
    expect(document.querySelector("[data-enquiry-state='not-configured'] address")).toHaveTextContent(config.office.address);
    expect(screen.getByRole("link", { name: /open in google maps/i })).toHaveAttribute("href", config.office.mapUrl);
    expect(screen.queryByRole("link", { name: /call/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: en.enquiry.backToForm }));
    expect(screen.getByLabelText(en.enquiry.fields.name)).toHaveValue("Asha Patel");
  });

  it("offers phone and WhatsApp in that state only when they are confirmed", async () => {
    const confirmed: EnquiryConfig = { ...config, phones: [{ label: "Sales", number: "9876543210" }], whatsapp: "9876543211" };
    const { user } = renderForm({ config: confirmed });
    reply({ kind: "not-configured" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));

    expect(await screen.findByText(en.enquiry.notConfigured)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Call Sales: \+91 98765 43210/ })).toHaveAttribute("href", "tel:+919876543210");
    expect(screen.getByRole("link", { name: /chat on whatsapp/i })).toHaveAttribute("href", expect.stringContaining("wa.me/919876543211"));
  });

  it.each([
    ["network", en.enquiry.networkError],
    ["error", en.enquiry.error],
    ["rate-limited", en.enquiry.rateLimited],
    ["too-fast", en.enquiry.tooFast],
    ["rejected", en.enquiry.error],
  ] as const)("reports a %s failure plainly and never shows success", async (kind, message) => {
    const { user } = renderForm();
    reply({ kind });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText(en.enquiry.success)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.enquiry.submit })).toBeEnabled();
  });

  it("maps the server's validation errors onto the fields", async () => {
    const { user } = renderForm();
    reply({ kind: "invalid", errors: { phone: "phoneInvalid", email: "emailInvalid" } });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    expect(await screen.findByText(en.enquiry.errors.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByText(en.enquiry.errors.emailInvalid)).toBeInTheDocument();
  });

  it("sends once, even if the button is pressed twice", async () => {
    const { user } = renderForm();
    let release: (value: SubmitResult) => void = () => undefined;
    submit.mockReturnValueOnce(new Promise<SubmitResult>((resolve) => (release = resolve)));
    await fillValid(user);
    const button = screen.getByRole("button", { name: en.enquiry.submit });
    await user.click(button);
    expect(screen.getByRole("button", { name: en.enquiry.sending })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: en.enquiry.sending }));
    release({ kind: "success" });
    await screen.findByText(en.enquiry.success);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("offers another enquiry after success on the inline form", async () => {
    const { user } = renderForm({ variant: "inline" });
    reply({ kind: "success" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.enquiry.submit }));
    await user.click(await screen.findByRole("button", { name: en.enquiry.sendAnother }));
    expect(screen.getByLabelText(en.enquiry.fields.name)).toHaveValue("");
  });
});

describe("EnquiryForm: the 3 second time trap", () => {
  it("holds a very fast submit until the server will accept it", async () => {
    const user = userEvent.setup();
    const { container } = render(<EnquiryForm config={config} scope="trap" openedAt={Date.now()} />);
    reply({ kind: "success" });
    await fillValid(user);

    // Typing is done with real timers; only the wait after the click runs on the fake clock.
    vi.useFakeTimers();
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByRole("button", { name: en.enquiry.sending })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(submit).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
