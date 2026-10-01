# Ankara Madeni Yağ — ankaramdeniyaglar.com.tr

Statik web sitesi. Derleme adımı yoktur; dosyalar olduğu gibi Cloudflare'e yüklenir (`wrangler.jsonc`).

## Yapı

| Dosya / klasör | İçerik |
| --- | --- |
| `index.html` | Ana sayfa: ürün kataloğu, teklif listesi, yorumlar, SSS, iletişim |
| `toptan.html` | Toptan satış: ambalajlar, ürün grupları, teklif formu |
| `iletisim.html` | Adres, harita, çalışma saatleri, mesaj formu |
| `blog.html` | Blog ve rehber listesi |
| `blog-rehber-*.html` | Rehber yazıları |
| `blog-<marka>-<ürün>.html` | Ürün inceleme sayfaları |
| `404.html` | Bulunamayan sayfalar |
| `assets/css/site.css` | Tüm sayfaların ortak stili (renkler en üstteki `:root` içinde) |
| `assets/js/site.js` | Mobil menü, teklif listesi, filtreleme, formlar |
| `assets/img/icons.svg` | Simge seti |
| `_headers`, `.assetsignore` | Cloudflare önbellek/güvenlik başlıkları ve yayınlanmayacak dosyalar |

## Sık yapılan değişiklikler

- **Ana sayfaya ürün eklemek:** `index.html` içinde `<article class="p-card ...">` ile başlayan bir ürün bloğunu kopyalayın; marka, ad, açıklama ve `data-id` değerini değiştirin (`data-id` her ürün için benzersiz olmalı). `data-cat` değeri ürün grubunu belirler: `hidrolik`, `motor`, `disli`, `gres`, `is-makinesi`, `adblue`, `antifriz`. Aynı ürünü `toptan.html` içindeki ilgili grup listesine de ekleyin.
- **Yeni blog yazısı:** Mevcut bir `blog-rehber-*.html` dosyasını kopyalayıp içeriği değiştirin; `blog.html` listesine bir kart ve `sitemap.xml` dosyasına adresini ekleyin.
- **CSS veya JS değiştirdikten sonra:** Ziyaretçilerin eski dosyayı önbellekten almaması için HTML dosyalarındaki `site.css?v=...` ve `site.js?v=...` değerlerini artırın.
