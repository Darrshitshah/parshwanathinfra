/**
 * Switches for what the site shows. Owner: pages-lead.
 *
 * SHOW_RERA: Darshit 2026-10-10 decided that RERA is not mentioned anywhere on the site for now (the Gujarat RERA
 * registration is to follow). With this false the footer has no RERA line, the project page has no registration block,
 * the disclaimer page has no RERA section and `site.disclaimers.rera` is not rendered. The data in src/content is
 * untouched. Set it to true to bring all of that back at once: the footer line, the project registration block (both
 * "RERA registration: TBD" until a number exists) and the RERA disclaimer text. This overrides BUILD_SPEC section 1.4.
 */
export const SHOW_RERA = false;
