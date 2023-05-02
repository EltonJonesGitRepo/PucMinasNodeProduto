const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './dev.sqlite3'
    }
});

const app = express();
app.use(bodyParser.json());

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

app.listen(3000, () => {
    console.log('API rodando na porta 3000');
});
