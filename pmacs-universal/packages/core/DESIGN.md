# P-MACS Universal Design System

## Design Philosophy

**Professional + Traditional with Modern Elements**
- Boxy layout with minimal corner rounding
- Clean, clinical appearance appropriate for healthcare
- High contrast for readability
- Icon-based UI (no emojis)

---

## Color Palette

### Primary Colors
```
Healthcare Blue (Primary):     #2774AE
Deep Navy (Headers/Emphasis):  #003B5C
White (Background):            #FFFFFF
Off-White (Cards/Surfaces):    #F8FAFC
```

### Secondary Colors
```
Light Blue (Hover/Selection):  #DAEBFE
Sky Blue (Info/Secondary):     #60A5FA
Slate Gray (Text Secondary):   #64748B
```

### Status Colors
```
Success Green:    #10B981  (Available, adequate stock)
Warning Amber:    #F59E0B  (Low stock, approaching expiry)
Critical Red:     #EF4444  (Stockout, expired, urgent)
Info Cyan:        #06B6D4  (Informational, forecasts)
```

### Surface Colors
```
Card Background:      #FFFFFF
Card Border:          #E2E8F0
Divider:              #CBD5E1
Input Background:     #F1F5F9
Input Border:         #94A3B8
Input Focus Border:   #2774AE
```

---

## Typography

- **Font Family**: Inter or SF Pro
- **Scale**: 8px grid system
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

## Spacing & Layout

- **Grid**: 8px base unit
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Container Max Width**: 1440px
- **Content Max Width**: 800px (chat, forms)

---

## Component Styling

### Cards
```
Background:      #FFFFFF
Border:          1px solid #E2E8F0
Border Radius:   6px (boxy, minimal rounding)
Shadow:          0 1px 3px rgba(0,0,0,0.05)
Padding:         16px
```

### Buttons
```
Primary:
  Background:    #2774AE
  Text:          #FFFFFF
  Border Radius: 4px
  Height:        44px

Secondary:
  Background:    #FFFFFF
  Text:          #2774AE
  Border:        1px solid #2774AE
  Border Radius: 4px
  Height:        44px
```

### Inputs
```
Background:      #F1F5F9
Border:          1px solid #94A3B8
Focus Border:    2px solid #2774AE
Border Radius:   4px (boxy)
Height:          48px
Padding:         12px 16px
```

### Status Indicators
```
Available:  [●] #10B981 + checkmark icon
Low Stock:  [●] #F59E0B + warning icon
Stockout:   [●] #EF4444 + error icon
Expired:    [●] #94A3B8 + clock icon
```

---

## Shadows

```
Subtle:     0 1px 3px rgba(0,0,0,0.05)
Card:       0 2px 4px rgba(0,0,0,0.05)
Elevated:   0 4px 6px rgba(0,0,0,0.07)
Modal:      0 10px 25px rgba(0,0,0,0.15)
```

---

## Animations

- **Duration**: 200-300ms
- **Easing**: ease-out
- **Hover Transitions**: 150ms
- **Page Transitions**: 250ms

---

## Icon System

Use Lucide (Web) / Material Icons (Flutter) - **NO EMOJIS**

| Concept | Icon Name | Flutter | Web |
|---------|-----------|---------|-----|
| Success/OK | check-circle | Icons.check_circle | CheckCircle |
| Warning | alert-triangle | Icons.warning_amber | AlertTriangle |
| Error/Critical | x-circle | Icons.cancel | XCircle |
| Location | map-pin | Icons.location_on | MapPin |
| Document | file-text | Icons.description | FileText |
| Download | download | Icons.download | Download |
| Pill/Drug | pill | Custom SVG | Pill |
| Chart | bar-chart-2 | Icons.bar_chart | BarChart2 |
| Clock/Time | clock | Icons.access_time | Clock |
| Trend Up | trending-up | Icons.trending_up | TrendingUp |
| Trend Down | trending-down | Icons.trending_down | TrendingDown |
| Alert | bell-ring | Icons.notifications_active | BellRing |
| Info | info | Icons.info_outline | Info |

---

## Responsive Breakpoints

```
Mobile:   < 600px  (single column, bottom nav)
Tablet:   600-1024px (two columns, side nav rail)
Desktop:  > 1024px (three columns, expanded side nav)
```

---

## Accessibility

- **WCAG 2.1 AA Compliance**: Minimum 4.5:1 contrast ratio
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML, ARIA labels
- **Focus Indicators**: 2px solid #2774AE outline

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #2774AE;
  --color-primary-dark: #003B5C;
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-border: #E2E8F0;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius (Boxy) */
  --radius-sm: 4px;
  --radius-md: 6px;

  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(0,0,0,0.05);
  --shadow-card: 0 2px 4px rgba(0,0,0,0.05);
  --shadow-elevated: 0 4px 6px rgba(0,0,0,0.07);
}
```

---

## Usage Guidelines

### DO:
- Use boxy layouts with minimal rounding (4-6px)
- Maintain high contrast for readability
- Use icons from the approved icon system
- Keep design clean and clinical
- Follow 8px grid system
- Use proper semantic HTML

### DON'T:
- Use emojis anywhere in the UI
- Over-round corners (no 12px+ radius)
- Use bright, playful colors
- Add decorative elements
- Ignore accessibility guidelines
- Break the grid system
