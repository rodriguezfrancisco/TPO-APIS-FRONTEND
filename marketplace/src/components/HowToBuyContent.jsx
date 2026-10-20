import { useState } from 'react';
import { Link } from 'react-router-dom';
import './HowToBuyContent.css';

const FAQS = [
    {
        question: '¿Las figuras son originales y nuevas?',
        answer: 'Todas las publicaciones indican el estado y los parámetros de cada figura en su vista de detalle. Podés ver fotos reales cargadas por cada vendedor antes de agregar al carrito.'
    },
    {
        question: '¿Qué pasa si quiero comprar más unidades de las que hay en stock?',
        answer: 'El sistema valida el stock en tiempo real. Si queda una sola unidad disponible, no se repite en el pedido y una vez confirmado el checkout se descuenta automáticamente.'
    },
    {
        question: '¿Cómo puedo publicar mis propias figuras en Gogogo Market?',
        answer: 'Solo tenés que crear una cuenta seleccionando el rol "Vendedor" en el registro. Desde el Panel de Vendedor vas a poder subir fotos, fijar precios, manejar el stock y aplicar descuentos.'
    },
    {
        question: '¿Cuánto demora el envío a domicilio?',
        answer: 'Los envíos sin cargo se despachan dentro de las 24 hs hábiles posteriores a confirmar el pedido, o podés optar por retirar directamente en el punto de entrega.'
    }
];

const HowToBuyContent = () => {
    // Estado local para abrir/cerrar preguntas frecuentes
    const [openFaq, setOpenFaq] = useState(0);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="howto-page">
            <section className="howto-wrapper">
                <div className="howto-container">

                    {/* 1. Cabecera con barra de trama de puntos */}
                    <div className="howto-header-row">
                        <h1 className="howto-main-title">Cómo comprar</h1>
                        <div className="howto-halftone-bar"></div>
                    </div>

                    {/* 2. Las 3 viñetas principales del boceto */}
                    <div className="howto-steps-grid">

                        {/* Viñeta 1 */}
                        <article className="howto-panel panel-one">
                            <span className="panel-number number-light">1</span>
                            <div className="panel-card card-dark">
                                <h2 className="panel-title">Elegí</h2>
                                <p className="panel-text">
                                    Filtrá por obra o precio y abrí la figura para ver sus parámetros.
                                </p>
                            </div>
                        </article>

                        {/* Viñeta 2 */}
                        <article className="howto-panel panel-two">
                            <span className="panel-number number-light">2</span>
                            <div className="panel-card card-dark">
                                <h2 className="panel-title">Agregá</h2>
                                <p className="panel-text">
                                    Sumala al carrito. Si es la última, no se repite en el pedido.
                                </p>
                            </div>
                        </article>

                        {/* Viñeta 3 */}
                        <article className="howto-panel panel-three">
                            <span className="panel-number number-dark">3</span>
                            <div className="panel-card card-light">
                                <h2 className="panel-title">Confirmá</h2>
                                <p className="panel-text">
                                    Cargá tus datos, elegí cómo pagar y listo.
                                </p>
                            </div>
                        </article>

                    </div>

                    {/* 3. Sección extra: Medios de pago, envíos y vendedores */}
                    <div className="howto-info-grid">
                        <div className="howto-info-box">
                            <span className="info-badge">PAGOS</span>
                            <h3 className="info-title">Medios de pago aceptados</h3>
                            <p className="info-desc">
                                Podés abonar con tarjeta de crédito o débito, transferencia bancaria inmediata o en efectivo en puntos de pago habilitados al momento del checkout.
                            </p>
                        </div>

                        <div className="howto-info-box">
                            <span className="info-badge">ENVÍOS</span>
                            <h3 className="info-title">Entregas y retiros</h3>
                            <p className="info-desc">
                                ¡Tenés envío gratis a domicilio en tus pedidos! También podés seleccionar retiro por sucursal sin costo adicional al confirmar tu compra.
                            </p>
                        </div>

                        <div className="howto-info-box">
                            <span className="info-badge">VENDEDORES</span>
                            <h3 className="info-title">¿Querés vender figuras?</h3>
                            <p className="info-desc">
                                Registrate con una cuenta de tipo Vendedor para publicar tu colección, subir múltiples fotos y aplicar descuentos especiales.
                            </p>
                        </div>
                    </div>

                    {/* 4. Sección extra: Preguntas Frecuentes interactivas */}
                    <div className="howto-faq-section">
                        <h2 className="howto-subtitle">Preguntas frecuentes</h2>
                        <div className="howto-faq-list">
                            {FAQS.map((item, index) => (
                                <div key={index} className="faq-item">
                                    <button
                                        type="button"
                                        className="faq-question"
                                        onClick={() => toggleFaq(index)}
                                    >
                                        <span>{item.question}</span>
                                        <span className="faq-icon">{openFaq === index ? '−' : '+'}</span>
                                    </button>
                                    {openFaq === index && (
                                        <p className="faq-answer">{item.answer}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botón de llamada a la acción */}
                    <div className="howto-cta-row">
                        <Link to="/products" className="howto-cta-btn">
                            Ir al catálogo de figuras
                        </Link>
                    </div>

                </div>
            </section>

            
        </div>
    );
};

export default HowToBuyContent;