/**
 * Media library. Owner: data-lead (seeded by the Director from the portfolio's web renders; data-lead replaces
 * the files with the 4K photoreal masters under the same ids).
 */
import { mediaLibrarySchema, type Media } from "./schema";

export const media: readonly Media[] = mediaLibrarySchema.parse([
  {
    "id": "masterplan-aerial",
    "kind": "render",
    "src": "/media/masterplan-aerial.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAAAQAgCdASoQAAsAA4BaJQBOgCIBeOW0S8wAAP7q89bZ4c7RewR7JW6aqzZ1tbKY929XgVMaVhkU7CM+p4N8SaD+nRnJeMXxvOzwoAAA",
    "alt": "Aerial view of Shiv Shiva Township with tower blocks, row houses and the entry roundabout",
    "caption": "Masterplan from the air",
    "artistImpression": true,
    "source": "SS-01 Masterplan Aerial (portfolio masterplan-aerial.webp)"
  },
  {
    "id": "masterplan-topdown",
    "kind": "render",
    "src": "/media/masterplan-topdown.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAACwAQCdASoQAAsAA4BaJQAAOXCdKaKgAP7MLSRaCe/EJE4WFg2YNxU/DFN3RUrh06t5u+Gc7HlYx8yLmRJfJZjwCuT94n/6VjTEYAAA",
    "alt": "Top-down view of the full Shiv Shiva Township layout",
    "caption": "The township from directly above",
    "artistImpression": true,
    "source": "SS-02 Masterplan Top-Down (portfolio masterplan-topdown.webp)"
  },
  {
    "id": "masterplan-full",
    "kind": "render",
    "src": "/media/masterplan-full.webp",
    "width": 1600,
    "height": 893,
    "blurDataURL": "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADQAQCdASoQAAkAA4BaJQBOgCHgcI89AADLTb0zHy+3sjsDBXgihXZVBp8o/zULRKiSqR+7dA906IM+Tr6PAAAA",
    "alt": "Wide aerial of Shiv Shiva Township in its green setting",
    "caption": "The township in its setting",
    "artistImpression": true,
    "source": "SS-33 Masterplan Aerial Full (portfolio masterplan-full.webp)"
  },
  {
    "id": "cover",
    "kind": "render",
    "src": "/media/cover.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAwAgCdASoQAAsAA4BaJQBOgCIAbtyXwk7GAAD+6DN1h44LDjcisIK9bjMUabufb/Ox16qi+6bgQ7PUChsYP1AliiD80FkEJp6caUuyyrL48Ux5wAA=",
    "alt": "Shiv Shiva Township towers and landscaped grounds",
    "caption": "Shiv Shiva Township",
    "artistImpression": true,
    "source": "portfolio cover (portfolio cover.webp)"
  },
  {
    "id": "shop-street-night",
    "kind": "render",
    "src": "/media/shop-street-night.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAQAgCdASoQAAsAA4BaJaACdAEed+5ge6wAAP5A4u25e2bCq53WynO9iiggpKcggwD2Y/jGX5mSkceiSGppNJjeozoma2930W0KdJRBbmRTaiZxnAAAAA==",
    "alt": "Shop street at dusk with lit shopfronts and residents walking",
    "caption": "Shop street at dusk",
    "artistImpression": true,
    "source": "SS-07 Shop Street at Dusk (portfolio shop-street-night.webp)"
  },
  {
    "id": "main-road",
    "kind": "render",
    "src": "/media/main-road.webp",
    "width": 1600,
    "height": 893,
    "blurDataURL": "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAAAQAgCdASoQAAkAA4BaJZACdAECv9k4NcSoAP7zyXlrhA7umnb6iPmn4IvMrEEj4ffHdDtTmvBro8Om4UVsuwEv+ck6irilq1BWfAAA",
    "alt": "Main road frontage of the township with shops facing the road",
    "caption": "Main road frontage",
    "artistImpression": true,
    "source": "SS-05/SS-06 Main Road (portfolio main-road.webp)"
  },
  {
    "id": "roundabout",
    "kind": "render",
    "src": "/media/roundabout.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADwAQCdASoQAAsAA4BaJQBOgBU0+wD13wAA/tfpi6eFHa3zqgPbcfolGkWWFmAQYx7m5tGs72QRYBqkhGWBQryOVzMO8QU4msJQWqCdgAA=",
    "alt": "Entry roundabout with a central sculpture and tree-lined road",
    "caption": "Entry roundabout",
    "artistImpression": true,
    "source": "SS-08 Roundabout Sculpture (portfolio roundabout.webp)"
  },
  {
    "id": "clubhouse-lawn",
    "kind": "render",
    "src": "/media/clubhouse-lawn.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAQAgCdASoQAAsAA4BaJbACdAEMxhCepQgAAP7oPtmGWsQGdFA4AdzvUjhg/m2l2l0CINnwkOV2Doru86hXBs+uH20p34FJd2PQo7j9xv4ezUOpTAUNsAAA",
    "alt": "Clubhouse lawn with gazebos and seating",
    "caption": "Clubhouse lawn and gazebos",
    "artistImpression": true,
    "source": "SS-22 Clubhouse Lawn and Gazebos (portfolio clubhouse-lawn.webp)"
  },
  {
    "id": "towers-courtyard",
    "kind": "render",
    "src": "/media/towers-courtyard.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADQAQCdASoQAAwAA4BaJQBOgCF5qZUHwAD+63X8y8ybaaFumL7/iPuF+bDoTtnqTmXJ51tPFZS0uW1y83aA3jFMhsyJJbEAAAA=",
    "alt": "Residential towers around a parking court",
    "caption": "Towers and parking court",
    "artistImpression": true,
    "source": "SS-10 Towers Courtyard (portfolio towers-courtyard.webp)"
  },
  {
    "id": "garden-island",
    "kind": "render",
    "src": "/media/garden-island.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADwAQCdASoQAAwAA4BaJYgCdAEYFuCuEQAA+4UllEjwkHtJfAkhUogSHmeHp0ZXz5J68Hcri/iqkedHWradWRJ5uKze22myvsTnAZXhwLaJbj2CnHCybvXwAAA=",
    "alt": "Central garden island with trees and walking paths",
    "caption": "Central garden island",
    "artistImpression": true,
    "source": "SS-14 Central Garden Island (portfolio garden-island.webp)"
  },
  {
    "id": "temple-court",
    "kind": "render",
    "src": "/media/temple-court.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAAAQAgCdASoQAAwAA4BaJQBOgB9guyv0eIOAAP6g791sNAv/HqzJLnYnrPD2uiQt2pnywhmM9iUg9r64uGbxWxhbTfQC3ovEltnro9D0QAA=",
    "alt": "Temple courtyard with paved plaza and planting",
    "caption": "Temple courtyard",
    "artistImpression": true,
    "source": "SS-15 Temple Courtyard (portfolio temple-court.webp)"
  },
  {
    "id": "row-houses-dusk",
    "kind": "render",
    "src": "/media/row-houses-dusk.webp",
    "width": 1600,
    "height": 893,
    "blurDataURL": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAQCdASoQAAkAA4BaJQBOjXAANW7loAD+eCeqBeJxYDPrNf62JLPwpthLe/+1a1du2Hrbq/jIiH1+CRq9jgb07ACGe8JCu2VYli2aQewAAA==",
    "alt": "Row houses in the evening with warm window light",
    "caption": "Row houses, evening",
    "artistImpression": true,
    "source": "SS-25 Row Houses at Dusk (portfolio row-houses-dusk.webp)"
  },
  {
    "id": "garden-court",
    "kind": "render",
    "src": "/media/garden-court.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADwAQCdASoQAAwAA4BaJYgCdAC2c4woI5AA/thDRvr97u59q5DyFqDCl/COXV06vMDI1Pjrn1ERavKRiBaZ7rGFyDX9AtGnrpN18omA9ze07VlLp+q2GFa5xejgAA==",
    "alt": "Garden court between row houses",
    "caption": "Garden court",
    "artistImpression": true,
    "source": "SS-24 Row House Garden Court (portfolio garden-court.webp)"
  },
  {
    "id": "play-area",
    "kind": "render",
    "src": "/media/play-area.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAAAwAgCdASoQAAsAA4BaJbACdADpN1Zh1grwgAD+nBwWx2dJArUsu9bBCnwIbUnyihr6rD4DvQDCiBUaIr2//6Mo1gv6Bvh2ee86h10TUIPJVhKwUwCJj31VtZcFm145u0AAAA==",
    "alt": "Children's play area with play equipment and shade trees",
    "caption": "Children's play area",
    "artistImpression": true,
    "source": "SS-23 Childrens Play Area (portfolio play-area.webp)"
  },
  {
    "id": "clubhouse-court",
    "kind": "render",
    "src": "/media/clubhouse-court.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAQCdASoQAAwAA4BaJQBOgCB+GS7ZgAD+yq8UDSx7n9hqSuK055NGXNRpLVQjFgKCPp0qc9Fk05Y2g10qsNWH1hX8vKMkLT1E5RiLIg0AAA==",
    "alt": "Clubhouse beside a parking court",
    "caption": "Clubhouse and parking court",
    "artistImpression": true,
    "source": "SS-13 Clubhouse and Parking Court (portfolio clubhouse-court.webp)"
  },
  {
    "id": "central-lawn",
    "kind": "render",
    "src": "/media/central-lawn.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoQAAsAA4BaJQBOgBSZ83A5AADcwM3tpLFZX81HnLydJvPttchR4/1f24NSnru+3kwwsJfuWhz3bdDoES20b0ZjtQp/6dzphftwQIv2hKjIgAAA",
    "alt": "Central lawn axis framed by residential buildings",
    "caption": "Central lawn axis",
    "artistImpression": true,
    "source": "SS-17 Central Lawn Axis (portfolio central-lawn.webp)"
  },
  {
    "id": "courtyard-playground",
    "kind": "render",
    "src": "/media/courtyard-playground.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADQAQCdASoQAAsAA4BaJQBOgCDNG9WMQAD2m2i72QvhuemE8rkz7CGzg5dyqkMpousK68RYiFpSn/4WkjkA+9pHpURKJ4+IkGAyNpXPyPiIw/ckZgAAAA==",
    "alt": "Courtyard playground seen from above",
    "caption": "Courtyard playground",
    "artistImpression": true,
    "source": "SS-12 Courtyard Playground Elevated (portfolio courtyard-playground.webp)"
  },
  {
    "id": "clubhouse",
    "kind": "render",
    "src": "/media/clubhouse.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADwAQCdASoQAAsAA4BaJYgCdAD0Yu9eI8wA9dWahbQ/CVUbnq28/gV9yHu+wq1WpZvZjWf4L/pQ8rbl5jyR+eFFm0dwG/kf16zi38BAAAA=",
    "alt": "Clubhouse building and lawn",
    "caption": "Clubhouse and lawn",
    "artistImpression": true,
    "source": "SS-20/SS-21 Clubhouse (portfolio clubhouse.webp)"
  },
  {
    "id": "row-house-wing",
    "kind": "render",
    "src": "/media/row-house-wing.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAQCdASoQAAsAA4BaJQBOgCHdiIYAAP60L7l8A2ssWMZ+RSkFKUwyd4P2w/WkwT41PvEbCtIKeP1seWEiOZBOmORx4lu7FvoW23qUAAA=",
    "alt": "Row house wing seen from above with lanes and landscaping",
    "caption": "Row house wing from above",
    "artistImpression": true,
    "source": "SS-03 Aerial Row House Wing (portfolio row-house-wing.webp)"
  },
  {
    "id": "row-house-street",
    "kind": "render",
    "src": "/media/row-house-street.webp",
    "width": 1600,
    "height": 1073,
    "blurDataURL": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADQAQCdASoQAAsAA4BaJZgCdAEIZwPWwAD+4aQ/WM7cSa8l8Uw0pfvCcc5TBh9yT86pu8/vZjfLLfa5+txmnX6aHaTXQmdF6wekU0T0dB13A5TcxHZ8AA==",
    "alt": "Row house street with two-storey homes and car porches",
    "caption": "Row house street",
    "artistImpression": true,
    "source": "SS-27..SS-32 Row House street (portfolio row-house-street.webp)"
  },
  {
    "id": "row-houses-day",
    "kind": "render",
    "src": "/media/row-houses-day.webp",
    "width": 1600,
    "height": 679,
    "blurDataURL": "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADwAQCdASoQAAcAA4BaJZACdAEDTy4JRwAA/mm/ufSBiFh4jrVaTk6ji5RGJVDcklRY5nRe1S/As4r7Mnp7M8fV9KAnYKb9ElAnjcAA",
    "alt": "Two-storey row houses by day with white portal frames, red brick pillars and planters",
    "caption": "Row houses, daytime",
    "artistImpression": true,
    "source": "SS-26 Row Houses by Day (portfolio row-houses-day.webp)"
  },
  {
    "id": "landscape",
    "kind": "render",
    "src": "/media/landscape.webp",
    "width": 1600,
    "height": 1195,
    "blurDataURL": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADwAQCdASoQAAwAA4BaJQBOgCHclUQ70wAA/pttFoFXiPwaQewDvsSQJe2ogabvoil3yZnftC0EGmdMwR1dPjNR86GRCpzs0Lg7ygxKGugAAA==",
    "alt": "Landscaped approach road with trees and planting",
    "caption": "Landscaped approach",
    "artistImpression": true,
    "source": "SS-16 Landscaped Approach (portfolio landscape.webp)"
  },
  {
    "id": "shiv-shiva-logo",
    "kind": "logo",
    "src": "/media/shiv-shiva-logo.png",
    "width": 809,
    "height": 246,
    "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAFCAYAAABM6GxJAAAACXBIWXMAAAsSAAALEgHS3X78AAAAqUlEQVQYlU3PPUuDQRBF4X39QOxshFRWghAIgrEzEQWNqTSKCVpoIQEtLbSw9I/PEwameIvlsnd2D2caBvjBXWutYQsH2I+IveyqP8YhxtjFDroWEd+4wRvOcIuviHjKg9Pq/vGeMzzjBa9J/sM9PivXeMQDlgW9qg9DnJdFglcJ+CiDX4xKd7vyBBeYYY5J3TOvMc1HR6V12du36wESnkapnZmWi1p5vAG2NulRSpnOjQAAAABJRU5ErkJggg==",
    "alt": "Shiv Shiva Township logo",
    "artistImpression": false,
    "source": "portfolio logo.png"
  }
]);

const byId = new Map(media.map((item) => [item.id, item]));

export function getMedia(id: string): Media {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown media id: ${id}`);
  return item;
}
