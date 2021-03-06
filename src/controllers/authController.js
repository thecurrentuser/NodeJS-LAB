const express = require('express');
const User = require('./../model/user');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authConfig = require('./../config/auth');

function generateToken(params = {}) {
   return jwt.sign(params, authConfig.secret, {
      expiresIn: 86400
   });
}

// Pegar parametros do usuario e repassar para user.Create
router.post('/register', async (req, res) => {
   // Adicionar uma validacao para aparecer uma mensagem mais "amigavel"
   // Caso já exista um usuario com email cadastrado
   const { email } = req.body;

   try {
      if (await User.findOne({ email }))
         return res.status(400).send({ error: 'user already exists' });
      const user = await User.create(req.body);
      //Apagar password assim que o usuario for criado para nao sair no res
      user.password = undefined;
      return res.send({ user, token: generateToken({ id: user.id })});
   } catch (error) {
      return res.status(400).send({ error: 'registration failed' });
   }
});

router.post('/authenticate', async (req, res) => {
   const { email, password } = req.body;
   const user = await User.findOne({ email }).select('+password');
   // Validacoes do usuario

   if (!user) {
      return res.status(400).send({ error: 'User not found' });
   }

   if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send({ error: 'Invalid password' });

   user.password = undefined;

   res.send({ user, token: generateToken({ id: user.id }) });
});

module.exports = app => app.use('/auth', router);
