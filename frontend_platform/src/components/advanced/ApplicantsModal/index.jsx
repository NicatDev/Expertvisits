import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import { User, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ApplicantsModal.module.scss';

const ApplicantsModal = ({ isOpen, onClose, vacancyId }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedApp, setExpandedApp] = useState(null); // ID of expanded application (motivation letter)

    useEffect(() => {
        if (isOpen && vacancyId) {
            fetchApplicants();
        }
    }, [isOpen, vacancyId]);

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const res = await business.getVacancyApplicants(vacancyId);
            setApplicants(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load applicants.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await business.updateApplicationStatus(appId, newStatus);
            toast.success(`Application ${newStatus}`);
            // Optimistic update
            setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status.");
        }
    };

    const toggleMotivation = (id) => {
        setExpandedApp(expandedApp === id ? null : id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#52c41a';
            case 'rejected': return '#f5222d';
            default: return '#faad14';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Applicants">
            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loading}>Loading applicants...</div>
                ) : applicants.length === 0 ? (
                    <div className={styles.empty}>No applications yet.</div>
                ) : (
                    <div className={styles.list}>
                        {applicants.map(app => (
                            <div key={app.id} className={styles.item}>
                                <div className={styles.header}>
                                    <div className={styles.userInfo}>
                                        {app.applicant_details.avatar ? (
                                            <img src={app.applicant_details.avatar} alt="Avatar" className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}><User size={20} /></div>
                                        )}
                                        <div>
                                            <div className={styles.name}>{app.applicant_details.full_name}</div>
                                            <div className={styles.username}>@{app.applicant_details.username}</div>
                                        </div>
                                    </div>
                                    <div className={styles.status} style={{ color: getStatusColor(app.status) }}>
                                        {app.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.motivationBtn} onClick={() => toggleMotivation(app.id)}>
                                        <FileText size={16} /> Motivation Letter {expandedApp === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {app.status === 'pending' && (
                                        <div className={styles.decisionBtns}>
                                            <Button size="small" onClick={() => handleStatusChange(app.id, 'accepted')} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                                                <Check size={16} /> Accept
                                            </Button>
                                            <Button size="small" type="default" onClick={() => handleStatusChange(app.id, 'rejected')} style={{ color: '#f5222d', borderColor: '#f5222d' }}>
                                                <X size={16} /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {expandedApp === app.id && (
                                    <div className={styles.motivation}>
                                        {app.motivation_letter}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ApplicantsModal;
