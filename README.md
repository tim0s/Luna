# Luna — Moon Behind Structures Photography Planner

**Live app: https://tim0s.github.io/Luna/**

Luna helps photographers find the best spots and moments to capture the moon rising or setting behind buildings, towers, antennas, or other structures. Given a tall object and a time window, it computes where you need to stand — and when — so that the moon appears behind the object, then shows the shooting zones on an interactive map.

## What it does

Each shaded polygon on the map is a shooting zone for one qualifying moment: stand anywhere inside it and some part of the moon will be behind the object. The zone is wider close to the object (where its width covers more of the sky) and narrows with distance, capped at the point where the moon would no longer reach behind the object at all. Zones are colored on a plasma scale from early (purple) to late (yellow) within the displayed date range.

Click inside any zone to open a WebGL scene preview: a simulated view from that exact spot looking back toward the object, with the moon rendered in its correct phase behind it. You can step ±15 minutes around the moment, change sensor size and focal length, and toggle landscape/portrait orientation to plan your framing before you head out.

From the preview you can download a **calendar entry** (`.ics`) for that specific shot. The 30-minute event includes the shooting coordinates, moon data, and a link back to Luna that reopens the app at the exact object, location, and date — useful for sharing a shot with someone or for finding it again later.

## How it works

### Moon position
Moon altitude and azimuth are calculated using the full Meeus *Astronomical Algorithms* Ch. 47 series (60 longitude terms, 20 latitude terms, 15 distance terms), with topocentric parallax correction. Sun altitude uses a simplified Meeus formula for the same timestamp. No external astronomy API is used.

### Terrain
Elevation data is loaded on-demand from [AWS Terrarium tiles](https://registry.opendata.aws/terrain-tiles/) at zoom 12 (~10 m/px). The raw RGB-encoded elevation values are decoded and stored in a floating-point grid, then sampled via bicubic Catmull-Rom interpolation for smooth results.

### Shooting zone calculation
Standing at the exact distance where the moon grazes the object's tip is only the outer edge of "behind the object" — any closer distance also keeps the moon hidden behind the object's body, since its apparent height grows as you approach. Any position within the object's angular width works too, not just the exact line to its center. And the moon doesn't need to be fully covered — an edge-on overlap between the moon's disc and the object's silhouette still counts.

For each qualifying timestamp, the code computes this as a quadrilateral:
- **Far edge**: a ray traced from the top of the object in the anti-moon direction, stepped outward at configurable intervals and checked against the terrain surface (refined with linear interpolation), same as the original tip-alignment calculation — but using the moon's lower limb (its center altitude minus its apparent angular radius, ~0.26°) instead of its center, so the zone extends slightly past pure center-alignment to capture a grazing shot.
- **Near edge**: the configured minimum distance from the object.
- **Left/right edges**: the object's angular half-width at each distance (`atan(width/2 / distance)`), also widened by the moon's angular radius.

### Scene preview (WebGL)
The preview is rendered with a WebGL fragment shader that:
- Reads a 1024-sample skyline texture (maximum terrain elevation angle at each horizontal pixel column) computed via ray-marching from the observer position
- Draws sky, terrain silhouette, moon disc + glow, and the object silhouette
- Adjusts sky brightness based on sun altitude (night → deep blue / day → pale)

### Filters
Only moments that pass all of the following are shown — these help ensure the shot is actually worth taking:
- Moon altitude above a minimum (default 2°)
- Sun altitude below a maximum (default 0° — sun must be below the horizon for a dark sky)
- Moon illumination above a minimum (default 30% — thin crescents are hard to photograph)
- Shooting zone within the map area and beyond a minimum distance from the object

## Settings

Click the ⚙ button to change:

| Field | Meaning |
|---|---|
| Latitude / Longitude | Object position |
| Height / Width | Object dimensions in metres |
| Start / End | Time window to scan |
| Step | Time resolution in hours |
| Min moon altitude | Reject moments when moon is too low |
| Min distance | Sets the near edge of each shooting zone |
| Max sun altitude | Reject moments when it is not dark enough |
| Min moon illum % | Reject thin crescents |
| Timezone | Display timezone for timestamps (IANA name or `local`) |

The date filter bar at the top of the map lets you narrow the displayed zones without a full recalculation.

## Tech stack

- [Leaflet](https://leafletjs.com/) for the map
- [Esri Light Gray Canvas](https://www.arcgis.com/home/item.html?id=8b3d38c0819547faa83f7b7aca80bd76) basemap tiles
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium format) for elevation
- WebGL (via `canvas.getContext('webgl')`) for the scene preview
- No build step — plain HTML + JS, runs entirely in the browser
