# easy-obfuscator

*by Roman Skrylnyk — [github.com/r-skrylnyk](https://github.com/r-skrylnyk/)*  
*Inspired by [obscure](https://github.com/bitstrider/obscure) by Jason Yung*

CSS/HTML class & ID obfuscator with **config file support**, **multi-format files** (.html, .php, .vue, .jsx) and **external exclude lists**.

---

## Встановлення

```bash
npm install -g easy-obfuscator
```

---

## Швидкий старт (CLI)

```bash
easy-obfuscator style.css --apply index.html --output ./dist --seed 42
```

Знаходить усі класи та ID у `style.css`, перейменовує їх у хеш-назви і застосовує до `style.css` + `index.html`.

---

## Усі CLI параметри

| Параметр | Скорочення | Опис |
|----------|-----------|------|
| `[include]` | — | CSS файл(и) з визначеннями класів/ID (рядок, glob або через кому) |
| `--apply <files>` | `-a` | Файли для обфускації: .html, .htm, .php, .vue, .jsx, .tsx |
| `--output <dir>` | `-o` | Директорія виводу (за замовчуванням: поруч із вихідними файлами) |
| `--exclude <files>` | `-e` | CSS файли, чиї класи треба пропустити (напр. Bootstrap) |
| `--exclude-list <file>` | `-x` | .json або .txt файл зі списком класів для пропуску |
| `--seed <number>` | `-s` | Ціле число для відтворюваної обфускації |
| `--config <file>` | `-c` | Шлях до конфіг-файлу (за замовч: `easy-obfuscator.config.js`) |
| `--version` | `-V` | Версія |
| `--help` | `-h` | Довідка |

---

## Конфіг-файл

Замість довгих команд — один файл `easy-obfuscator.config.js` у корені проєкту:

```js
// easy-obfuscator.config.js
module.exports = {
  include:     'style.css',
  apply:       ['index.html', 'about.html', 'partials/*.php'],
  output:      './dist',
  seed:        42,
  exclude:     'assets/js-cdn/bootstrap.min.css',
  excludeList: 'exclude-classes.json',
};
```

Запуск із конфігом — просто:
```bash
easy-obfuscator
```

CLI-прапори **завжди перевизначають** значення з конфіг-файлу.

---

## Список виключень (`--exclude-list`)

Деякі класи (наприклад Bootstrap, ваші JS-хуки) не потрібно обфускувати. Замість того щоб хардкодити їх у код — задайте список файлом.

### JSON формат
```json
["navbar", "active", "show", "collapse", "modal", "dropdown"]
```

### TXT формат (один рядок — одна назва)
```
navbar
.active
#sidebar
show
collapse
```

Запуск:
```bash
easy-obfuscator style.css --apply index.html --exclude-list exclude-classes.json
```

---

## Батч-режим та Glob

```bash
# Всі CSS та HTML у директорії
easy-obfuscator *.css --apply *.html --output ./dist

# Список через кому
easy-obfuscator style.css,components.css --apply index.html,about.html

# PHP шаблони
easy-obfuscator style.css --apply "partials/*.php" --output ./dist
```

---

## Підтримувані формати файлів

| Формат | Спосіб обробки | Примітки |
|--------|----------------|---------|
| `.html`, `.htm` | cheerio (HTML mode) | Повноцінна DOM-маніпуляція |
| `.php` | cheerio (XML mode) | Теги не нормалізуються |
| `.vue` | cheerio (XML mode) | `<template>` блок обробляється |
| `.jsx`, `.tsx` | cheerio (XML mode) | className атрибути оновлюються |

---

## Вихідні файли

| Файл | Опис |
|------|------|
| `<output>/<original_name>.css` | Обфускований CSS |
| `<output>/<original_name>.html` | Обфускований HTML/PHP/Vue |
| `<output>/easy-obfuscator.map.json` | JSON-карта з метаданими та таблицею відповідностей |

### Структура map-файлу
```json
{
  "tool": "easy-obfuscator",
  "version": "1.0.0",
  "generated": "2026-03-26T10:00:00.000Z",
  "seed": 42,
  "stats": {
    "obfuscated": 127,
    "skipped": 12,
    "files": 2
  },
  "map": {
    ".container": { "sym": ".", "origin": "container", "obfused": "rAb3Kp" },
    "#header":    { "sym": "#", "origin": "header",    "obfused": "rXm9Lq" }
  }
}
```

---

## Відтворювані збірки (`--seed`)

```bash
# Без --seed: різна обфускація при кожному запуску
easy-obfuscator style.css --apply index.html

# З --seed: однаковий результат завжди
easy-obfuscator style.css --apply index.html --seed 42
```

**Рекомендовано для CI/CD** — зміни в Git будуть мінімальними між збірками.

---

## Використання у Docker

```dockerfile
FROM node:18-bullseye-slim AS builder

RUN npm install -g easy-obfuscator

WORKDIR /app
COPY . .

# З конфіг-файлом (рекомендовано)
RUN easy-obfuscator

# Або напряму
# RUN easy-obfuscator style.css --apply index.html --output /output/dist --seed 42

FROM alpine:3.18
COPY --from=builder /output/dist /dist
```

---

## Порівняння з `obscure`

| Можливість | obscure | easy-obfuscator |
|-----------|---------|-----------------|
| CSS обфускація | ✅ | ✅ |
| HTML обфускація | ✅ | ✅ |
| PHP / Vue / JSX | ❌ | ✅ |
| Конфіг-файл | ❌ | ✅ |
| Зовнішній список виключень | ❌ | ✅ |
| JSON map-файл з метаданими | ❌ | ✅ |
| Виправлений баг lastIndex | ❌ | ✅ |
| Актуальні залежності (Node 16+) | ❌ | ✅ |
| 0 вразливостей (npm audit) | ❌ | ✅ |

---

## Структура модуля

```
easy-obfuscator/
├── index.js                          ← CLI точка входу (bin)
├── lib/
│   ├── core.js                       ← головна функція run()
│   ├── css-parser.js                 ← парсер CSS-селекторів
│   └── config.js                     ← завантаження конфіг-файлу
├── easy-obfuscator.config.example.js ← приклад конфігурації
├── package.json
├── LICENSE
└── README.md
```

---

## Ліцензія

MIT © 2026 Roman Skrylnyk (etozheroma)  
Inspired by [obscure](https://github.com/bitstrider/obscure) © 2016 Jason Yung (bitstrider)  
See [LICENSE](./LICENSE).
