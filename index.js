
require('dotenv').config()

const express = require('express');
const morgan = require ('morgan')
const helmet = require ('helmet')
const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')


const bodyParser = require('body-parser');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './dev.sqlite3'
    }
});

const app = express();
app.use(bodyParser.json());


app.use (morgan("tiny"))
app.use (helmet())


const checkToken = (req, res, next) => {
    let authInfo = req.get('authorization')
    console.log(authInfo);
    if (authInfo) {
      const [bearer, token] = authInfo.split(' ')
      
      if (!/Bearer/.test(bearer)) {
        res.status(400).json({ message: 'Tipo de token esperado não informado...', error: true })
        return 
      }
  
      jwt.verify(token, process.env.SECRET_KEY, (err, decodeToken) => {
          if (err) {
              res.status(401).json({ message: 'Acesso negado'})
              return
          }
          req.usuarioId = decodeToken.id
          req.roles = decodeToken.roles
          next()
      })
    } 
    else
      res.status(401).json({ message: 'Acesso negado'})
  };

  const isAdmin  = (req, res, next) => {
    if (req.roles?.split(';').includes('ADMIN')){
        next()
    }
    else {
        res.status(403).json({ message: 'Acesso negado'})
    }
  };


// Cria um manipulador da rota padrão 
app.get('/v1/produtos', checkToken, function (req, res) {    
    knex.select('*').from('produtos')
    .then (produtos => res.json(produtos))
    .catch (err => res.json ({ message: `Erro ao recuperar produtos: ${err.message}` }))
  });

  app.post('/v1/produtos', checkToken, isAdmin, function (req, res) {
    knex('produtos').insert(req.body, ['id'])
    .then (produtos => {
      let id = produtos[0].id
      res.json({ message: `Produto inserido com sucesso.`, id  })
    })
    .catch (err => res.json ({ message: `Erro ao inserir produto: ${err.message}` }))
  });

  app.get('/v1/produtos/:id', checkToken, function (req, res) {
    let id = req.params.id
    knex.select('*').from('produtos').where({ id })
    .then (produtos => res.json(produtos))
    .catch (err => res.json ({ message: `Erro ao recuperar produtos: ${err.message}` }))
  });

  app.put('/v1/produtos/:id', checkToken, isAdmin, async (req, res) => {
    const { descricao, valor, marca } = req.body;
    if (!descricao || !valor || !marca) {
        res.status(400).send('Campos obrigatórios não informados');
        return;
    }
    try {
        const quantidadeDeProdutosAtualizados = await knex('produtos')
            .where({ id: req.params.id })
            .update({ descricao, valor, marca });
        if (quantidadeDeProdutosAtualizados === 0) {
            res.status(404).send('Produto não encontrado');
        } else {
            const produto = await knex('produtos').where({ id: req.params.id }).first();
            res.json(produto);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao atualizar produto');
    }
});


app.delete('/v1/produtos/:id', checkToken, isAdmin, async (req, res) => {
    try {
        const quantidadeDeProdutosExcluidos = await knex('produtos').where({ id: req.params.id }).delete();
        if (quantidadeDeProdutosExcluidos === 0) {
            res.status(404).send('Produto não encontrado');
        } else {
            res.send('Produto excluído com sucesso');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao excluir Produto');
    }
});


  app.post('/v1/seguranca/register', function (req, res) {
    knex('usuarios').insert({
          nome: req.body.nome, 
          login: req.body.login, 
          senha: bcrypt.hashSync(req.body.senha, 8), 
          email: req.body.email,
          roles: req.body.roles
      }, ['id'])
      .then((result) => {
          let usuario = result[0]
          res.status(200).json({
            "message": "Usuário inserido com sucesso",
            "id": usuario.id }) 
          return
      })
      .catch(err => {
          res.status(500).json({ 
              message: 'Erro ao registrar usuario - ' + err.message })
      })  
  });


  app.post('/seguranca/login', function (req, res) {
  knex
  .select('*').from('usuarios').where( { login: req.body.login })
  .then( usuarios => {
      if(usuarios.length){
          let usuario = usuarios[0]
          let checkSenha = bcrypt.compareSync (req.body.senha, usuario.senha)
          if (checkSenha) {
             var tokenJWT = jwt.sign({ id: usuario.id, roles: usuario.roles }, 
                  process.env.SECRET_KEY, {
                    expiresIn: 3600
                  })

              res.status(200).json ({
                  id: usuario.id,
                  login: usuario.login, 
                  nome: usuario.nome, 
                  roles: usuario.roles,
                  token: tokenJWT
              })  
              return 
          }
      } 
        
      res.status(401).json({ message: 'Login ou senha incorretos' })
  })
  .catch (err => {
      res.status(500).json({ 
         message: 'Erro ao verificar login - ' + err.message })
  })

});
  

app.listen(3001, () => {
    console.log('API rodando na porta 3001');
});
