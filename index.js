
require('dotenv').config()

const express = require('express');
const morgan = require ('morgan')
const helmet = require ('helmet')
const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')

const routerAPIv2 = require ('./routes/routerAPI-v2')
//app.use ('/api/v2', routerAPIv2)

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

// app.use (function (req, res) {
//     res.status(404).send ('Recurso não encontrado.')
//   })


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
  }


app.get('/carros', async (req, res) => {
    try {
        const carros = await knex('carros').select('*');
        res.json(carros);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao obter carros');
    }
});

app.get('/carros/:id', async (req, res) => {
    try {
        const carro = await knex('carros').where({ id: req.params.id }).first();
        if (!carro) {
            res.status(404).send('Carro não encontrado');
        } else {
            res.json(carro);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao obter carro');
    }
});

app.post('/carros', async (req, res) => {
    const { descricao, valor, marca } = req.body;
    if (!descricao || !valor || !marca) {
        res.status(400).send('Campos obrigatórios não informados');
        return;
    }
    try {
        const [id] = await knex('carros').insert({ descricao, valor, marca });
        const carro = await knex('carros').where({ id }).first();
        res.status(201).json(carro);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao incluir carro');
    }
});

app.put('/carros/:id', async (req, res) => {
    const { descricao, valor, marca } = req.body;
    if (!descricao || !valor || !marca) {
        res.status(400).send('Campos obrigatórios não informados');
        return;
    }
    try {
        const quantidadeDeCarrosAtualizados = await knex('carros')
            .where({ id: req.params.id })
            .update({ descricao, valor, marca });
        if (quantidadeDeCarrosAtualizados === 0) {
            res.status(404).send('Carro não encontrado');
        } else {
            const carro = await knex('carros').where({ id: req.params.id }).first();
            res.json(carro);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao atualizar carro');
    }
});

app.delete('/carros/:id', async (req, res) => {
    try {
        const quantidadeDeCarrosExcluidos = await knex('carros').where({ id: req.params.id }).delete();
        if (quantidadeDeCarrosExcluidos === 0) {
            res.status(404).send('Carro não encontrado');
        } else {
            res.send('Carro excluído com sucesso');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao excluir Carro');
    }
});

// Cria um manipulador da rota padrão 
app.get('/produtos', checkToken, function (req, res) {
    //app.get('/produtos', function (req, res) {
    knex.select('*').from('produtos')
    .then (produtos => res.json(produtos))
    .catch (err => res.json ({ message: `Erro ao recuperar produtos: ${err.message}` }))
  });



  app.post('/seguranca/register', function (req, res) {
    knex('usuarios').insert({
          nome: req.body.nome, 
          login: req.body.login, 
          senha: bcrypt.hashSync(req.body.senha, 8), 
          email: req.body.email,
          roles: "USER"
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
