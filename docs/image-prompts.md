# Image prompts (landing + categories)

Style for all (paste at the end of every prompt):
`editorial fashion photography, warm earth tones (camel, ivory, espresso brown, muted gold), soft cinematic studio light, shallow depth of field, premium minimal luxury brand look, no text, no logos, no watermark`

## Landing page — overwrite these files in `public/` (no code change needed)

| File | Size | Prompt |
|---|---|---|
| `hero-fashion.jpg` | 1200x1500 (4:5), subject near top | Elegant woman in a tailored camel coat and ivory wide-leg trousers, full body, standing in a minimal plaster-walled atelier |
| `banner-apparel.jpg` | 1200x1500 (4:5) | Stylish man in a relaxed oatmeal overshirt, charcoal trousers and clean leather sneakers, full body, urban concrete backdrop, golden hour |
| `banner-runway.jpg` | 2400x1200 (2:1) | Wide fashion runway show, models walking in neutral tailored looks, warm spotlights, audience silhouettes, cinematic dark mood |

## Categories — save as `public/images/categories/<slug>.jpg`, 800x1200 (2:3), portrait, subject centered

| File | Prompt |
|---|---|
| `top.jpg` | Folded and draped cream cotton blouse and knit tops on a beige linen surface, or a model in an oversized white tunic |
| `pants.jpg` | Model from the waist down in high-rise wide-leg camel trousers, tailored fold details |
| `dress.jpg` | Flowing midi dress in terracotta silk on a model, movement in the fabric, soft backlight |
| `jacket.jpg` | Model in a structured suede overshirt / leather jacket, upper body, moody warm light |
| `shoes.jpg` | Pair of premium leather loafers and sneakers on a stone plinth, side lighting |
| `hat.jpg` | Wool fedora and bucket hat on a minimal shelf, warm shadows |
| `bag.jpg` | Structured tan leather handbag on a marble block, soft shadow |
| `jewelry.jpg` | Gold necklace and rings on a silk fabric, macro, shallow depth of field |
| `glasses.jpg` | Tortoiseshell sunglasses on a plaster surface with a soft shadow |

After the files are in place, run: `node backend/scripts/set_category_images.js`
(it only updates categories whose file exists in `public/images/categories/`).
