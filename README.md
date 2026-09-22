# Luna — Moon Behind Structures Photography Planner

**Live app: https://tim0s.github.io/Luna/**

Luna helps photographers find the best spots and moments to capture the moon rising or setting behind buildings, towers, antennas, or other structures. Given a tall object and a time window, it computes where you need to stand — and when — so that the moon passes directly behind the object, then shows those locations on an interactive map.

## What it does

Each arrow on the map is a shooting location: stand at the arrowhead at the indicated time and the moon will appear behind the object. The arrow direction shows how the ideal position shifts over ±10 minutes, so you can see how quickly you need to move to track the moon. Arrows are colored on a plasma scale from early (purple) to late (yellow) within the displayed date range.

Click any arrow to open a WebGL scene preview: a simulated view from that shooting location looking back toward the object, with the moon rendered in its correct phase behind it. You can step ±15 minutes around the moment, change sensor size and focal length, and toggle landscape/portrait orientation to plan your framing before you head out.

From the preview you can download a **calendar entry** (`.ics`) for that specific shot. The 30-minute event includes the shooting coordinates, moon data, and a link back to Luna that reopens the app at the exact object, location, and date — useful for sharing a shot with someone or for finding it again later.

## How it works

### Moon position
Moon altitude and azimuth are calculated using the full Meeus *Astronomical Algorithms* Ch. 47 series (60 longitude terms, 20 latitude terms, 15 distance terms), with topocentric parallax correction. Sun altitude uses a simplified Meeus formula for the same timestamp. No external astronomy API is used.

### Terrain
Elevation data is loaded on-demand from [AWS Terrarium tiles](https://registry.opendata.aws/terrain-tiles/) at zoom 12 (~10 m/px). The raw RGB-encoded elevation values are decoded and stored in a floating-point grid, then sampled via bicubic Catmull-Rom interpolation for smooth results.

### Shooting location calculation
For each qualifying timestamp, the code traces a ray from the top of the object in the anti-moon direction. It steps outward at configurable intervals and checks whether the ray height drops below the terrain surface. The intersection point — where the moon shadow tip falls — is the location you stand to photograph the moon directly behind the structure. The intersection is refined with linear interpolation for accuracy.

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
- Shooting location within the map area and beyond a minimum distance from the object

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
| Timezone | Display timezone for timestamps (IANA name or `local`) |

The date filter bar at the top of the map lets you narrow the displayed arrows without a full recalculation.

## Tech stack

- [Leaflet](https://leafletjs.com/) for the map
- [Esri Light Gray Canvas](https://www.arcgis.com/home/item.html?id=8b3d38c0819547faa83f7b7aca80bd76) basemap tiles
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium format) for elevation
- WebGL (via `canvas.getContext('webgl')`) for the scene preview
- No build step — plain HTML + JS, runs entirely in the browser
