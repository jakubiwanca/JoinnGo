import React, { useState } from 'react';
import apiClient from '../api/axiosClient';

const Comments = ({ eventId, comments, onCommentPosted, currentUserId }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await apiClient.post(`event/${eventId}/comments`, { content: newComment });
            onCommentPosted(response.data);
            setNewComment('');
        } catch (err) {
            alert(err.response?.data?.message || 'Nie udało się dodać komentarza.');
        } finally {
            setIsSubmitting(false);
        }
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
                                <strong style={{ color: 'var(--text-dark)' }}>{comment.userEmail}</strong>
                                <small style={{ color: 'var(--text-secondary)' }}>{new Date(comment.createdAt).toLocaleString()}</small>
                            </div>
                            <p style={{ margin: 0 }}>{comment.content}</p>
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
        </div>
    );
};

export default Comments;
