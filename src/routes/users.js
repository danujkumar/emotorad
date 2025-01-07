const express = require('express');
const bodyParser = require('body-parser');
const { identify } = require('../controllers/service');
const router = express.Router();

const app = express();
app.use(bodyParser.json());

//The end point as given in the problem statement

router.post('/identify', identify);

module.exports = router;