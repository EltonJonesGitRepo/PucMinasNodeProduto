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

app.get('/produtos', async (req, res) => {
    try {
        const produtos = await knex('produtos').select('*');
        res.json(produtos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao obter produtos');
    }
});

app.get('/produtos/:id', async (req, res) => {
    try {
        const produto = await knex('produtos').where({ id: req.params.id }).first();
        if (!produto) {
            res.status(404).send('Produto não encontrado');
        } else {
            res.json(produto);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao obter produto');
    }
});

app.post('/produtos', async (req, res) => {
    const { descricao, valor, marca } = req.body;
    if (!descricao || !valor || !marca) {
        res.status(400).send('Campos obrigatórios não informados');
        return;
    }
    try {
        const [id] = await knex('produtos').insert({ descricao, valor, marca });
        const produto = await knex('produtos').where({ id }).first();
        res.status(201).json(produto);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao incluir produto');
    }
});

app.put('/produtos/:id', async (req, res) => {
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

app.delete('/produtos/:id', async (req, res) => {
    try {
        const quantidadeDeProdutosExcluidos = await knex('produtos').where({ id: req.params.id }).delete();
        if (quantidadeDeProdutosExcluidos === 0) {
            res.status(404).send('Produto não encontrado');
        } else {
            res.send('Produto excluído com sucesso');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao excluir produto');
    }
});

app.listen(3000, () => {
    console.log('API rodando na porta 3000');
});
