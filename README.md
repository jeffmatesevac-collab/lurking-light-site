# Lurking Light — site v1.1 (revamp)

One site, two faces: the **studio** (stories + games) and the **guild** (the community around it). Static HTML/CSS/JS. No build step required, no backend, no accounts.

v1.1 turns the old one-page site into a small multi-page site that shows the whole product map: the public parts are real, and the big pieces we haven't built yet each have an honest "not built yet" page.

## Open it
- Double-click `index.html`, **or**
- `cd lurking-light-site && python3 -m http.server 8000` then visit http://localhost:8000

Fonts load from Google Fonts (Poppins 600 wordmark, Space Grotesk UI, JetBrains Mono). Offline it falls back to system fonts.

## Public (real content)
| Page | What it is |
|---|---|
| `index.html` | Home. Hero with Guild/Studio toggle, Discord CTA, Lurker + lure poke. "Pick a door" map of every section (open / preview / soon). Demo lobby. Friday Hang strip with countdown. |
| `studio.html` | Studio pitch, 5 project cards (Skip & Buster, Project Gray, Lurker Shorts, Forever Progress Addon *(idea)*, Something Tabletop), "how we work". |
| `guild.html` | Friday Hang (countdown + RSVP), what we do, Discord card, links to the per-game hubs. |
| `forums.html` | Forums **preview**: boards, threads, replies, sparks, glow, ranks, badges. Local to your browser. |
| `wiki.html` | Public wiki index: category filter, 4 articles, **AI search box that is disabled on purpose** ("AI lookup coming later"). |
| `wiki/*.html` | Sample articles: `lurker`, `friday-hang`, `glow-and-ranks`, `project-gray`. Article layout = TOC + body + infobox, with a "dev wiki" note at the bottom. |
| `games.html` | Games & guild hubs index: WoW Forever, WoW Retail (link to hub stubs), plus two open slots (Tabletop, "your game here"). |

## Stubs (same chrome, "not built yet" copy, nothing saves)
| Page | Holds the idea for |
|---|---|
| `account.html` | Sign-in and saved builds/wiki notes. Disabled "Sign in with Discord · soon" button. |
| `wiki-dev.html` | Private dev wiki: same pages as public, plus tuning numbers once logged in. |
| `hubs/forever.html` | WoW Forever guild hub: GL / officers / Discord channel / realm placeholders, empty Roster, Events, "What we still need". |
| `hubs/retail.html` | Retail guild hub, same shape. |
| `tools/index.html` | List of tool stubs. |
| `tools/talent.html` | Talent/build calculator: "If a game has trees, builds live here." |
| `tools/forever-addon.html` | Forever progress addon idea. Wedge: alt-wide Forever completion + guild-synced "what we still need". Not another Questie. **No addon code.** |

Nav on every page: Home, Studio, Guild, Forums, Wiki, Games, Account (muted, "soon"). Footer sitemap splits **public** vs **coming later**.

## Site-wide game layer
Nav HUD shows rank + glow on every page. Quests: visit lobby/studio/guild/forums/wiki/games, flip the toggle, RSVP, post, spark, poke the lure, find a secret. Saved in `localStorage` (`ll.v1`) only.
Easter eggs: poke the lure 7× on Home = **Lights Out** (Esc to undo). Konami code (↑↑↓↓←→←→BA) on any page = Lurker swims by.

## File map
```
index.html  studio.html  guild.html  forums.html  wiki.html  games.html
account.html  wiki-dev.html
wiki/      lurker.html  friday-hang.html  glow-and-ranks.html  project-gray.html
hubs/      forever.html  retail.html
tools/     index.html  talent.html  forever-addon.html
styles.css   one stylesheet (v1 styles + a "v1.1 additions" block at the bottom)
app.js       one script for every page; each block only runs if its markup is on the page
assets/      mark, favicons, Lurker art
_dev/build_pages.py   optional: regenerates every page's HTML with the shared header/footer
```
**Editing:** pages are plain HTML, so you can hand-edit any file. If you change the nav/footer, edit `_dev/build_pages.py` and run `python3 _dev/build_pages.py`. That **overwrites** all the HTML pages, so put content changes in the script too, or skip the script and edit by hand.

## Placeholders (swap before going live)
- **Discord invite:** `https://discord.gg/lurkinglight` everywhere, marked `data-placeholder="discord"`. Not a confirmed invite.
- **Hub contacts:** GL, officers, `#forever` / `#retail` channels, realm are all "TBD" (`data-placeholder="gl"`, `"discord-channel"`).
- **Presence data (lobby):** fake, labeled "demo mode · fake data". Real version: Discord server widget or a small bot.
- **Forums:** front-end only. Real version needs a backend (e.g. Discourse with Discord SSO).
- **Friday Hang time:** Fridays 8 PM ET. Change `nextFriday()` in `app.js`.
- **Wiki search:** UI only, disabled. No AI.
- **Project blurbs, member names, wiki lore:** made up and kept vague on purpose.

## Not built (on purpose)
Accounts, AI wiki lookup, private/dev wiki, talent calculator, real Discord presence, real forums, the Forever addon.

## Assets (copied from Forge into `assets/`)
- `mark.png` / `mark.svg`: Mark v3 (stack_wide)
- `favicon-32.png`, `favicon-64.png`
- `lurker-hero.webp`: friendly Lurker (hero + Lurker wiki page)
- `lurker-anime.webp`: alternate, unused
- `lurker-sprite.png`: transparent sprite (Konami swim, faded on stub pages)

Palette: navy `#0E1B26`, teal `#8DBAB8`, cream `#F5E3BD`, charcoal/silver accents.
