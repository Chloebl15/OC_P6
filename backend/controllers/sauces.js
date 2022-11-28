const Sauce = require('../Models/Sauce');
const fs = require('fs'); //(unlink delete)


exports.createSauce = (req, res, next) => { //formulaire      //2
  console.log('reqbody', req.body)   //besoin de json parse app.use(express.json()); pour faire fonctionner req body
  const sauceObject = JSON.parse(req.body.sauce); //parser l'objet avec json parse
  delete sauceObject._id; //supprimer dans l'objet deux champs (_id) et 
  delete sauceObject._userId; //userid = personne qui a créé l'objet (nous allon utiliser le userid du token )
  const sauce = new Sauce({ //on créé l'objet 
      ...sauceObject, //Avec ce qui a été passé moins les deux champs supprimés
      userId: req.auth.userId, //le user id extrait de l'objet requête grace au middleware
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //générer l'url par nous même avec le protocol, le nom d'hote, le nom du fichier tel qui nous est donné par multer
  });

  sauce.save() //enregistrer l'objet dans la base de données
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};


exports.getAllSauces = (req, res, next) =>  { //récupérer dans la base de données ! 1
    Sauce.find() //on veut la liste complète donc on utilise find()
    .then(sauce => res.status(200).json(sauce)) //récupérer le tableau de tous les sauces
    .catch(error => res.status(400).json({ error }));
  }

  exports.getOneSauce = (req, res, next) => { //retrouver un seul objet par son identifiant
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
  }


  exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? { //extraction de l'objet, on regarde si il y a un champs file
        ...JSON.parse(req.body.sauce), //si c'est le cas on le recupère en parsant la chaine de caractère 
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //et en recréant l'url de l'image
    } : { ...req.body }; // Si il n'y a pas d'objet de transmis, on le récupère directement dans le corps de la requête
  
    delete sauceObject._userId; //supprimer le userID de la requête (éviter que quelqu'un créé un objet à son nom puis le modifie pour le réassigner à quelqu'un d'autre > mesure de sécurité)
    Sauce.findOne({_id: req.params.id}) //chercher l'objet dans la base de données (voir si c'est lutilisateur a qui appartient l'objet qui veut le modifier)
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) { // si le champs user id qu'on a recuperer dans la base est différent de userid qui vient du token > quelqu'un essaie de modifier un objet qui ne lui appartient pas
                res.status(401).json({ message : 'Not authorized'}); //message d'erreur
            } else { //si c'est le bon utilisateur
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id}) //mettre à jour l'enregistrement > nous passons le filtre qui va dire quel est l'enregistrement à mettre à jour et avec quel objet
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
  };


  exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id}) //vérifier les droits > récupérer l'objet en base 
        .then(sauce => { 
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];  // récupérer l'url enregistrer avec split autour du repertoire image 
                fs.unlink(`images/${filename}`, () => { //unlink > importer avec const fs = require('fs'); + callback appelé une fois que la suppression a eu lieu> asynchrone
                    Sauce.deleteOne({_id: req.params.id}) //supprimer enregistrement dans la  base de données
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
      }


  exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (req.body.like === 1) {
                if (sauce.usersLiked.includes(req.body.userId)) 
                {
                    res.status(401).json({error: 'Sauce déja liké'});
                }
                else
                {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ }, $push: { usersLiked: req.body.userId } })
                        .then((sauce) => res.status(200).json({ message: 'Like ajouté !' }))
                        .catch(error => res.status(400).json({ error }))
                }

            } 
            else if (req.body.like === -1) {
                if (sauce.usersDisliked.includes(req.body.userId)) {
                    res.status(401).json({error: 'Sauce déja disliké'});
                }
                else
                {   
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 }, $push: { usersDisliked: req.body.userId } })
                        .then((sauce) => res.status(200).json({ message: 'Dislike ajouté !' }))
                        .catch(error => res.status(400).json({ error }));
                }
            } 
            else 
            {
                if (sauce.usersLiked.includes(req.body.userId)) 
                {
                    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
                        .then((sauce) => { res.status(200).json({ message: 'Like supprimé !' }) })
                        .catch(error => res.status(400).json({ error }));
                } 
                else if (sauce.usersDisliked.includes(req.body.userId)) 
                {
                    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                            .then((sauce) => { res.status(200).json({ message: 'Dislike supprimé !' }) })
                            .catch(error => res.status(400).json({ error }));
                }
            }
        })
        .catch(error => res.status(400).json({ error }));   
}