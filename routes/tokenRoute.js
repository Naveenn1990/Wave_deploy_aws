const express = require("express");
const  router = express.Router();

const tokenController=require('../controllers/tokenController');

router.post('/',tokenController.createToken);
router.get('/',tokenController.getAllTokens);
router.put('/:id',tokenController.updateToken);
router.delete('/:id',tokenController.deleteToken);
router.get('/user/:userId',tokenController.gettokentByuserid);
router.get('/stats/overview',tokenController.tokenOverView);


module.exports = router;
