"""Build a self-hostable copy of the invitation in dist/ with a WhatsApp/social share preview.

Usage:  python3 build.py https://your-site.example   (the address where dist/ will be hosted)
Then upload the dist/ folder to any static host (Netlify Drop, GitHub Pages, Vercel).
"""
import shutil, sys, pathlib

root = pathlib.Path(__file__).parent
site = (sys.argv[1] if len(sys.argv) > 1 else "").rstrip("/")
dist = root / "dist"
shutil.rmtree(dist, ignore_errors=True)
(dist / "images").mkdir(parents=True)
for f in (root / "images").iterdir():
    shutil.copy(f, dist / "images" / f.name)
shutil.copy(root / "theme.css", dist / "theme.css")

PAGES = [
    ("index.html", "Preeti & Vivek · 20–21 December 2026",
     "You're invited to our wedding at Treasure Island, Lonavala. Itinerary, wardrobe guide, reception and RSVP inside.",
     "images/share-preview.jpg"),
    ("save-the-date.html", "Save the Date · Preeti & Vivek",
     "Save the date: 20–21 December 2026 at Treasure Island, Lonavala. Invitation to follow.",
     "images/save-the-date-preview.jpg"),
]
ARTIFACT = "https://claude.ai/artifact/B9oJznPErYZHz5gShCeSMi"

for page, title, desc, img in PAGES:
    body = (root / page).read_text()
    # Links that point at the claude.ai invitation now point at the hosted copy
    body = body.replace(ARTIFACT, (site + "/") if site else "index.html")
    image = f"{site}/{img}" if site else img
    url = f"{site}/{'' if page == 'index.html' else page}" if site else ""
    head = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
{f'<meta property="og:url" content="{url}">' if url else ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#dce8f4">
<link rel="icon" href="images/monogram.webp">
<style>html,body{{height:100%}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
"""
    (dist / page).write_text(head + body + "\n</body>\n</html>\n")

print(f"Built {dist}" + ("" if site else "  (tip: pass your site URL so the preview image link is absolute)"))
