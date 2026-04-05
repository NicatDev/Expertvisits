import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './AddVacancyModal.module.scss';
import LocationSelect from '@/components/ui/LocationSelect';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';
import {
    coerceLocationToValidDisplayName,
    isValidLocationDisplayName,
} from '@/lib/locationCatalog';

const emptyEmployer = () => ({
    employer_display_name: '',
    employer_email: '',
    employer_phone: '',
    employer_website: '',
});

const AddVacancyModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [postedAs, setPostedAs] = useState('company');
    const [employer, setEmployer] = useState(emptyEmployer());
    const [employerLogo, setEmployerLogo] = useState(null);
    const [employerLogoPreview, setEmployerLogoPreview] = useState(null);

    const [formData, setFormData] = useState({
        company_id: '',
        title: '',
        sub_category: '',
        listing_type: 'job',
        job_type: 'full-time',
        work_mode: 'office',
        location: '',
        salary_range: '',
        description: '',
        expires_at: '',
    });

    const isEdit = !!initialData;

    useEffect(() => {
        if (isOpen) {
            initForm();
        }
    }, [isOpen, initialData, user?.id]);

    const initForm = async () => {
        const myCompanies = await fetchCompanies();

        if (initialData) {
            const pa = initialData.posted_as || (initialData.company ? 'company' : 'individual');
            setPostedAs(pa);
            setFormData({
                company_id: initialData.company?.id || '',
                title: initialData.title,
                sub_category: initialData.sub_category?.id || '',
                listing_type: initialData.listing_type,
                job_type: initialData.job_type,
                work_mode: initialData.work_mode,
                location: coerceLocationToValidDisplayName(initialData.location || '') || '',
                salary_range: initialData.salary_range || '',
                description: initialData.description || '',
                expires_at: initialData.expires_at,
            });
            setEmployer({
                employer_display_name: initialData.employer_display_name || '',
                employer_email: initialData.employer_email || '',
                employer_phone: initialData.employer_phone || '',
                employer_website: initialData.employer_website || '',
            });
            setEmployerLogo(null);
            const pl = initialData.publisher?.logo || initialData.employer_logo;
            setEmployerLogoPreview(pl || null);
        } else {
            const defaultAs = myCompanies && myCompanies.length > 0 ? 'company' : 'individual';
            setPostedAs(defaultAs);
            setFormData({
                company_id: myCompanies && myCompanies.length > 0 ? String(myCompanies[0].id) : '',
                title: '',
                sub_category: '',
                listing_type: 'job',
                job_type: 'full-time',
                work_mode: 'office',
                location: '',
                salary_range: '',
                description: '',
                expires_at: '',
            });
            setEmployer(emptyEmployer());
            setEmployerLogo(null);
            setEmployerLogoPreview(null);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await business.getCompanies();
            const myCompanies = (res.data.results || res.data).filter(
                (c) => c.owner_id === user?.id || c.owner === user?.username
            );
            setCompanies(myCompanies);
            return myCompanies;
        } catch (err) {
            console.error('Failed to load companies', err);
            return [];
        }
    };

    const [errors, setErrors] = useState({});

    const handleChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleEmployerChange = (name, value) => {
        setEmployer((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleEmployerLogo = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setEmployerLogo(file);
            setEmployerLogoPreview(URL.createObjectURL(file));
        }
    };

    const appendVacancyFields = (fd) => {
        fd.append('posted_as', postedAs);
        fd.append('title', formData.title);
        fd.append('listing_type', formData.listing_type);
        fd.append('job_type', formData.job_type);
        fd.append('work_mode', formData.work_mode);
        fd.append('location', formData.location);
        fd.append('expires_at', formData.expires_at);
        fd.append('description', formData.description);
        if (formData.salary_range) fd.append('salary_range', formData.salary_range);
        if (formData.sub_category) fd.append('sub_category', formData.sub_category);
        if (postedAs === 'company' && formData.company_id) {
            fd.append('company_id', formData.company_id);
        }
        if (postedAs === 'individual') {
            fd.append('employer_display_name', employer.employer_display_name.trim());
            fd.append('employer_email', employer.employer_email.trim());
            fd.append('employer_phone', employer.employer_phone.trim());
            if (employer.employer_website.trim()) {
                fd.append('employer_website', employer.employer_website.trim());
            }
            if (employerLogo) fd.append('employer_logo', employerLogo);
        }
    };

    const buildJsonPayload = () => {
        const payload = {
            posted_as: postedAs,
            title: formData.title,
            listing_type: formData.listing_type,
            job_type: formData.job_type,
            work_mode: formData.work_mode,
            location: formData.location,
            expires_at: formData.expires_at,
            description: formData.description,
        };
        if (formData.salary_range) payload.salary_range = formData.salary_range;
        if (formData.sub_category) payload.sub_category = formData.sub_category;
        if (postedAs === 'company' && formData.company_id) {
            payload.company_id = formData.company_id;
        }
        if (postedAs === 'individual') {
            payload.employer_display_name = employer.employer_display_name.trim();
            payload.employer_email = employer.employer_email.trim();
            payload.employer_phone = employer.employer_phone.trim();
            if (employer.employer_website.trim()) payload.employer_website = employer.employer_website.trim();
        }
        return payload;
    };

    const handleSubmit = async () => {
        const newErrors = {};

        if (postedAs === 'company') {
            if (!formData.company_id) {
                newErrors.company_id = t('vacancies.add_modal.errors.select_company');
            }
        } else {
            if (!employer.employer_display_name.trim()) {
                newErrors.employer_display_name = t('vacancies.add_modal.errors.required');
            }
            if (!employer.employer_email.trim()) {
                newErrors.employer_email = t('vacancies.add_modal.errors.required');
            }
            if (!employer.employer_phone.trim()) {
                newErrors.employer_phone = t('vacancies.add_modal.errors.required');
            }
        }

        if (!formData.title) newErrors.title = t('vacancies.add_modal.errors.required');
        if (!formData.location) {
            newErrors.location = t('vacancies.add_modal.errors.required');
        } else if (!isValidLocationDisplayName(formData.location)) {
            newErrors.location = t('vacancies.add_modal.errors.select_location_from_list');
        }
        if (!formData.expires_at) newErrors.expires_at = t('vacancies.add_modal.errors.required');
        if (!formData.description) newErrors.description = t('vacancies.add_modal.errors.required');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(t('vacancies.add_modal.errors.fill_required'));
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            if (isEdit) {
                const useMultipart = postedAs === 'individual' && employerLogo;
                if (useMultipart) {
                    const fd = new FormData();
                    appendVacancyFields(fd);
                    await business.updateVacancy(initialData.id, fd);
                } else {
                    await business.updateVacancy(initialData.id, buildJsonPayload());
                }
                toast.success(t('vacancies.add_modal.success.updated'));
            } else {
                const fd = new FormData();
                appendVacancyFields(fd);
                await business.createVacancy(fd);
                toast.success(t('vacancies.add_modal.success.posted'));
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const data = err.response.data;
                const backendErrors = {};
                Object.keys(data).forEach((key) => {
                    backendErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
                });
                setErrors(backendErrors);
                toast.error(t('vacancies.add_modal.errors.check_form'));
            } else {
                toast.error(t('vacancies.add_modal.errors.save_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const noCompanies = companies.length === 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('vacancies.add_modal.title_edit') : t('vacancies.add_modal.title_add')}>
            <div className={styles.container}>
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.posting_as')}</h4>
                    <div className={styles.postingMode} role="radiogroup" aria-label={t('vacancies.add_modal.posting_as')}>
                        <label className={`${styles.radioOption} ${postedAs === 'company' ? styles.radioActive : ''}`}>
                            <input
                                type="radio"
                                name="posted_as"
                                value="company"
                                checked={postedAs === 'company'}
                                onChange={() => setPostedAs('company')}
                                disabled={noCompanies}
                            />
                            <span>{t('vacancies.add_modal.as_company')}</span>
                        </label>
                        <label className={`${styles.radioOption} ${postedAs === 'individual' ? styles.radioActive : ''}`}>
                            <input
                                type="radio"
                                name="posted_as"
                                value="individual"
                                checked={postedAs === 'individual'}
                                onChange={() => setPostedAs('individual')}
                            />
                            <span>{t('vacancies.add_modal.as_individual')}</span>
                        </label>
                    </div>
                    {noCompanies && postedAs === 'company' && (
                        <p className={styles.hintWarn}>{t('vacancies.add_modal.no_company_pick_individual')}</p>
                    )}
                    {postedAs === 'company' && !noCompanies && (
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.company')} *</label>
                            <select
                                value={formData.company_id}
                                onChange={(e) => handleChange('company_id', e.target.value)}
                                className={styles.select}
                                style={{ borderColor: errors.company_id ? 'red' : '#e0e0e0' }}
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.company_id && <span className={styles.fieldError}>{errors.company_id}</span>}
                        </div>
                    )}

                    {postedAs === 'individual' && (
                        <div className={styles.individualBlock}>
                            <Input
                                label={
                                    <>
                                        {t('vacancies.add_modal.business_name')} <span className={styles.req}>*</span>
                                    </>
                                }
                                value={employer.employer_display_name}
                                onChange={(e) => handleEmployerChange('employer_display_name', e.target.value)}
                                placeholder={t('vacancies.add_modal.business_name_ph')}
                                error={errors.employer_display_name}
                            />
                            <div className={styles.row}>
                                <Input
                                    label={
                                        <>
                                            {t('vacancies.add_modal.contact_email')} <span className={styles.req}>*</span>
                                        </>
                                    }
                                    type="email"
                                    value={employer.employer_email}
                                    onChange={(e) => handleEmployerChange('employer_email', e.target.value)}
                                    placeholder="email@example.com"
                                    error={errors.employer_email}
                                />
                                <Input
                                    label={
                                        <>
                                            {t('vacancies.add_modal.contact_phone')} <span className={styles.req}>*</span>
                                        </>
                                    }
                                    value={employer.employer_phone}
                                    onChange={(e) => handleEmployerChange('employer_phone', e.target.value)}
                                    placeholder="+994..."
                                    error={errors.employer_phone}
                                />
                            </div>
                            <Input
                                label={t('vacancies.add_modal.contact_website')}
                                value={employer.employer_website}
                                onChange={(e) => handleEmployerChange('employer_website', e.target.value)}
                                placeholder="https://"
                                error={errors.employer_website}
                            />
                            <div className={styles.field}>
                                <label>{t('vacancies.add_modal.employer_logo')}</label>
                                <div className={styles.logoRow}>
                                    {employerLogoPreview ? (
                                        <img src={employerLogoPreview} alt="" className={styles.logoPreview} />
                                    ) : (
                                        <div className={styles.logoPlaceholder}>—</div>
                                    )}
                                    <label className={styles.fileBtn}>
                                        <input type="file" accept="image/*" onChange={handleEmployerLogo} />
                                        {t('vacancies.add_modal.upload_logo')}
                                    </label>
                                </div>
                                {errors.employer_logo && <span className={styles.fieldError}>{errors.employer_logo}</span>}
                                <p className={styles.logoHint}>{t('vacancies.add_modal.employer_logo_hint')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.vacancy_info')}</h4>
                    <Input
                        label={
                            <>
                                {t('vacancies.add_modal.title_label')} <span className={styles.req}>*</span>
                            </>
                        }
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g. Senior Frontend Developer"
                        error={errors.title}
                    />
                    <Input
                        label={t('vacancies.add_modal.salary_range')}
                        value={formData.salary_range}
                        onChange={(e) => handleChange('salary_range', e.target.value)}
                        placeholder="e.g. 1000-1500 AZN"
                        error={errors.salary_range}
                    />
                </div>

                <hr className={styles.divider} />

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.job_details')}</h4>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.listing_type')}</label>
                            <select
                                className={styles.select}
                                value={formData.listing_type}
                                onChange={(e) => handleChange('listing_type', e.target.value)}
                            >
                                <option value="job">Job</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.job_type')}</label>
                            <select
                                className={styles.select}
                                value={formData.job_type}
                                onChange={(e) => handleChange('job_type', e.target.value)}
                            >
                                <option value="full-time">{t('vacancies.full_time')}</option>
                                <option value="part-time">{t('vacancies.part_time')}</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.work_mode')}</label>
                            <select
                                className={styles.select}
                                value={formData.work_mode}
                                onChange={(e) => handleChange('work_mode', e.target.value)}
                            >
                                <option value="office">{t('vacancies.office')}</option>
                                <option value="remote">{t('vacancies.remote')}</option>
                                <option value="hybrid">{t('vacancies.hybrid')}</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>
                                {t('vacancies.add_modal.location')} <span className={styles.req}>*</span>
                            </label>
                            <div style={{ border: errors.location ? '1px solid red' : 'none', borderRadius: '8px' }}>
                                <LocationSelect
                                    value={formData.location}
                                    onChange={(val) => handleChange('location', val)}
                                    placeholder={t('auth_page.select_city')}
                                    strict
                                />
                            </div>
                            {errors.location && <span className={styles.fieldError}>{errors.location}</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>
                            {t('vacancies.add_modal.expiry_date')} <span className={styles.req}>*</span>
                        </label>
                        <input
                            type="date"
                            className={styles.input}
                            value={formData.expires_at}
                            onChange={(e) => handleChange('expires_at', e.target.value)}
                            onClick={(e) => e.target.showPicker?.()}
                            style={{ cursor: 'pointer', borderColor: errors.expires_at ? 'red' : '#e0e0e0' }}
                        />
                        {errors.expires_at && <span className={styles.fieldError}>{errors.expires_at}</span>}
                    </div>
                </div>

                <hr className={styles.divider} />

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>
                        {t('vacancies.add_modal.description')} <span className={styles.req}>*</span>
                    </h4>
                    <div className={styles.field}>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder={t('vacancies.add_modal.description_placeholder')}
                            style={{ borderColor: errors.description ? 'red' : '#e0e0e0' }}
                        />
                        {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
                    {loading
                        ? t('vacancies.add_modal.submitting')
                        : isEdit
                          ? t('vacancies.add_modal.update')
                          : t('vacancies.add_modal.submit')}
                </Button>
            </div>
        </Modal>
    );
};

export default AddVacancyModal;
