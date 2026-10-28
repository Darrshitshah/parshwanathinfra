/**
 * Authored media manifest: which photoreal master becomes which media id, with alt text and captions.
 * tools/images/build.mjs reads this and writes public/media/<id>.webp and src/content/media.ts.
 *
 * Rules (docs/TEAM_RULES.md): alt text describes what is visible, no invented facts (no floor counts, no
 * brand names, no names of amenities the plan does not show). Every render carries artistImpression.
 * No em dashes or en dashes.
 *
 * `master` is the file name inside the "Hiranandani Style v2" folder. All 33 masters are photoreal outputs,
 * including the ones made from untextured "Model" clay renders, so their kind is "render".
 */

export const MASTER_SUFFIX = " - hiranandani.png";
export const MAX_WIDTH = 2560;
export const DEFAULT_TARGET_KB = 450;
/** Per-id size targets in KB when different from the default. */
export const TARGET_KB = { "masterplan-aerial": 350 };

/** Order here is the order of src/content/media.ts. Existing ids first (kept stable), new ids after. */
export const items = [
  {
    id: "masterplan-aerial",
    master: "SS-01 Masterplan Aerial",
    alt: "Aerial view of Shiv Shiva Township in warm morning light: apartment blocks around landscaped courts, rows of terraced homes beyond them and the main road running down the right edge",
    caption: "The township from the air",
  },
  {
    id: "masterplan-topdown",
    master: "SS-02 Masterplan Top-Down",
    alt: "Top-down view of the whole township: apartment blocks and the entry roundabout beside the main road, terraced row houses at the far end, loops of internal road and green belts around the edge",
    caption: "The township from directly above",
  },
  {
    id: "masterplan-full",
    master: "SS-33 Masterplan Aerial Full",
    alt: "Wide aerial of the township in its green setting: clusters of apartment blocks on the left, terraced row houses at the lower right and open countryside beyond",
    caption: "The township in its setting",
  },
  {
    id: "cover",
    master: "SS-05 Main Road Corner",
    alt: "Corner of the main road at sunset: a multi-storey block above lit shopfronts, a landscaped verge with flowering shrubs and a car approaching the junction",
    caption: "Main road corner at sunset",
  },
  {
    id: "shop-street-night",
    master: "SS-07 Shop Street at Dusk",
    alt: "Shop street at dusk: lit shopfronts at street level, apartment floors above, palms and planters, and residents walking along a wide paved street",
    caption: "Shop street at dusk",
  },
  {
    id: "main-road",
    master: "SS-06 Main Road Shop Frontage",
    alt: "Shop frontage along the main road: a multi-storey block with dark vertical louvres above glazed, lit shopfronts, parked cars and a palm in the foreground",
    caption: "Shop frontage on the main road",
  },
  {
    id: "roundabout",
    master: "SS-08 Roundabout Sculpture",
    alt: "The entry roundabout: a planted island with a looping steel sculpture, ringed paving around it and apartment blocks with shops at ground level on both sides",
    caption: "Entry roundabout and sculpture",
  },
  {
    id: "clubhouse-lawn",
    master: "SS-22 Clubhouse Lawn and Gazebos",
    alt: "A large lawn at golden hour with a reader on a bench, families playing, timber pergolas with seating and a glass-fronted two-storey building across the grass",
    caption: "Clubhouse lawn and gazebos",
  },
  {
    id: "towers-courtyard",
    master: "SS-10 Towers Courtyard",
    alt: "Apartment blocks around a parking court at sunset, with a children's play frame, a planted island, palms and cars on paved ground",
    caption: "Towers and parking court",
  },
  {
    id: "garden-island",
    master: "SS-14 Central Garden Island",
    alt: "A courtyard seen from balcony height: a planted garden island with a tree and circular bench, residents walking a paved lane and a small play area in the distance",
    caption: "Central garden island",
  },
  {
    id: "temple-court",
    master: "SS-15 Temple Courtyard",
    alt: "A small carved stone shrine with a red flag on a planted island at a bend in a paved courtyard, with residents walking between apartment blocks",
    caption: "Temple courtyard",
  },
  {
    id: "row-houses-dusk",
    master: "SS-25 Row Houses at Dusk",
    alt: "Two-storey row houses at dusk with white portal frames, red brick pillars, lit windows and car porches, and two people walking on the paved lane",
    caption: "Row houses in the evening",
  },
  {
    id: "garden-court",
    master: "SS-24 Row House Garden Court",
    alt: "A garden court between row houses with a lawn, a central fountain, a timber gazebo, benches and palms, and two cars parked at the edge of the paving",
    caption: "Garden court with a fountain",
  },
  {
    id: "play-area",
    master: "SS-23 Childrens Play Area",
    alt: "Children's play area with swings, slides and see-saws on coloured rubber flooring, with a two-storey grey building with an outside staircase and palms behind",
    caption: "Children's play area",
  },
  {
    id: "clubhouse-court",
    master: "SS-13 Clubhouse and Parking Court",
    alt: "A glass-fronted ground-floor hall lit from inside, set in a courtyard with parked cars, a planted verge and apartment blocks around it",
    caption: "Clubhouse and parking court",
  },
  {
    id: "central-lawn",
    master: "SS-17 Central Lawn Axis",
    alt: "A central axis between two apartment blocks: a paved parking strip, planted beds, walkways with residents and another block closing the view at sunset",
    caption: "Central lawn axis",
  },
  {
    id: "courtyard-playground",
    master: "SS-12 Courtyard Playground Elevated",
    alt: "A courtyard playground from an elevated view with red, green and blue play flooring, swings and slides, parked cars and apartment blocks at sunset",
    caption: "Courtyard playground",
  },
  {
    id: "clubhouse",
    master: "SS-20 Clubhouse Lawn Court Model",
    alt: "A glass-fronted entrance pavilion at the foot of an apartment block, with a paved plaza, planted borders and a couple walking towards it",
    caption: "Clubhouse and plaza",
  },
  {
    id: "row-house-wing",
    master: "SS-03 Aerial Row House Wing",
    alt: "Terraced row houses seen from above in parallel strips with paved lanes between them, beside apartment blocks and an open lawn",
    caption: "Row-house wing from above",
  },
  {
    id: "row-house-street",
    master: "SS-29 Row House Street and Lawn Model",
    alt: "A paved street with a curved planted border leading to two-storey row houses with white portal frames, a lawn on the left and a taller block on the right",
    caption: "Row-house street and lawn",
  },
  {
    id: "row-houses-day",
    master: "SS-26 Row Houses by Day",
    alt: "Two-storey flat-roofed row houses by day: deep white portal frames alternating with recessed balcony bays, red brick pillars, planter boxes under the upper windows, car porches and palms",
    caption: "Row houses by day",
  },
  {
    id: "landscape",
    master: "SS-16 Landscaped Approach",
    alt: "A landscaped approach with a white-flowering tree and coloured foliage along the kerb, a paved road with parked cars and apartment blocks at sunset",
    caption: "Landscaped approach",
  },
  /* ---- new ids: the rest of the SS set ---- */
  {
    id: "ss-04-row-house-cluster",
    master: "SS-04 Aerial Row House Cluster",
    alt: "Aerial view of terraced row houses in parallel strips stepping across a slope, a second group of strips on the right, with lawns, palms and apartment blocks beyond",
    caption: "Row-house cluster from the air",
  },
  {
    id: "ss-09-roundabout-plaza",
    master: "SS-09 Roundabout Plaza Model",
    alt: "A raised round planter of tropical foliage in a paved plaza with ringed patterned paving, apartment blocks with ground-floor shops on both sides and two couples walking",
    caption: "Roundabout plaza",
  },
  {
    id: "ss-11-parking-court-play-area",
    master: "SS-11 Parking Court and Play Area",
    alt: "A parking court with a children's play frame and a planted island in front of apartment blocks, with a blue car and a family walking in low sun",
    caption: "Parking court and play area",
  },
  {
    id: "ss-18-central-lawn-spine",
    master: "SS-18 Central Lawn Spine Model",
    alt: "A long lawn spine bordered by planting between apartment blocks that stand on stilts, with walkways and residents in warm evening light",
    caption: "Central lawn spine",
  },
  {
    id: "ss-19-tower-court-lawn",
    master: "SS-19 Tower Court Lawn Model",
    alt: "A lawn court with planted borders and a paved path in front of apartment blocks that stand on stilts, with a couple and children walking past",
    caption: "Lawn court between blocks",
  },
  {
    id: "ss-21-clubhouse-plaza",
    master: "SS-21 Clubhouse Plaza Wide Model",
    alt: "A wide paved plaza and ramp leading to a glass-fronted pavilion at the foot of apartment blocks, with a raised lawn and a planted edge",
    caption: "Clubhouse plaza, wide view",
  },
  {
    id: "ss-27-row-house-lane",
    master: "SS-27 Row House Lane Model",
    alt: "A paved lane between two-storey row houses with white portal frames and glass balconies, seen towards the sunset with residents walking",
    caption: "Row-house lane",
  },
  {
    id: "ss-28-row-house-lane-corner",
    master: "SS-28 Row House Lane Corner Model",
    alt: "A narrow paved lane at a corner of the row houses with a recessed glass-railed balcony, white columns and a few residents walking at golden hour",
    caption: "Row-house lane, corner",
  },
  {
    id: "ss-30-row-house-lane-long-view",
    master: "SS-30 Row House Lane Long View Model",
    alt: "A long view down a lane between row houses with balconies and planters, a taller block rising at the far end and a family walking towards the camera",
    caption: "Row-house lane, long view",
  },
  {
    id: "ss-31-row-house-plaza",
    master: "SS-31 Row House Plaza Model",
    alt: "A paved bend in the row-house lane with a car porch and two parked cars, a balcony bay framed in white and flowering shrubs in front",
    caption: "Row-house car porch and lane",
  },
  {
    id: "ss-32-row-house-porch-lane",
    master: "SS-32 Row House Porch Lane Model",
    alt: "A lane between row houses seen from porch level, with white columns, balconies with glass railings and two people walking towards the low sun",
    caption: "Row-house porch lane",
  },
];

/** Files that are not photoreal masters and keep the file already in public/media. */
export const kept = [
  {
    id: "shiv-shiva-logo",
    file: "shiv-shiva-logo.png",
    kind: "logo",
    alt: "Shiv Shiva Township logo",
    source: "portfolio logo.png",
    artistImpression: false,
  },
  {
    // Generated with Nano Banana 2.1 (tools/imagegen/linear_garden.py, strict edit of SS-30); original in _source/generated/amenities/.
    id: "linear-garden",
    file: "linear-garden.webp",
    kind: "generated",
    alt: "A linear garden running down the middle of a lane between rows of terraced houses: a clipped lawn with a rectangular fountain, flowering borders, young trees and benches, with a narrow paved road on each side and residents sitting and walking in the golden evening light",
    caption: "Linear garden with a water feature",
    source: "Nano Banana 2.1 edit of SS-30 Row House Lane Long View Model (Hiranandani Style v2), artist's impression",
    artistImpression: true,
  },
];
