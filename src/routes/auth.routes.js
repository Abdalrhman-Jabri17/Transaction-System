const routes = require('express').Router();
const { register, login } = require('../controller/auth.controller');

routes.post('/register', register);
routes.post('/login', login);

module.exports = routes;