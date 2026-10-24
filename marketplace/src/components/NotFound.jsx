import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <section className="notfound-wrapper">
            <div className="notfound-container">
                <h2 className="notfound-code">404</h2>
                <p className="notfound-text">No encontramos la página que buscás.</p>
                <Link to="/products" className="notfound-btn">Ver figuras</Link>
            </div>
        </section>
    );
};

export default NotFound;
