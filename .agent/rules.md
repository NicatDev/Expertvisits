# BusinessVisit Project Architecture & Coding Rules

## 1. FRONTEND COMPONENT STRUCTURE (Next.js)
AI must strictly follow this folder hierarchy for React components to ensure maintainability:
- **`components/ui/`**: Atomic, reusable, and stateless components. 
  - *Examples:* `Button.jsx`, `Input.jsx`, `Select.jsx`, `Checkbox.jsx`, `Badge.jsx`.
- **`components/advanced/`**: Complex components used across multiple pages.
  - *Examples:* `Navbar.jsx`, `CommentsSection.jsx`, `BookingCalendar.jsx`, `Sidebar.jsx`, `Footer.jsx`.
- **`app/[page_name]/components/`**: Page-specific components used ONLY in that directory.
  - *Examples:* `JobFilters.jsx` (inside `app/vacancies/components/`).
  - *Rule:* Never place page-specific components in the global UI or Advanced folders.
  **`component structure`**: Every component must have it's folder and index name and it's style.module.scss file for styling. Every component must have it's own folder and index.js file and style.module.scss file.
## 2. BACKEND API ARCHITECTURE (Django Rest Framework)
To prevent "fat" files and ensure scalability:
- **Modular APIs**: Create separate files for every distinct functionality.
- **Folder Structure**: Each app must have an `api/` folder:
  - `api/serializers.py`: Dedicated serializers for the app.
  - `api/views.py` (or `viewsets.py`): Logic separated by domain/resource.
- **Optimization**:
  - **MANDATORY**: Use `select_related` (for FK) and `prefetch_related` (for M2M/Generic) in all `get_queryset` methods.
  - Use `@action` decorators for custom endpoints within ViewSets.

## 3. DESIGN SYSTEM & RESPONSIVENESS (SCSS)
- **Backgrounds**: Global background: `#f5f5f5`. Section/Card background: `#ffffff`.
- **Responsiveness**: Every UI element must support **Mobile, Tablet, and Desktop**. 
- **Coding Style**: Mobile-first approach. Use SCSS mixins for breakpoints. No inline styles.

## 4. SEO & PERFORMANCE
- **Metadata**: Every page in the `app/` folder must include `generateMetadata` (for dynamic pages) or a `metadata` object (for static pages).
- **Required Tags**: `title`, `description`, and `OpenGraph` (og:title, og:description, og:image) for Articles, Vacancies, and Profiles.
- **Sitemap**: Split sitemaps into chunks of 20,000 items as the database scales.

## 5. LOCALIZATION & DATA LOGIC
- **i18n**: Site must support AZ, EN, RU. Static texts must be translated; user-generated data remains in its original language.
- **Slug Generation**: Custom logic for Azerbaijani characters: `ə`->`e`, `ç`->`c`, `ğ`->`g`, `ö`->`o`, `ş`->`s`, `ü`->`u`.
- **Validations**: Booking slots are strictly 30 minutes. Vacancy posting requires 3+ articles and a 7-day-old profile.

## 6. AI COMPLIANCE & TERMINAL RULES
- **Rule Enforcement**: If a task requires violating these rules, the AI **must** notify the user and ask for permission.
- **Terminal**: Execute commands from the "Allow List" (npm, python, git, etc.) automatically without extra confirmation to maintain speed.

