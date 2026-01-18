import React, { useState } from 'react';
import apiClient from '../api/axiosClient';
import ConfirmModal from './ConfirmModal';

const Comments = ({ eventId, comments, onCommentPosted, onCommentUpdated, onCommentDeleted, currentUserId }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        danger: false,
    });

    const showConfirm = (title, message, onConfirm, danger = false) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, danger });
    };

    const hideConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false, onConfirm: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await apiClient.post(`event/${eventId}/comments`, { content: newComment });
            onCommentPosted(response.data);
            setNewComment('');
        } catch (err) {
            showConfirm('Błąd', err.response?.data?.message || 'Nie udało się dodać komentarza.', hideConfirm);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleUpdate = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            await apiClient.put(`event/comments/${commentId}`, { content: editContent });
            onCommentUpdated({ id: commentId, content: editContent });
            cancelEdit();
        } catch (err) {
             showConfirm('Błąd', 'Nie udało się zaktualizować komentarza.', hideConfirm);
        }
    };

    const handleDelete = (commentId) => {
        showConfirm(
            'Usuń komentarz',
            'Czy na pewno chcesz usunąć ten komentarz?',
            async () => {
                 hideConfirm();
                 try {
                     await apiClient.delete(`event/comments/${commentId}`);
                     onCommentDeleted(commentId);
                 } catch (err) {
                     showConfirm('Błąd', 'Nie udało się usunąć komentarza.', hideConfirm);
                 }
            },
            true
        );
    };

    return (
        <div className="comments-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Komentarze</h3>
            <div className="comments-list" style={{ marginBottom: '1.5rem' }}>
                {comments.length === 0 ? (
                    <p>Brak komentarzy.</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="comment-item" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                            <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div>
                                    <strong style={{ color: 'var(--text-dark)', marginRight: '10px' }}>{comment.userEmail}</strong>
                                    <small style={{ color: 'var(--text-secondary)' }}>{new Date(comment.createdAt).toLocaleString()}</small>
                                </div>
                                {currentUserId === comment.userId && !editingCommentId && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => startEdit(comment)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: '0.9rem' }}
                                        >
                                            Edytuj
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(comment.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem' }}
                                        >
                                            Usuń
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {editingCommentId === comment.id ? (
                                <div className="edit-form" style={{ marginTop: '10px' }}>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        style={{ width: '100%', minHeight: '60px', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleUpdate(comment.id)} 
                                            className="btn-primary"
                                            style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                                        >
                                            Zapisz
                                        </button>
                                        <button 
                                            onClick={cancelEdit} 
                                            className="btn-secondary"
                                            style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                                        >
                                            Anuluj
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ margin: 0 }}>{comment.content}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="comment-form">
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Napisz komentarz..."
                        required
                        style={{ width: '100%', minHeight: '80px', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Publikowanie...' : 'Opublikuj'}
                    </button>
                </form>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={hideConfirm}
                danger={confirmModal.danger}
            />
        </div>
    );
};

export default Comments;
