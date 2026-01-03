import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './AddVacancyModal.module.scss'; // Assuming simple styles or reuse
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
            fetchCompanies();
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
                    company_id: '',
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
        }
    }, [isOpen, initialData]);

    const fetchCompanies = async () => {
        try {
            // Fetch companies owned by the current user
            // Assuming filter needs to be implemented or we filter client side if list is small
            // For now, let's try fetch all and filter client side if 'owner' field available in serializer
            // Or rely on backend providing only my companies if endpoint designed so
            const res = await business.getCompanies();
            // NOTE: Ideally backend should have ?my=true. 
            // If the user has no companies, they can't post.
            // Let's assume the user IS the owner of the companies returned or we filter by logged in user ID if available.
            // Simplification: Just show all for now (demo), or better: 
            // Since CompanyViewSet perform_create sets owner, create a company first?
            // I'll show available companies.
            setCompanies(res.data.results || res.data);

            // Auto-select first if available
            if ((res.data.results || res.data).length > 0 && !formData.company_id) {
                setFormData(prev => ({ ...prev, company_id: (res.data.results || res.data)[0].id }));
            }
        } catch (err) {
            console.error("Failed to load companies", err);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.company_id) {
            toast.error("Please select a company.");
            return;
        }
        if (!formData.title || !formData.location || !formData.expires_at) {
            toast.error("Please fill required fields (Title, Location, Expiry).");
            return;
        }
        setLoading(true);
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
            toast.error("Failed to save vacancy.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Vacancy" : "Post a Vacancy"}>
            <div className={styles.container}>
                <div className={styles.field}>
                    <label>Company</label>
                    <select
                        value={formData.company_id}
                        onChange={e => handleChange('company_id', e.target.value)}
                        className={styles.select}
                    >
                        {companies.length === 0 && <option value="">No companies found</option>}
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <Input label="Title" value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g. Senior Frontend Developer" />

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
                    <Input label="Location" value={formData.location} onChange={e => handleChange('location', e.target.value)} placeholder="e.g. Baku, Azerbaijan" />
                </div>

                <Input label="Salary Range" value={formData.salary_range} onChange={e => handleChange('salary_range', e.target.value)} placeholder="e.g. 1000-1500 AZN" />

                <div className={styles.field}>
                    <label>Expiry Date</label>
                    <input type="date" className={styles.input} value={formData.expires_at} onChange={e => handleChange('expires_at', e.target.value)} />
                </div>

                <div className={styles.field}>
                    <label>Description</label>
                    <textarea
                        className={styles.textarea}
                        rows={4}
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        placeholder="Describe the role..."
                    />
                </div>

                <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? 'Posting...' : 'Post Vacancy'}
                </Button>
            </div>
        </Modal>
    );
};

export default AddVacancyModal;
