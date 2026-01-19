import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './AddVacancyModal.module.scss'; // Assuming simple styles or reuse
import LocationSelect from '@/components/ui/LocationSelect'; // Adjust path if needed
import { useAuth } from '@/lib/contexts/AuthContext';

const AddVacancyModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
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
        if (!formData.company_id) newErrors.company_id = "Please select a company.";
        if (!formData.title) newErrors.title = "This field is required.";
        if (!formData.location) newErrors.location = "This field is required.";
        if (!formData.expires_at) newErrors.expires_at = "This field is required.";
        if (!formData.description) newErrors.description = "This field is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill required fields.");
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            if (isEdit) {
                await business.updateVacancy(initialData.id, formData);
                toast.success("Vacancy updated successfully!");
            } else {
                await business.createVacancy(formData);
                toast.success("Vacancy posted successfully!");
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
                toast.error("Please check the form for errors.");
            } else {
                toast.error("Failed to save vacancy.");
            }
        } finally {
            setLoading(false);
        }
    };

    // If not edit mode and no companies found (after initial loading)
    if (isOpen && !isEdit && companies.length === 0) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Post a Vacancy">
                <div className={styles.container} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <h3 style={{ marginBottom: '16px' }}>No Companies Found</h3>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        You need to register a company before you can post a vacancy.
                        Please create a company profile first.
                    </p>
                    <Button onClick={() => { onClose(); window.location.href = '/companies'; }}>
                        Go to Companies
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Vacancy" : "Post a Vacancy"}>
            <div className={styles.container}>
                {/* Section 1: Basic Info */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Company & Role</h4>
                    <div className={styles.field}>
                        <label>Company <span style={{ color: 'red' }}>*</span></label>
                        <select
                            value={formData.company_id}
                            onChange={e => handleChange('company_id', e.target.value)}
                            className={styles.select}
                            style={{ borderColor: errors.company_id ? 'red' : '#ddd' }}
                        >
                            {companies.length === 0 && <option value="">No companies found</option>}
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.company_id && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.company_id}</span>}
                    </div>

                    <Input
                        label={<>Title <span style={{ color: 'red' }}>*</span></>}
                        value={formData.title}
                        onChange={e => handleChange('title', e.target.value)}
                        placeholder="e.g. Senior Frontend Developer"
                        error={errors.title}
                    />

                    <Input
                        label="Salary Range"
                        value={formData.salary_range}
                        onChange={e => handleChange('salary_range', e.target.value)}
                        placeholder="e.g. 1000-1500 AZN"
                        error={errors.salary_range}
                    />
                </div>

                <hr className={styles.divider} />

                {/* Section 2: Details */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Job Details</h4>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Listing Type</label>
                            <select className={styles.select} value={formData.listing_type} onChange={e => handleChange('listing_type', e.target.value)}>
                                <option value="job">Job</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Job Type</label>
                            <select className={styles.select} value={formData.job_type} onChange={e => handleChange('job_type', e.target.value)}>
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Work Mode</label>
                            <select className={styles.select} value={formData.work_mode} onChange={e => handleChange('work_mode', e.target.value)}>
                                <option value="office">Office</option>
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Location <span style={{ color: 'red' }}>*</span></label>
                            <div style={{ border: errors.location ? '1px solid red' : 'none', borderRadius: '8px' }}>
                                <LocationSelect
                                    value={formData.location}
                                    onChange={val => handleChange('location', val)}
                                    placeholder="Select City (e.g. Baku)"
                                />
                            </div>
                            {errors.location && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.location}</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Expiry Date <span style={{ color: 'red' }}>*</span></label>
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
                    <h4 className={styles.sectionTitle}>Description <span style={{ color: 'red' }}>*</span></h4>
                    <div className={styles.field}>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            style={{ borderColor: errors.description ? 'red' : '#ddd' }}
                        />
                        {errors.description && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? 'Posting...' : 'Post Vacancy'}
                </Button>
            </div>
        </Modal>
    );
};

export default AddVacancyModal;
