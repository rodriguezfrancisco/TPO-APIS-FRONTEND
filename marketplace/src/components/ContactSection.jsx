import { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
    // Estados locales para controlar todos los inputs del formulario
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('Consulta sobre una figura');
    const [message, setMessage] = useState('');

    // Estados para errores y modal de confirmación (sin usar alert)
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
            setError('Por favor completá todos los campos antes de enviar.');
            return;
        }

        setError(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setName('');
        setEmail('');
        setTopic('Consulta sobre una figura');
        setMessage('');
    };

    return (
        <section className="contact-wrapper">
            <div className="contact-container">

                {/* 1. Cabecera */}
                <div className="contact-header-row">
                    <h1 className="contact-main-title">Contacto</h1>
                    <div className="contact-halftone-bar"></div>
                </div>

                {/* 2. Grilla de dos columnas: Información + Formulario */}
                <div className="contact-grid">

                    {/* Columna Izquierda: Tarjetas de contacto */}
                    <div className="contact-info-column">
                        <div className="contact-card halftone-card-bg">
                            <div className="contact-Stamp">ゴゴゴ</div>
                            <h2 className="contact-card-title">¿Necesitás ayuda con tu pedido?</h2>
                            <p className="contact-card-text">
                                Escribinos si tenés dudas sobre el stock de una edición limitada, envíos o cómo publicar tus figuras como vendedor.
                            </p>
                        </div>

                        <div className="contact-details-list">
                            <div className="contact-detail-box">
                                <span className="detail-tag">ATENCIÓN ONLINE</span>
                                <p className="detail-value">soporte@gogogomarket.com.ar</p>
                                <span className="detail-sub">Lunes a viernes de 9:00 a 18:00 hs</span>
                            </div>

                            <div className="contact-detail-box">
                                <span className="detail-tag">PUNTO DE RETIRO</span>
                                <p className="detail-value">Lima 757 — Monserrat, CABA</p>
                                <span className="detail-sub">Retiro sin cargo presentando tu número de orden</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario controlado */}
                    <div className="contact-form-box">
                        <h2 className="contact-form-title">Envianos un mensaje</h2>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <label className="contact-label" htmlFor="contact-name">Nombre</label>
                            <input
                                id="contact-name"
                                type="text"
                                name="name"
                                className="contact-field"
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label className="contact-label" htmlFor="contact-email">Email</label>
                            <input
                                id="contact-email"
                                type="email"
                                name="email"
                                className="contact-field"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label className="contact-label" htmlFor="contact-topic">Motivo</label>
                            <select
                                id="contact-topic"
                                name="topic"
                                className="contact-field"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            >
                                <option value="Consulta sobre una figura">Consulta sobre una figura</option>
                                <option value="Estado de mi pedido">Estado de mi pedido</option>
                                <option value="Quiero vender en Gogogo Market">Quiero vender en Gogogo Market</option>
                                <option value="Otro motivo">Otro motivo</option>
                            </select>

                            <label className="contact-label" htmlFor="contact-message">Mensaje</label>
                            <textarea
                                id="contact-message"
                                name="message"
                                rows="4"
                                className="contact-field"
                                placeholder="Contanos en qué podemos ayudarte..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />

                            {error && <p className="contact-error" role="alert">{error}</p>}

                            <button type="submit" className="contact-submit-btn">
                                Enviar consulta
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* Modal estético de confirmación (reemplaza al alert nativo) */}
            {showModal && (
                <div className="contact-modal-overlay" onClick={handleCloseModal}>
                    <div className="contact-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="contact-modal-badge">ゴ</div>
                        <h3 className="contact-modal-title">¡Mensaje enviado!</h3>
                        <p className="contact-modal-text">
                            Gracias por escribirnos, <strong>{name}</strong>. Te responderemos a <strong>{email}</strong> a la brevedad.
                        </p>
                        <button type="button" className="contact-submit-btn" onClick={handleCloseModal}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ContactSection;