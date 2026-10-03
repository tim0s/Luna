# Luna — Moon Behind Structures Photography Planner

**Live app: https://tim0s.github.io/Luna/**

Luna helps photographers find the best spots and moments to capture the moon rising or setting behind buildings, towers, antennas, or other structures. Given a tall object and a time window, it computes where you need to stand — and when — so that the moon passes directly behind the object, then shows those locations on an interactive map.

## What it does

For each qualifying moment, Luna draws ten thin ribbons on the map — one for each tenth of the object's height (10%, 20%, ... up to the full tip) — showing where to stand so the moon appears behind that part of the object. Each ribbon's width is the moon's own apparent width (its left and right edges grazing the object), and its length traces how the ideal position drifts over a ±10 minute window, so you can see how quickly you need to move to track the moon. Ribbons are interrupted wherever terrain between you and the object would hide that part of it — for example on the back slope of a ridge the moon's track jumps across. All the ribbons for one moment share the same color, drawn on a plasma scale from early (purple) to late (yellow) within the displayed date range.

Click inside any ribbon to open a WebGL scene preview: a simulated view from that shooting location looking back toward the object, with the moon rendered in its correct phase behind it. The preview opens at the minute when the moon, seen from exactly the spot you clicked, comes closest to the object. You can step ±15 minutes around that moment, change sensor size and focal length, and toggle landscape/portrait orientation to plan your framing before you head out.

Below the scene, a **line-of-sight profile** shows the terrain between you and the object from the side, with the sight line to the point where the moon passes behind the object. The ground is coloured by clearance under that line — how tall a tree or building could be there without blocking the shot (red < 15 m, orange 15–40 m, green > 40 m) — so you know where to look for obstructions and where you don't need to worry. Hover or tap the profile for the exact distance, ground elevation and clearance at any point. The terrain data is bare ground, so trees and buildings themselves aren't included.

From the preview you can download a **calendar entry** (`.ics`) for that specific shot. The 30-minute event includes the shooting coordinates, moon data, and a link back to Luna that reopens the app at the exact object, location, and date — useful for sharing a shot with someone or for finding it again later.

## How it works

### Moon position
Moon altitude and azimuth are calculated using the full Meeus *Astronomical Algorithms* Ch. 47 series (60 longitude terms, 20 latitude terms, 15 distance terms), with topocentric parallax correction. Sun altitude uses a simplified Meeus formula for the same timestamp. Atmospheric refraction is applied to both (Sæmundsson's formula, Meeus eq. 16.4, with pressure scaled for elevation): it lifts the apparent altitude by about 0.5° at the horizon and 0.1° at 8°, which matters because Luna's shots are typically only a few degrees up. It can be switched off in the settings. No external astronomy API is used.

### Terrain
Elevation data is loaded on-demand from [AWS Terrarium tiles](https://registry.opendata.aws/terrain-tiles/) at zoom 12 (~10 m/px). The raw RGB-encoded elevation values are decoded and stored in a floating-point grid, then sampled via bicubic Catmull-Rom interpolation for smooth results.

### Shooting location calculation
For each qualifying timestamp, the code traces a ray from a given fraction of the object's height (10%–100%) in the anti-moon direction, using the moon's own azimuth shifted by its apparent angular radius (~0.26°) to either side — this gives the left-edge and right-edge tracks that bound a ribbon, rather than a single point. Each ray steps outward in configurable intervals (default 30 m) and checks whether the ray height drops below the terrain surface; the intersection is refined with linear interpolation. Repeating this for ten height fractions gives ten stacked ribbons per moment, each showing where to stand so the moon is behind that specific part of the object. Each ribbon is then cut into ~50 m slices and a line-of-sight check (eye 1.5 m above ground) from each slice's centre to that height on the object drops the slices from where the terrain blocks the view.

### Scene preview (WebGL)
The preview is rendered with a WebGL fragment shader that:
- Reads a 1024-sample skyline texture (maximum terrain elevation angle at each horizontal pixel column) computed via ray-marching from the observer position
- Draws sky, terrain silhouette, moon disc + glow, and the object silhouette
- Keeps a second skyline of only the terrain in front of the object: any part of the object hidden behind it blinks as a red hatched ghost, with a "hidden by terrain" label, instead of being drawn as if visible
- Adjusts sky brightness based on sun altitude (night → deep blue / day → pale)

### Filters
Only moments that pass all of the following are shown — these help ensure the shot is actually worth taking:
- Moon altitude above a minimum (default 2°)
- Sun altitude below a maximum (default 0° — sun must be below the horizon for a dark sky)
- Moon illumination above a minimum (default 30% — thin crescents are hard to photograph)
- Shooting location within the map area and beyond a minimum distance from the object

### Weather
Luna fetches a 16-day hourly forecast for the object's location from [Open-Meteo](https://open-meteo.com/) (no API key needed) and rates each moment by what actually hides the moon: low and mid cloud and rain chance weigh heavily, thin high cloud only a little.
- The preview shows cloud cover (low / mid / high), rain chance and visibility for the selected minute.
- Ribbons of moments forecast to be clouded out are faded on the map, and the status badge counts clear ✨, partly cloudy ⛅ and cloudy ☁️ moments.
- Cloud forecasts are only reliable a few days ahead: beyond 5 days the preview marks the forecast as uncertain, and those moments are never faded or counted.
- If the forecast can't be loaded, Luna works exactly as without it.

## Settings

Click the ⚙ button to change:

| Field | Meaning |
|---|---|
| Latitude / Longitude | Object position |
| Height / Width | Object dimensions in metres |
| Start / End | Time window to scan |
| Step | Time resolution in hours |
| Min moon altitude | Reject moments when moon is too low |
| Min distance | Reject shooting locations too close to the object |
| Max sun altitude | Reject moments when it is not dark enough |
| Min moon illum % | Reject thin crescents |
| Atmospheric refraction | Use apparent (refracted) moon and sun altitudes — on by default |
| Timezone | Display timezone for timestamps (IANA name or `local`) |
| Show my location (GPS) | Blue dot on the map, a ◎ button to centre on it, and in the preview how far and in which direction the selected spot is from you. Off by default; saved on this device only, never in shared links |

The date filter bar at the top of the map lets you narrow the displayed ribbons without a full recalculation.

## Tech stack

- [Leaflet](https://leafletjs.com/) for the map
- [Esri Light Gray Canvas](https://www.arcgis.com/home/item.html?id=8b3d38c0819547faa83f7b7aca80bd76) basemap tiles
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium format) for elevation
- [Open-Meteo](https://open-meteo.com/) for the weather forecast
- WebGL (via `canvas.getContext('webgl')`) for the scene preview
- No build step — plain HTML + JS, runs entirely in the browser
