import json
import os
from collections import Counter

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.utils import DatabaseError, OperationalError, ProgrammingError

from apps.accounts.models import Category, SubCategory


def _ext(obj, key_primary="externalId", key_alt="external_id"):
    v = obj.get(key_primary) or obj.get(key_alt)
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _str(v):
    if v is None:
        return ""
    return str(v).strip()


def _ensure_json_external_ids(data, issues):
    """Fill missing externalId values in-memory; detect duplicates."""
    seen_cat, seen_sub = set(), set()
    for cat_index, item in enumerate(data, start=1):
        cid = _ext(item)
        if not cid:
            cid = f"CAT-{cat_index:03d}"
            item["externalId"] = cid
        if cid in seen_cat:
            issues.append(f"JSON: təkrarlanan kateqoriya externalId: {cid}")
        seen_cat.add(cid)
        subs = item.get("subcategories") or []
        for sub_index, sub in enumerate(subs, start=1):
            sid = _ext(sub)
            if not sid:
                sid = f"SUB-{cat_index:03d}-{sub_index:03d}"
                sub["externalId"] = sid
            if sid in seen_sub:
                issues.append(f"JSON: təkrarlanan alt-kateqoriya externalId: {sid}")
            seen_sub.add(sid)


def _collect_db_duplicate_external_ids(issues):
    try:
        for model, label in ((Category, "Category"), (SubCategory, "SubCategory")):
            rows = (
                model.objects.exclude(external_id__isnull=True)
                .exclude(external_id="")
                .values_list("external_id", flat=True)
            )
            counts = Counter(rows)
            for eid, n in counts.items():
                if n > 1:
                    issues.append(
                        f"DB: {label} cədvəlində external_id={eid!r} {n} sətir var (unique pozulub)."
                    )
    except (OperationalError, ProgrammingError, DatabaseError) as e:
        issues.append(
            f"DB yoxlaması keçilmədi (migrasiya və ya bağlantı): {e.__class__.__name__}: {e}"
        )


class Command(BaseCommand):
    help = (
        "categories.json-u oxuyur: external_id ilə DB-də uyğun sətirləri tapır, "
        "dəyişən sahələri yeniləyir, yoxdursa əlavə edir. PK və FK sabit qalır."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            type=str,
            default=None,
            help="JSON fayl yolu (default: BASE_DIR/categories.json)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Heç bir yazma əməliyyatı etmir, yalnız hesabat çıxarır.",
        )
        parser.add_argument(
            "--write-json",
            action="store_true",
            help="JSON-da boş externalId-ləri doldurub faylı yenidən yazır (dry-run ilə istifadə olunmur).",
        )

    def handle(self, *args, **options):
        path = options["path"] or os.path.join(settings.BASE_DIR, "categories.json")
        dry_run = options["dry_run"]
        write_json = options["write_json"]

        if not os.path.exists(path):
            self.stderr.write(self.style.ERROR(f"Fayl tapılmadı: {path}"))
            return

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        issues = []
        _ensure_json_external_ids(data, issues)
        _collect_db_duplicate_external_ids(issues)

        if write_json and dry_run:
            self.stdout.write(
                self.style.WARNING("--write-json --dry-run ilə birlikdə işlədilmir; fayl yazılmadı.")
            )
        elif write_json:
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            os.replace(tmp, path)
            self.stdout.write(self.style.SUCCESS(f"JSON yeniləndi (externalId-lər): {path}"))

        stats = {
            "categories_created": 0,
            "categories_updated": 0,
            "subcategories_created": 0,
            "subcategories_updated": 0,
            "sub_moved_parent": 0,
        }

        def sync():
            for item in data:
                cat_ext = _ext(item)
                c_az, c_en, c_ru = _str(item.get("name_az")), _str(item.get("name_en")), _str(
                    item.get("name_ru")
                )
                if not c_az or not c_en or not c_ru:
                    issues.append(f"Kateqoriya {cat_ext}: name_az/en/ru boş ola bilməz.")
                    continue

                category = Category.objects.filter(external_id=cat_ext).first()
                if not category:
                    category = (
                        Category.objects.filter(external_id__isnull=True, name_az=c_az).first()
                        or Category.objects.filter(external_id="", name_az=c_az).first()
                        or Category.objects.filter(external_id__isnull=True, name_en=c_en).first()
                        or Category.objects.filter(external_id="", name_en=c_en).first()
                    )
                if not category:
                    category = Category(name_az=c_az, name_en=c_en, name_ru=c_ru, external_id=cat_ext)
                    if not dry_run:
                        category.save()
                    stats["categories_created"] += 1
                    self.stdout.write(self.style.SUCCESS(f"+ Kateqoriya yaradıldı: {cat_ext} ({c_az})"))
                else:
                    changed = []
                    for field, new_val in (
                        ("name_az", c_az),
                        ("name_en", c_en),
                        ("name_ru", c_ru),
                        ("external_id", cat_ext),
                    ):
                        old = getattr(category, field)
                        if _str(old) != new_val:
                            changed.append(f"{field}: {old!r} -> {new_val!r}")
                            setattr(category, field, new_val)
                    if changed:
                        if not dry_run:
                            category.save()
                        stats["categories_updated"] += 1
                        self.stdout.write(f"* Kateqoriya yeniləndi {cat_ext}: " + "; ".join(changed))
                    elif self.verbosity >= 2:
                        self.stdout.write(f"  = Kateqoriya dəyişmədi: {cat_ext}")

                subs = item.get("subcategories") or []
                for sub in subs:
                    sub_ext = _ext(sub)
                    s_az = _str(sub.get("name_az"))
                    s_en = _str(sub.get("name_en"))
                    s_ru = _str(sub.get("name_ru"))
                    p_az = _str(sub.get("profession_az"))
                    p_en = _str(sub.get("profession_en"))
                    p_ru = _str(sub.get("profession_ru"))

                    if not s_az or not s_en or not s_ru:
                        issues.append(f"Alt-kateqoriya {sub_ext}: name_az/en/ru boş ola bilməz.")
                        continue

                    sub_obj = SubCategory.objects.filter(external_id=sub_ext).first()
                    if not sub_obj:
                        sub_obj = (
                            SubCategory.objects.filter(
                                category=category, external_id__isnull=True, name_az=s_az
                            ).first()
                            or SubCategory.objects.filter(
                                category=category, external_id="", name_az=s_az
                            ).first()
                            or SubCategory.objects.filter(
                                category=category, external_id__isnull=True, name_en=s_en
                            ).first()
                            or SubCategory.objects.filter(
                                category=category, external_id="", name_en=s_en
                            ).first()
                        )
                    if not sub_obj:
                        sub_obj = SubCategory(
                            category=category,
                            name_az=s_az,
                            name_en=s_en,
                            name_ru=s_ru,
                            profession_az=p_az or None,
                            profession_en=p_en or None,
                            profession_ru=p_ru or None,
                            external_id=sub_ext,
                        )
                        if not dry_run:
                            sub_obj.save()
                        stats["subcategories_created"] += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"  + Alt-kateqoriya: {sub_ext} ({s_az})")
                        )
                    else:
                        changed = []
                        if sub_obj.category_id != category.id:
                            changed.append(
                                f"category_id: {sub_obj.category_id} -> {category.id} (valideyn dəyişdi)"
                            )
                            stats["sub_moved_parent"] += 1
                            sub_obj.category = category
                        for field, new_val in (
                            ("name_az", s_az),
                            ("name_en", s_en),
                            ("name_ru", s_ru),
                            ("profession_az", p_az or None),
                            ("profession_en", p_en or None),
                            ("profession_ru", p_ru or None),
                            ("external_id", sub_ext),
                        ):
                            old = getattr(sub_obj, field)
                            o = "" if old is None else str(old).strip()
                            n = "" if new_val is None else str(new_val).strip()
                            if o != n:
                                changed.append(f"{field}: {old!r} -> {new_val!r}")
                                setattr(sub_obj, field, new_val)
                        if changed:
                            if not dry_run:
                                sub_obj.save()
                            stats["subcategories_updated"] += 1
                            self.stdout.write(f"  * Alt-kateqoriya {sub_ext}: " + "; ".join(changed))
                        elif self.verbosity >= 2:
                            self.stdout.write(f"  = Alt-kateqoriya dəyişmədi: {sub_ext}")

        try:
            if dry_run:
                sync()
            else:
                with transaction.atomic():
                    sync()
        except (OperationalError, ProgrammingError, DatabaseError) as e:
            self.stderr.write(
                self.style.ERROR(
                    f"Verilənlər bazası xətası (migrasiya tətbiq edilib? accounts_category.external_id "
                    f"və accounts_subcategory.external_id sütunları var?): {e}"
                )
            )
            raise
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Xəta: {e}"))
            raise

        if issues:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Problemlər / yoxlamalar:"))
            for msg in issues:
                self.stdout.write(f"  - {msg}")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Xülasə:"))
        for k, v in stats.items():
            self.stdout.write(f"  {k}: {v}")
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: verilənlər bazasına yazılmadı."))
