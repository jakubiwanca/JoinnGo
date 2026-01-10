import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const EventDetailsPage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axiosClient.get(`/Event/${id}`)
            .then(response => {
                setEvent(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Nie udało się pobrać wydarzenia.");
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="text-center mt-5">Ładowanie danych...</div>;
    if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
    if (!event) return null;

    const participantsList = event.eventParticipants || []; 
    
    const takenSpots = participantsList.length;
    const isFull = event.maxParticipants > 0 && takenSpots >= event.maxParticipants;

    return (
        <div className="container mt-5">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
                &larr; Wróć
            </button>

            <div className="card shadow-sm">
                <div className="card-body p-5">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <span className="badge bg-primary mb-2">
                                {typeof event.category === 'object' ? event.category.name : event.category}
                            </span>
                            <h1 className="display-4 fw-bold">{event.title}</h1>
                            <p className="text-muted">
                                Organizator (ID): <strong>{event.creatorId}</strong>
                                {event.creator && <span> ({event.creator.email})</span>}
                            </p>
                        </div>
                        <div className={`badge ${event.isPrivate ? 'bg-secondary' : 'bg-success'} p-2`}>
                            {event.isPrivate ? 'Prywatne' : 'Publiczne'}
                        </div>
                    </div>

                    <hr className="my-4" />

                    <div className="row">
                        <div className="col-md-8">
                            <h4>Opis wydarzenia</h4>
                            <p className="lead fs-6" style={{ whiteSpace: 'pre-wrap' }}>
                                {event.description}
                            </p>
                        </div>

                        <div className="col-md-4 border-start">
                            <ul className="list-unstyled">
                                <li className="mb-3">
                                    <strong>📍 Miasto:</strong> <br /> {event.city}
                                </li>
                                <li className="mb-3">
                                    <strong>📍 Lokalizacja:</strong> <br /> {event.location}
                                </li>
                                <li className="mb-3">
                                    <strong>📅 Data:</strong> <br /> {new Date(event.date).toLocaleString()}
                                </li>
                                <li className="mb-3">
                                    <strong>👥 Uczestnicy:</strong> <br />
                                    <span className={isFull ? "text-danger fw-bold" : "text-success fw-bold"}>
                                        {takenSpots} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""}
                                    </span>
                                </li>
                            </ul>

                            <button 
                                className="btn btn-primary w-100 mt-3" 
                                disabled={isFull}
                                onClick={() => alert("Tutaj dodamy funkcję Join w kolejnym kroku!")}
                            >
                                {isFull ? "Brak miejsc" : "Dołącz do wydarzenia"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsPage;