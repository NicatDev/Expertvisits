import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import { Plus, Trash2 } from 'lucide-react';
import { responsibilitiesToFormLines } from '@/lib/utils/experienceResponsibilities';

// Reusable Form Modal Wrapper
const FormModal = ({ isOpen, onClose, title, onSubmit, loading, children, bodyStyle }) => {
    const { t } = useTranslation('common');
    const formId = "modal-form-" + Math.random().toString(36).substr(2, 9);
    
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title} 
            bodyStyle={bodyStyle}
            footer={
                <>
                    <Button type="default" onClick={onClose} disabled={loading}>{t('profile_modals.cancel')}</Button>
                    <Button type="primary" htmlType="submit" form={formId} loading={loading}>{t('profile_modals.save')}</Button>
                </>
            }
        >
            <form id={formId} onSubmit={onSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {children}
                </div>
            </form>
        </Modal>
    );
};

export const ExperienceModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ position: '', company_name: '', start_date: '', end_date: '' });
    const [lines, setLines] = useState(['']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            const { responsibilities, ...rest } = initialData;
            setFormData({
                position: rest.position ?? '',
                company_name: rest.company_name ?? '',
                start_date: rest.start_date ?? '',
                end_date: rest.end_date ?? '',
            });
            setLines(responsibilitiesToFormLines(responsibilities));
        } else {
            setFormData({ position: '', company_name: '', start_date: '', end_date: '' });
            setLines(['']);
        }
    }, [initialData, isOpen]);

    const updateLine = (index, value) => {
        setLines((prev) => prev.map((l, i) => (i === index ? value : l)));
    };

    const addLine = () => setLines((prev) => [...prev, '']);

    const removeLine = (index) => {
        setLines((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const responsibilities = lines.map((l) => l.trim()).filter(Boolean);
        const submitData = {
            ...formData,
            end_date: formData.end_date || null,
            responsibilities,
        };
        await onSave(submitData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData?.id ? t('profile_modals.experience.edit') : t('profile_modals.experience.add')}
            onSubmit={handleSubmit}
            loading={loading}
            bodyStyle={{ maxHeight: 'min(80vh, 640px)', overflowY: 'auto' }}
        >
            <Input label={t('profile_modals.experience.position')} value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} required />
            <Input label={t('profile_modals.experience.company')} value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} required />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Input type="date" label={t('profile_modals.experience.start')} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                <Input type="date" label={t('profile_modals.experience.end')} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>

            <div style={{ marginTop: '4px' }}>
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                    {t('profile_modals.experience.responsibilities_heading')}
                </span>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#888', lineHeight: 1.45 }}>
                    {t('profile_modals.experience.responsibilities_hint')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lines.map((line, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <textarea
                                value={line}
                                onChange={(e) => updateLine(index, e.target.value)}
                                placeholder={t('profile_modals.experience.line_placeholder')}
                                rows={2}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: '10px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    minHeight: '44px',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeLine(index)}
                                disabled={lines.length <= 1}
                                aria-label={t('profile_modals.experience.remove_line')}
                                style={{
                                    flexShrink: 0,
                                    width: 40,
                                    height: 40,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    background: lines.length <= 1 ? '#f5f5f5' : '#fff',
                                    cursor: lines.length <= 1 ? 'not-allowed' : 'pointer',
                                    color: lines.length <= 1 ? '#ccc' : '#999',
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
                <Button type="default" htmlType="button" size="small" onClick={addLine} icon={<Plus size={16} />} style={{ marginTop: '12px' }}>
                    {t('profile_modals.experience.add_line')}
                </Button>
            </div>
        </FormModal>
    );
};

export const EducationModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ degree_type: 'bachelor', institution: '', field_of_study: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                degree_type: initialData.degree_type ?? 'bachelor',
                institution: initialData.institution ?? '',
                field_of_study: initialData.field_of_study ?? '',
                start_date: initialData.start_date ?? '',
                end_date: initialData.end_date ?? '',
            });
        } else {
            setFormData({
                degree_type: 'bachelor',
                institution: '',
                field_of_study: '',
                start_date: '',
                end_date: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const submitData = { ...formData, end_date: formData.end_date || null };
        await onSave(submitData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? t('profile_modals.education.edit') : t('profile_modals.education.add')} onSubmit={handleSubmit} loading={loading}>
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.education.degree')}</label>
                <select
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                    value={formData.degree_type}
                    onChange={e => setFormData({ ...formData, degree_type: e.target.value })}
                >
                    <option value="secondary">{t('profile_modals.education.secondary')}</option>
                    <option value="full_secondary">{t('profile_modals.education.full_secondary')}</option>
                    <option value="vocational">{t('profile_modals.education.vocational')}</option>
                    <option value="bachelor">{t('profile_modals.education.bachelor')}</option>
                    <option value="master">{t('profile_modals.education.master')}</option>
                    <option value="doctorate">{t('profile_modals.education.doctorate')}</option>
                    <option value="certification">{t('profile_modals.education.certification')}</option>
                </select>
            </div>
            <Input label={t('profile_modals.education.institution')} value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} required />
            <Input label={t('profile_modals.education.field')} value={formData.field_of_study} onChange={e => setFormData({ ...formData, field_of_study: e.target.value })} required />
            <div style={{ display: 'flex', gap: '16px' }}>
                <Input type="date" label={t('profile_modals.education.start')} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                <Input type="date" label={t('profile_modals.education.end')} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
        </FormModal>
    );
};

export const SkillModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ name: '', skill_type: 'hard' });
    const [loading, setLoading] = useState(false);

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
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData?.id ? t('profile_modals.skill.edit') : t('profile_modals.skill.add')} onSubmit={handleSubmit} loading={loading}>
            <Input
                label={t('profile_modals.skill.name')}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                autoComplete="off"
                placeholder={t('profile_modals.skill.placeholder') || "Enter skill (e.g. JavaScript, Public Speaking)"}
            />

            {!initialData?.skill_type && (
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.skill.type')}</label>
                    <select
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                        value={formData.skill_type}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, skill_type: e.target.value }));
                        }}
                    >
                        <option value="hard">{t('profile_modals.skill.hard')}</option>
                        <option value="soft">{t('profile_modals.skill.soft')}</option>
                    </select>
                </div>
            )}
        </FormModal>
    );
};

export const LanguageModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ name: '', level: 'a1' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name ?? '',
                level: initialData.level ?? 'a1',
                id: initialData.id,
            });
        } else {
            setFormData({ name: '', level: 'a1' });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? t('profile_modals.language.edit') : t('profile_modals.language.add')} onSubmit={handleSubmit} loading={loading}>
            <Input label={t('profile_modals.language.name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.language.level')}</label>
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
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ name: '', issuing_organization: '', issue_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name ?? '',
                issuing_organization: initialData.issuing_organization ?? '',
                issue_date: initialData.issue_date ?? '',
                id: initialData.id,
            });
        } else {
            setFormData({ name: '', issuing_organization: '', issue_date: '' });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? t('profile_modals.certificate.edit') : t('profile_modals.certificate.add')} onSubmit={handleSubmit} loading={loading}>
            <Input label={t('profile_modals.certificate.name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input label={t('profile_modals.certificate.org')} value={formData.issuing_organization} onChange={e => setFormData({ ...formData, issuing_organization: e.target.value })} required />
            <Input type="date" label={t('profile_modals.certificate.date')} value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} required />
        </FormModal>
    );
};

export const PasswordModal = ({ isOpen, onClose, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            setError(t('profile_modals.password.mismatch'));
            return;
        }
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(t('profile_modals.password.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('profile_modals.password.title')} onSubmit={handleSubmit} loading={loading}>
            <Input type="password" label={t('profile_modals.password.new')} value={formData.new_password} onChange={e => setFormData({ ...formData, new_password: e.target.value })} required />
            <Input type="password" label={t('profile_modals.password.confirm')} value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} required error={error} />
        </FormModal>
    );
};

export const ServiceModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ title: '', description: '', steps: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                steps: initialData.steps || [],
                id: initialData.id
            });
        }
        else setFormData({ title: '', description: '', steps: [] });
    }, [initialData, isOpen]);

    const handleStepChange = (index, val) => {
        const newSteps = [...formData.steps];
        newSteps[index] = val;
        setFormData({ ...formData, steps: newSteps });
    };

    const addStep = () => {
        setFormData({ ...formData, steps: [...formData.steps, ''] });
    };

    const removeStep = (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        setFormData({ ...formData, steps: newSteps });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // filter out empty steps
        const cleanedData = { ...formData, steps: formData.steps.filter(s => s.trim() !== '') };
        await onSave(cleanedData);
        setLoading(false);
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? t('profile_modals.service.edit') || 'Edit Service' : t('profile_modals.service.add') || 'Add Service'} onSubmit={handleSubmit} loading={loading}>
            <Input label={t('profile_modals.service.title') || 'Title'} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.service.description') || 'Description'}</label>
                <textarea 
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', minHeight: '80px', fontFamily: 'inherit' }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                />
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.service.steps') || 'Steps'}</label>
                {formData.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ padding: '8px 0', fontWeight: 'bold', color: '#666' }}>{idx + 1}.</span>
                        <input 
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                            value={step}
                            onChange={(e) => handleStepChange(idx, e.target.value)}
                            placeholder={t('profile_modals.service.step_placeholder') || 'Enter step...'}
                            required
                        />
                        <button type="button" onClick={() => removeStep(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer' }}>X</button>
                    </div>
                ))}
                <button type="button" onClick={addStep} style={{ background: '#f5f5f5', border: '1px dashed #d9d9d9', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginTop: '8px' }}>
                    + {t('profile_modals.service.add_step') || 'Add Step'}
                </button>
            </div>
        </FormModal>
    );
};
