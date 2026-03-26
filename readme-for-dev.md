# use-obfuscator — Developer Notes

Цей файл для мене особисто: як паблішити пакет, як версіонувати, як тестувати локально.

---

## Структура пакету

```
use-obfuscator/
├── index.js                        ← CLI entrypoint (bin)
├── lib/
│   ├── core.js                     ← вся логіка обфускації
│   ├── css-parser.js               ← парсер CSS селекторів
│   └── config.js                   ← завантаження конфіг-файлу
├── .github/
│   └── workflows/
│       └── publish.yml             ← auto-publish при git tag
├── .gitignore
├── .npmignore
├── use-obfuscator.config.example.js
└── package.json
```

**`.npmignore`** — що НЕ потрапляє в npm-пакет:
- `.vscode/`
- `*.config.example.js`
- `test/`
- `.gitignore`
- `.git/`

---

## Публікація в npm — перший раз (вручну)

> Потрібен акаунт на https://www.npmjs.com

```bash
# 1. Залогінитись
npm login
# Введе: username, password, email, OTP (якщо є 2FA)

# 2. Перевірити що публікується (dry run — нічого не відправляє)
npm publish --dry-run --access public

# 3. Реальна публікація
npm publish --access public
```

Після цього пакет доступний як:
```bash
npm install -g use-obfuscator
```

---

## Публікація нової версії (автоматично через GitHub Actions)

### Крок 1 — Додати NPM_TOKEN в GitHub Secrets (один раз)

1. Зайти на https://www.npmjs.com → **Access Tokens** → **Generate New Token** → тип **Automation**
2. Скопіювати токен
3. GitHub репо → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: токен з кроку 1

### Крок 2 — Оновити версію і запушити тег

```bash
# Patch: 1.0.0 → 1.0.1
npm version patch

# Minor: 1.0.0 → 1.1.0
npm version minor

# Major: 1.0.0 → 2.0.0
npm version major

# Запушити коміт + тег одночасно
git push origin main --tags
```

`npm version` автоматично:
- Оновлює `version` в `package.json`
- Робить git commit
- Створює git tag `v1.0.x`

GitHub Actions спрацює на тег → перевірить що тег = версія в package.json → зробить `npm publish`.

### Що робить publish.yml

```
git tag v1.0.1
    ↓
GitHub Actions запускає publish.yml
    ↓
npm ci (встановлює залежності)
    ↓
Перевіряє: tag "v1.0.1" == package.json version "1.0.1"  (якщо ні — fail)
    ↓
npm publish --provenance --access public
    ↓
Пакет на npmjs.com
```

---

## Локальне тестування CLI

```bash
# З папки пакету — встановити глобально через symlink
npm link

# Тепер use-obfuscator доступний як CLI
use-obfuscator --version
use-obfuscator --help

# Тестовий запуск (з папки вашого сайту)
use-obfuscator style.css --apply index.html --output ./dist --seed 42

# Після тестування — прибрати symlink
npm unlink -g use-obfuscator
```

---

## Локальна перевірка що потрапить в пакет

```bash
npm pack --dry-run
```

Виведе список файлів які будуть запаковані. Якщо щось зайве — додати в `.npmignore`.

---

## Перевірка опублікованого пакету

```bash
# Переглянути метадані на npm
npm info use-obfuscator

# Переглянути список файлів в опублікованому пакеті
npm pack use-obfuscator --dry-run 2>/dev/null || npx -y npm-package-json-lint use-obfuscator
```

Або просто: https://www.npmjs.com/package/use-obfuscator

---

## Карта обфускації (output)

Після запуску в output директорії з'явиться `use-obfuscator.map.json`:

```json
{
  "tool": "use-obfuscator",
  "version": "1.0.0",
  "generated": "2026-03-26T10:00:00.000Z",
  "seed": 42,
  "stats": {
    "obfuscated": 125,
    "skipped": 18,
    "files": 2
  },
  "map": {
    ".navbar": { "sym": ".", "origin": "navbar", "obfused": "r3kX9" },
    ...
  }
}
```

> У старого obscure карта звалась `obscure.map`. Тут — `use-obfuscator.map.json`.

---

## Зміна конфіг-файлу

Якщо в сайті треба змінити виключення — редагувати `exclude-classes.json` в репо сайту (НЕ тут у пакеті). Список класів для пропуску — там.

---

## Посилання

- npm: https://www.npmjs.com/package/use-obfuscator
- GitHub: https://github.com/r-skrylnyk/use-obfuscator
- Старий пакет (obscure): https://github.com/bitstrider/obscure
