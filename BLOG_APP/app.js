const express = require('express');
const session = require('express-session');
const path = require('node:path');
const flash = require('connect-flash');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const connectDb = require('./src/config/database');

require('./src/config/passport');

const app = express();

// **Configuration de base**
app.use(cors({
    origin: process.env.IMAGE_SERVER_URL || 'http://localhost:4000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Logs environnement dev
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// **Configuration des fichiers statiques**
app.use(express.static(path.join(__dirname, 'public')));

// **Configuration EJS et layouts**
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// **Initialisation de l'application**
const initializeApp = async () => {
    try {
        // **Connexion à la base de données**
        await connectDb();

        // **Configuration de la session**
        app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24, // 1 jour
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true
            }
        }));

        app.use(flash());

        // **Middleware JWT**
        app.use((req, res, next) => {
            const token = req.cookies.token;

            if (!token) {
                res.locals.user = null;
                req.user = null;
                return next();
            }

            try {
                const { verifyToken } = require('./src/config/jwt');
                const decoded = verifyToken(token);

                if (decoded) {
                    req.user = decoded;
                    res.locals.user = decoded;
                } else {
                    res.clearCookie('token');
                    req.user = null;
                    res.locals.user = null;
                }
            } catch (error) {
                console.error('Erreur JWT:', error);
                res.clearCookie('token');
                req.user = null;
                res.locals.user = null;
            }
            next();
        });

        // **Middleware pour les messages flash**
        app.use((req, res, next) => {
            res.locals.messages = {
                success: req.flash('success'),
                error: req.flash('error')
            };
            res.locals.formData = req.flash('formData')[0] || {};
            next();
        });

        // **Configuration des variables d'environnement**
        app.use((req, res, next) => {
            res.locals.imageServerConfig = {
                url: process.env.IMAGE_SERVER_URL,
                clientId: process.env.IMAGE_CLIENT_ID,
                clientSecret: process.env.IMAGE_CLIENT_SECRET
            };
            next();
        });

        // **Routes**
        const blogRoutes = require('./src/routes/blog.routes');
        const mfaRoutes = require('./src/routes/mfa.routes');
        const authRoutes = require('./src/routes/auth.routes');

        app.use('/auth', authRoutes);
        app.use('/auth/2fa', mfaRoutes);
        app.use('/blogs', blogRoutes);

        app.get('/', (req, res) => {
            res.redirect('/blogs');
        });

        // **Initialisation de Passport**
        app.use(passport.initialize());
        app.use(passport.session());

        // **Gestion des 404**
        app.use((req, res) => {
            res.status(404).render('404', {
                title: 'Page non trouvée',
                error: 'La page que vous recherchez n\'existe pas.'
            });
        });

        // **Gestion globale des erreurs**
        app.use((err, req, res, next) => {
            console.error('Erreur globale:', err);

            const statusCode = err.status || 500;
            const errorMessage = process.env.NODE_ENV === 'development'
                ? err.message
                : 'Une erreur inattendue est survenue';

            if (req.xhr) {
                return res.status(statusCode).json({ error: errorMessage });
            }

            res.status(statusCode).render('error', {
                title: 'Erreur',
                error: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? err.stack : null
            });
        });
    } catch (error) {
        console.error('🚫 Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
};

// **Lancer l'initialisation**
initializeApp().catch(error => {
    console.error('💥 Erreur fatale lors de l\'initialisation:', error);
    process.exit(1);
});

module.exports = app;
