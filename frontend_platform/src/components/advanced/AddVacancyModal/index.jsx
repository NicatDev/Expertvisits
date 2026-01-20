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

const AddVacancyModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        company_id: '',
        title: '',
        sub_category: '',
        listing_type: 'job',
        job_type: 'full-time',
        work_mode: 'office',
        location: 'Baku',
        salary_range: '',
        description: '', // Added description field
        expires_at: ''
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
            setFormData({
                company_id: initialData.company.id,
                title: initialData.title,
                sub_category: initialData.sub_category?.id || '',
                listing_type: initialData.listing_type,
                job_type: initialData.job_type,
                work_mode: initialData.work_mode,
                location: initialData.location,
                salary_range: initialData.salary_range || '',
                description: initialData.description || '',
                expires_at: initialData.expires_at
            });
        } else {
            setFormData({
                company_id: myCompanies && myCompanies.length > 0 ? myCompanies[0].id : '',
                title: '',
                sub_category: '',
                listing_type: 'job',
                job_type: 'full-time',
                work_mode: 'office',
                location: 'Baku',
                salary_range: '',
                description: '',
                expires_at: ''
            });
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await business.getCompanies();
            // Filter companies owned by the current user
            const myCompanies = (res.data.results || res.data).filter(c =>
                c.owner_id === user?.id || c.owner === user?.username
            );

            setCompanies(myCompanies);
            return myCompanies;
        } catch (err) {
            console.error("Failed to load companies", err);
            return [];
        }
    };

    const [errors, setErrors] = useState({});

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async () => {
        const newErrors = {};
        if (!formData.company_id) newErrors.company_id = t('vacancies.add_modal.errors.select_company');
        if (!formData.title) newErrors.title = t('vacancies.add_modal.errors.required');
        if (!formData.location) newErrors.location = t('vacancies.add_modal.errors.required');
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
                await business.updateVacancy(initialData.id, formData);
                toast.success(t('vacancies.add_modal.success.updated'));
            } else {
                await business.createVacancy(formData);
                toast.success(t('vacancies.add_modal.success.posted'));
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const data = err.response.data;
                const backendErrors = {};
                Object.keys(data).forEach(key => {
                    // DRF returns arrays of strings
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

    // If not edit mode and no companies found (after initial loading)
    if (isOpen && !isEdit && companies.length === 0) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={t('vacancies.add_modal.title_add')}>
                <div className={styles.container} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <h3 style={{ marginBottom: '16px' }}>{t('vacancies.add_modal.no_companies_title')}</h3>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        {t('vacancies.add_modal.no_companies_desc')}
                    </p>
                    <Button onClick={() => { onClose(); window.location.href = '/companies'; }}>
                        {t('vacancies.add_modal.go_to_companies')}
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('vacancies.add_modal.title_edit') : t('vacancies.add_modal.title_add')}>
            <div className={styles.container}>
                {/* Section 1: Basic Info */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.company_role')}</h4>
                    <div className={styles.field}>
                        <label>{t('vacancies.add_modal.company')} <span style={{ color: 'red' }}>*</span></label>
                        <select
                            value={formData.company_id}
                            onChange={e => handleChange('company_id', e.target.value)}
                            className={styles.select}
                            style={{ borderColor: errors.company_id ? 'red' : '#ddd' }}
                        >
                            {companies.length === 0 && <option value="">{t('companies.empty.title')}</option>}
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.company_id && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.company_id}</span>}
                    </div>

                    <Input
                        label={<>{t('vacancies.add_modal.title_label')} <span style={{ color: 'red' }}>*</span></>}
                        value={formData.title}
                        onChange={e => handleChange('title', e.target.value)}
                        placeholder="e.g. Senior Frontend Developer"
                        error={errors.title}
                    />

                    <Input
                        label={t('vacancies.add_modal.salary_range')}
                        value={formData.salary_range}
                        onChange={e => handleChange('salary_range', e.target.value)}
                        placeholder="e.g. 1000-1500 AZN"
                        error={errors.salary_range}
                    />
                </div>

                <hr className={styles.divider} />

                {/* Section 2: Details */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.job_details')}</h4>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.listing_type')}</label>
                            <select className={styles.select} value={formData.listing_type} onChange={e => handleChange('listing_type', e.target.value)}>
                                <option value="job">Job</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.job_type')}</label>
                            <select className={styles.select} value={formData.job_type} onChange={e => handleChange('job_type', e.target.value)}>
                                <option value="full-time">{t('vacancies.full_time')}</option>
                                <option value="part-time">{t('vacancies.part_time')}</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.work_mode')}</label>
                            <select className={styles.select} value={formData.work_mode} onChange={e => handleChange('work_mode', e.target.value)}>
                                <option value="office">{t('vacancies.office')}</option>
                                <option value="remote">{t('vacancies.remote')}</option>
                                <option value="hybrid">{t('vacancies.hybrid')}</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>{t('vacancies.add_modal.location')} <span style={{ color: 'red' }}>*</span></label>
                            <div style={{ border: errors.location ? '1px solid red' : 'none', borderRadius: '8px' }}>
                                <LocationSelect
                                    value={formData.location}
                                    onChange={val => handleChange('location', val)}
                                    placeholder={t('auth_page.select_city')}
                                />
                            </div>
                            {errors.location && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.location}</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>{t('vacancies.add_modal.expiry_date')} <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="date"
                            className={styles.input}
                            value={formData.expires_at}
                            onChange={e => handleChange('expires_at', e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            style={{ cursor: 'pointer', borderColor: errors.expires_at ? 'red' : '#ddd' }}
                        />
                        {errors.expires_at && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.expires_at}</span>}
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* Section 3: Description */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>{t('vacancies.add_modal.description')} <span style={{ color: 'red' }}>*</span></h4>
                    <div className={styles.field}>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder={t('vacancies.add_modal.description_placeholder')}
                            style={{ borderColor: errors.description ? 'red' : '#ddd' }}
                        />
                        {errors.description && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? t('vacancies.add_modal.submitting') : (isEdit ? t('vacancies.add_modal.update') : t('vacancies.add_modal.submit'))}
                </Button>
            </div>
        </Modal>
    );
};

export default AddVacancyModal;
