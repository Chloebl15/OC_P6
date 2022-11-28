const express = require ('express');
const app = express();
const mongoose = require('mongoose')
const path = require('path'); //accéder au path du serveur 

const userRoutes = require('./routes/user');
const saucesRoutes = require('./routes/sauces');

app.use(express.json());

mongoose.connect('mongodb+srv://Chloe:unmotdepasse@cluster0.cqp7yde.mongodb.net/test?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));



// middleware général > permettre l'application d'accéder à l'API 
app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*'); // * > tout le monde = accéder à l'api depuis n'importe quelle origine (*)
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'); // ajouter les headers mentionnés aux requêtes envoyées vers notre API (origin , x .. )
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS'); // envoyer les requêtes avec les methodes mentionnées , get, post etc
   next();
 });

/* app.use('/api/stuff', stuffRoutes); */
app.use('/api/auth', userRoutes);
app.use('/api/sauces', saucesRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));
module.exports = app;

