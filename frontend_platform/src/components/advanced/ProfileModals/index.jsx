import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import hardSkills from '@/data/hard_skills.json';
import softSkills from '@/data/soft_skills.json';

// Reusable Form Modal Wrapper
const FormModal = ({ isOpen, onClose, title, onSubmit, loading, children, bodyStyle }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} bodyStyle={bodyStyle}>
            <form onSubmit={onSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {children}
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button type="default" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
                </div>
            </form>
        </Modal>
    );
};

export const ExperienceModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [formData, setFormData] = useState({ position: '', company_name: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ position: '', company_name: '', start_date: '', end_date: '' });
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Experience" : "Add Experience"} onSubmit={handleSubmit} loading={loading}>
            <Input label="Position" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} required />
            <Input label="Company Name" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} required />
            <div style={{ display: 'flex', gap: '16px' }}>
                <Input type="date" label="Start Date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                <Input type="date" label="End Date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
        </FormModal>
    );
};

export const EducationModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [formData, setFormData] = useState({ degree_type: 'bachelor', institution: '', field_of_study: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ degree_type: 'bachelor', institution: '', field_of_study: '', start_date: '', end_date: '' });
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Education" : "Add Education"} onSubmit={handleSubmit} loading={loading}>
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>Degree Type</label>
                <select
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                    value={formData.degree_type}
                    onChange={e => setFormData({ ...formData, degree_type: e.target.value })}
                >
                    <option value="bachelor">Bakalavr</option>
                    <option value="master">Magistr</option>
                    <option value="doctorate">Doktorantura</option>
                    <option value="certification">Təhsil Artırma/Sertifikat</option>
                </select>
            </div>
            <Input label="Institution" value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} required />
            <Input label="Field of Study" value={formData.field_of_study} onChange={e => setFormData({ ...formData, field_of_study: e.target.value })} required />
            <div style={{ display: 'flex', gap: '16px' }}>
                <Input type="date" label="Start Date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                <Input type="date" label="End Date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
        </FormModal>
    );
};

export const SkillModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [formData, setFormData] = useState({ name: '', skill_type: 'hard' });
    const [loading, setLoading] = useState(false);

    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                skill_type: initialData.skill_type || 'hard',
                id: initialData.id
            });
        } else {
            setFormData({ name: '', skill_type: 'hard' });
        }
        setSuggestions([]);
    }, [initialData, isOpen]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, name: val }));

        if (val.length > 0) {
            const source = (formData.skill_type === 'soft') ? softSkills : hardSkills;
            const filtered = source.filter(s => s.name_en.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = (val) => {
        setFormData(prev => ({ ...prev, name: val }));
        setSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    const showTypeSelect = !initialData?.skill_type || (initialData.id && !initialData.skill_type_fixed);

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Edit Skill" : "Add Skill"} onSubmit={handleSubmit} loading={loading} bodyStyle={{ overflow: 'visible' }}>
            <div style={{ position: 'relative' }}>
                <Input
                    label="Skill Name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    autoComplete="off"
                />
                {suggestions.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '0 0 6px 6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '0px'
                    }}>
                        {suggestions.map(s => (
                            <div
                                key={s.code}
                                onClick={() => selectSuggestion(s.name_en)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                            >
                                {s.name_en}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!initialData?.skill_type && (
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>Type</label>
                    <select
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                        value={formData.skill_type}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, skill_type: e.target.value, name: '' })); // Reset name on type change to reset suggestions context
                            setSuggestions([]);
                        }}
                    >
                        <option value="hard">Hard Skill</option>
                        <option value="soft">Soft Skill</option>
                    </select>
                </div>
            )}
        </FormModal>
    );
};

export const LanguageModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [formData, setFormData] = useState({ name: '', level: 'a1' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ name: '', level: 'a1' });
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Language" : "Add Language"} onSubmit={handleSubmit} loading={loading}>
            <Input label="Language" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>Level</label>
                <select
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                    {['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].map(l => (
                        <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                </select>
            </div>
        </FormModal>
    );
};

export const CertificateModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [formData, setFormData] = useState({ name: '', issuing_organization: '', issue_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ name: '', issuing_organization: '', issue_date: '' });
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Certificate" : "Add Certificate"} onSubmit={handleSubmit} loading={loading}>
            <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Issuing Org." value={formData.issuing_organization} onChange={e => setFormData({ ...formData, issuing_organization: e.target.value })} required />
            <Input type="date" label="Date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} required />
        </FormModal>
    );
};

export const PasswordModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            setError("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Change Password" onSubmit={handleSubmit} loading={loading}>
            <Input type="password" label="New Password" value={formData.new_password} onChange={e => setFormData({ ...formData, new_password: e.target.value })} required />
            <Input type="password" label="Confirm Password" value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} required error={error} />
        </FormModal>
    );
};
